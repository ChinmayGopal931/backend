"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const Registry_json_1 = __importDefault(require("../abis/Registry.json"));
const RiskEngine_json_1 = __importDefault(require("../abis/RiskEngine.json"));
const priceEngine_service_1 = require("./priceEngine.service");
const axios_1 = __importDefault(require("axios"));
const address_config_json_1 = __importDefault(require("../config/address.config.json"));
const ethcall_1 = require("ethcall");
const REGISTRY = process.env.REGISTRY;
const RISK_ENGINE = process.env.RISK_ENGINE;
const RPC_URL = process.env.RPC_URL;
const ACCOUNT_MANAGER = process.env.ACCOUNT_MANAGER;
const provider = new ethers_1.ethers.providers.JsonRpcProvider(RPC_URL, "arbitrum");
const registryContract = new ethcall_1.Contract(REGISTRY, Registry_json_1.default);
const riskEngineContract = new ethcall_1.Contract(RISK_ENGINE, RiskEngine_json_1.default);
const WETH_ADDRESS = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
class AccountService {
    constructor(priceEngineService = new priceEngine_service_1.PriceEngineService()) {
        this.priceEngineService = priceEngineService;
    }
    getActiveConstants() {
        return Object.values(address_config_json_1.default);
    }
    getAllAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const ethersRegistryContract = new ethers_1.ethers.Contract(REGISTRY, Registry_json_1.default, provider);
            return yield ethersRegistryContract.getAllAccounts();
        });
    }
    getAccountBalances(accounts, tokenPrices) {
        return __awaiter(this, void 0, void 0, function* () {
            const ethcallProvider = new ethcall_1.Provider();
            yield ethcallProvider.init(provider);
            const accountBorrows = yield ethcallProvider.all(accounts.map((account) => riskEngineContract.getBorrows(account)));
            const accountBalances = yield ethcallProvider.all(accounts.map((account) => riskEngineContract.getBalance(account)));
            const wethPrice = tokenPrices.get(WETH_ADDRESS.toLowerCase());
            return accounts.map((account, i) => {
                return {
                    borrows: Number(ethers_1.ethers.utils.formatUnits(accountBorrows[i], 18)) * wethPrice,
                    balances: Number(ethers_1.ethers.utils.formatUnits(accountBalances[i], 18)) * wethPrice,
                };
            });
        });
    }
    getAccountDeposits(account, userAddress, tokenPrices) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let deposits, withdraws, ethDeposits, ethWithdraws, depositValue = 0, withdrawValue = 0;
            try {
                const responses = yield Promise.all([
                    (0, axios_1.default)(RPC_URL, {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        data: depositData,
                    }),
                    (0, axios_1.default)(RPC_URL, {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        data: withdrawData,
                    }),
                    (0, axios_1.default)(RPC_URL, {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        data: ethDepositData,
                    }),
                    (0, axios_1.default)(RPC_URL, {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        data: ethWithdrawData,
                    }),
                ]);
                deposits = responses[0].data.result;
                withdraws = responses[1].data.result;
                ethDeposits = responses[2].data.result;
                ethWithdraws = responses[3].data.result;
            }
            catch (e) {
                console.log(e);
                return undefined;
            }
            if (deposits) {
                deposits.transfers.map((depositTxn) => {
                    const tokenAddress = depositTxn["rawContract"]["address"];
                    depositValue += depositTxn["value"] * tokenPrices.get(tokenAddress);
                });
            }
            if (withdraws) {
                withdraws.transfers.map((withdrawTxn) => {
                    const tokenAddress = withdrawTxn["rawContract"]["address"];
                    withdrawValue += withdrawTxn["value"] * tokenPrices.get(tokenAddress);
                });
            }
            const wethPrice = tokenPrices.get(WETH_ADDRESS.toLowerCase());
            if (ethDeposits) {
                ethDeposits.transfers.map((depositTxn) => {
                    depositValue += depositTxn["value"] * wethPrice;
                });
            }
            if (ethWithdraws) {
                ethWithdraws.transfers.map((withdrawTxn) => {
                    withdrawValue += withdrawTxn["value"] * wethPrice;
                });
            }
            return depositValue - withdrawValue;
        });
    }
    getAccountsData(accounts) {
        return __awaiter(this, void 0, void 0, function* () {
            const ethcallProvider = new ethcall_1.Provider();
            yield ethcallProvider.init(provider);
            const tokenPrices = yield this.priceEngineService.getPricesLowerCase(this.getActiveConstants());
            const ownerOfAccounts = yield ethcallProvider.all(accounts.map((account) => registryContract.ownerFor(account)));
            const accountBalances = yield this.getAccountBalances(accounts, tokenPrices);
            const accountDeposits = yield Promise.all(accounts.map((account, i) => __awaiter(this, void 0, void 0, function* () {
                return this.getAccountDeposits(account, ownerOfAccounts[i], tokenPrices);
            })));
            return accounts.map((account, i) => {
                return {
                    address: account,
                    borrows: accountBalances[i].borrows,
                    totalBalance: accountBalances[i].balances,
                    deposits: accountDeposits[i],
                };
            });
        });
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=account.service.js.map