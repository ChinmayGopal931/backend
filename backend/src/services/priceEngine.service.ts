import { BigNumber, ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();
import PriceProviderABI from "../abis/PriceProvider.json";
import exoticConfig from "../config/exoticTokens.config.json";
import axios from "axios";

const PRICE_PROVIDER = process.env.PRICE_PROVIDER;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const priceProviderContract = new ethers.Contract(
  PRICE_PROVIDER,
  PriceProviderABI,
  provider
);

export class PriceEngineService {
  private USDDecimals = 8;

  async getPrice(token: string): Promise<number> {
    const tokenPrices = await this.getPrices([token]);
    return tokenPrices.get(token);
  }

  async getPrices(tokens: string[]): Promise<Map<string, number>> {
    const prices: BigNumber[] = await priceProviderContract.getPrices(tokens);
    const tokenPriceMapping = new Map<string, number>();

    tokens.map((token, i) => {
      tokenPriceMapping.set(
        token,
        Number(ethers.utils.formatUnits(prices.at(i), this.USDDecimals))
      );
    });

    return tokenPriceMapping;
  }

  async getExoticPrices(tokens: string[]): Promise<Map<string, number>> {
    try {
      let tokenString = "";
      tokenString += tokens.map(
        (token) => process.env.ActiveNetwork + ":" + token
      );
      const url = `https://coins.llama.fi/prices/current/${tokenString}`;
      const response = await axios.get(url, { validateStatus: () => true });

      return response.data.coins;
    } catch (e) {
      console.log(e);
    }
  }

  async getPricesLowerCase(
    filteredTokens: string[]
  ): Promise<Map<string, number>> {
    // const exoticTokens = Object.values(exoticConfig).filter((value) =>
    //   tokens.includes(value)
    // );

    // let filteredTokens = tokens
    //   .filter((x) => !exoticTokens.includes(x))
    //   .concat(exoticTokens.filter((x) => !tokens.includes(x)));

    //let data: any = await this.getExoticPrices(exoticTokens);

    const prices: BigNumber[] = await priceProviderContract.getPrices(
      filteredTokens
    );

    const tokenPriceMapping = new Map<string, number>();

    filteredTokens.map((token, i) => {
      tokenPriceMapping.set(
        token.toLowerCase(),
        Number(ethers.utils.formatUnits(prices.at(i), this.USDDecimals))
      );
    });

    // Object.keys(data).map((value: any, index: number) => {
    //   tokenPriceMapping.set(
    //     value.substring(value.length - 42, value.length),
    //     data[value].price
    //   );
    // });

    return tokenPriceMapping;
  }
}
