import { ethers, BigNumber } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();
import registryABI from "../abis/Registry.json";
import riskEngineABI from "../abis/RiskEngine.json";
import { PriceEngineService } from "./priceEngine.service";
import axios from "axios";
import addressConfig from "../config/address.config.json";
import { Contract, Provider } from "ethcall";

const REGISTRY = process.env.REGISTRY;
const RISK_ENGINE = process.env.RISK_ENGINE;
const RPC_URL = process.env.RPC_URL;
const ACCOUNT_MANAGER = process.env.ACCOUNT_MANAGER;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL, "arbitrum");

const registryContract = new Contract(REGISTRY, registryABI);
const riskEngineContract = new Contract(RISK_ENGINE, riskEngineABI);

const WETH_ADDRESS = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

export class AccountService {
  constructor(
    private priceEngineService: PriceEngineService = new PriceEngineService()
  ) {}

  getActiveConstants(): string[] {
    return Object.values(addressConfig);
  }

  async getAllAccounts(): Promise<string[]> {
    const ethersRegistryContract = new ethers.Contract(
      REGISTRY,
      registryABI,
      provider
    );
    return await ethersRegistryContract.getAllAccounts();
  }

  async getAccountBalances(
    accounts: string[],
    tokenPrices: Map<string, number>
  ): Promise<{ borrows: number; balances: number }[]> {
    const ethcallProvider = new Provider();
    await ethcallProvider.init(provider);
    const accountBorrows: BigNumber[] = await ethcallProvider.all(
      accounts.map((account) => riskEngineContract.getBorrows(account))
    );
    const accountBalances: BigNumber[] = await ethcallProvider.all(
      accounts.map((account) => riskEngineContract.getBalance(account))
    );
    const wethPrice = tokenPrices.get(WETH_ADDRESS.toLowerCase());
    return accounts.map((account, i) => {
      return {
        borrows:
          Number(ethers.utils.formatUnits(accountBorrows[i], 18)) * wethPrice,
        balances:
          Number(ethers.utils.formatUnits(accountBalances[i], 18)) * wethPrice,
      };
    });
  }

  async getAccountDeposits(
    account: string,
    userAddress: string,
    tokenPrices: Map<string, number>
  ): Promise<number> {
    const depositData = JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          fromAddress: `${userAddress}`,
          toAddress: `${account}`,
          category: ["erc20"],
        },
      ],
    });

    const withdrawData = JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          fromAddress: `${account}`,
          toAddress: `${userAddress}`,
          category: ["erc20"],
        },
      ],
    });

    const ethDepositData = JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          fromAddress: `${userAddress}`,
          toAddress: `${ACCOUNT_MANAGER}`,
          category: ["external"],
        },
      ],
    });

    const ethWithdrawData = JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          fromAddress: `${account}`,
          toAddress: `${userAddress}`,
          category: ["internal"],
        },
      ],
    });

    let deposits,
      withdraws,
      ethDeposits,
      ethWithdraws,
      depositValue = 0,
      withdrawValue = 0;

    try {
      const responses = await Promise.all([
        axios(RPC_URL, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          data: depositData,
        }),
        axios(RPC_URL, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          data: withdrawData,
        }),
        axios(RPC_URL, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          data: ethDepositData,
        }),
        axios(RPC_URL, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          data: ethWithdrawData,
        }),
      ]);
      deposits = responses[0].data.result;
      withdraws = responses[1].data.result;
      ethDeposits = responses[2].data.result;
      ethWithdraws = responses[3].data.result;
    } catch (e) {
      console.log(e);
      return undefined;
    }

    if (deposits) {
      deposits.transfers.map((depositTxn: any) => {
        const tokenAddress = depositTxn["rawContract"]["address"];
        depositValue += depositTxn["value"] * tokenPrices.get(tokenAddress);
      });
    }

    if (withdraws) {
      withdraws.transfers.map((withdrawTxn: any) => {
        const tokenAddress = withdrawTxn["rawContract"]["address"];
        withdrawValue += withdrawTxn["value"] * tokenPrices.get(tokenAddress);
      });
    }

    const wethPrice = tokenPrices.get(WETH_ADDRESS.toLowerCase());

    if (ethDeposits) {
      ethDeposits.transfers.map((depositTxn: any) => {
        depositValue += depositTxn["value"] * wethPrice;
      });
    }

    if (ethWithdraws) {
      ethWithdraws.transfers.map((withdrawTxn: any) => {
        withdrawValue += withdrawTxn["value"] * wethPrice;
      });
    }

    return depositValue - withdrawValue;
  }

  async getAccountsData(accounts: string[]): Promise<
    {
      address: string;
      borrows: number;
      totalBalance: number;
      deposits: number;
    }[]
  > {
    const ethcallProvider = new Provider();
    await ethcallProvider.init(provider);
    const tokenPrices = await this.priceEngineService.getPricesLowerCase(
      this.getActiveConstants()
    );
    const ownerOfAccounts: string[] = await ethcallProvider.all(
      accounts.map((account) => registryContract.ownerFor(account))
    );
    const accountBalances = await this.getAccountBalances(
      accounts,
      tokenPrices
    );
    const accountDeposits = await Promise.all(
      accounts.map(async (account, i) => {
        return this.getAccountDeposits(
          account,
          ownerOfAccounts[i],
          tokenPrices
        );
      })
    );
    return accounts.map((account, i) => {
      return {
        address: account,
        borrows: accountBalances[i].borrows,
        totalBalance: accountBalances[i].balances,
        deposits: accountDeposits[i],
      };
    });
  }
}
