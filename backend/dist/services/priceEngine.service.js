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
exports.PriceEngineService = void 0;
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const PriceProvider_json_1 = __importDefault(require("../abis/PriceProvider.json"));
const axios_1 = __importDefault(require("axios"));
const PRICE_PROVIDER = process.env.PRICE_PROVIDER;
const provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const priceProviderContract = new ethers_1.ethers.Contract(PRICE_PROVIDER, PriceProvider_json_1.default, provider);
class PriceEngineService {
    constructor() {
        this.USDDecimals = 8;
    }
    getPrice(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenPrices = yield this.getPrices([token]);
            return tokenPrices.get(token);
        });
    }
    getPrices(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const prices = yield priceProviderContract.getPrices(tokens);
            const tokenPriceMapping = new Map();
            tokens.map((token, i) => {
                tokenPriceMapping.set(token, Number(ethers_1.ethers.utils.formatUnits(prices.at(i), this.USDDecimals)));
            });
            return tokenPriceMapping;
        });
    }
    getExoticPrices(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let tokenString = "";
                tokenString += tokens.map((token) => process.env.ActiveNetwork + ":" + token);
                const url = `https://coins.llama.fi/prices/current/${tokenString}`;
                const response = yield axios_1.default.get(url, { validateStatus: () => true });
                return response.data.coins;
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    getPricesLowerCase(filteredTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            // const exoticTokens = Object.values(exoticConfig).filter((value) =>
            //   tokens.includes(value)
            // );
            // let filteredTokens = tokens
            //   .filter((x) => !exoticTokens.includes(x))
            //   .concat(exoticTokens.filter((x) => !tokens.includes(x)));
            //let data: any = await this.getExoticPrices(exoticTokens);
            const prices = yield priceProviderContract.getPrices(filteredTokens);
            const tokenPriceMapping = new Map();
            filteredTokens.map((token, i) => {
                tokenPriceMapping.set(token.toLowerCase(), Number(ethers_1.ethers.utils.formatUnits(prices.at(i), this.USDDecimals)));
            });
            // Object.keys(data).map((value: any, index: number) => {
            //   tokenPriceMapping.set(
            //     value.substring(value.length - 42, value.length),
            //     data[value].price
            //   );
            // });
            return tokenPriceMapping;
        });
    }
}
exports.PriceEngineService = PriceEngineService;
//# sourceMappingURL=priceEngine.service.js.map