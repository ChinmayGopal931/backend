"use strict";
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
const express_1 = __importDefault(require("express"));
const database_service_1 = require("./services/database.service");
const account_service_1 = require("./services/account.service");
const account_model_1 = __importDefault(require("./models/account.model"));
const account_router_1 = require("./routes/account.router");
const app = (0, express_1.default)();
const port = process.env.PORT || 8080; // default port to listen
(0, database_service_1.connectToDatabase)()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield fetchAccountsData();
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () { return yield fetchAccountsData(); }), 60 * 60 * 1000);
    app.use("/accountValue", account_router_1.accountValueRouter);
    console.log("here");
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
}))
    .catch((error) => {
    console.error("Database connection failed", error);
    process.exit();
});
const fetchAccountsData = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toUTCString()}] Start fetching accounts`);
    const accountService = new account_service_1.AccountService();
    const accounts = yield accountService.getAllAccounts();
    console.log(`[${new Date().toUTCString()}] Fetched ${accounts.length} accounts`);
    const accountChunks = chunkArray(accounts, 100);
    console.log(`[${new Date().toUTCString()}] Starting to push account balance data to the database`);
    for (let i = 0; i < accountChunks.length; i++) {
        let accountData = yield accountService.getAccountsData(accountChunks[i]);
        let newAccounts = accountData.map((account) => {
            return new account_model_1.default(account.address, new Date(), {
                borrowValue: account.borrows,
                totalAccountValue: account.totalBalance,
                depositValue: account.deposits,
            });
        });
        yield (0, database_service_1.addAccountsData)(newAccounts);
        yield timer(100);
    }
    console.log(`[${new Date().toUTCString()}] Finished writing data to the database`);
});
// const fetchPriceData = async () => {
//   console.log(`[${new Date().toUTCString()}] Start fetching price data`);
//   let priceEngineService: PriceEngineService = new PriceEngineService();
//   const tokenPrices = await priceEngineService.getPricesLowerCase(
//     accountService.getActiveConstants()
//   );
//   console.log("tokenprices ", tokenPrices);
//   console.log(
//     `[${new Date().toUTCString()}] After Console log. Data not saved to Database`
//   );
// };
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
function chunkArray(arr, chunkSize) {
    const chunks = [];
    while (arr.length) {
        chunkSize = Math.min(arr.length, chunkSize);
        const chunk = arr.slice(0, chunkSize);
        chunks.push(chunk);
        arr = arr.slice(chunkSize);
    }
    return chunks;
}
//# sourceMappingURL=index.js.map