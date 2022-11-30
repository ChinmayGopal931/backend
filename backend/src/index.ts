import express from "express";
import {
  connectToDatabase,
  addAccountsData,
  getCacheData,
} from "./services/database.service";
import { AccountService } from "./services/account.service";
import { RedisService } from "./services/redisClient.service";
import Account from "./models/account.model";
import { accountValueRouter } from "./routes/account.router";
import { PriceEngineService } from "./services/priceEngine.service";

const app = express();
const port = process.env.PORT || 8080; // default port to listen
const REDIS_PORT = 6379;
let PORT = 5000;

getCacheData()
  .then(async (redisObject) => {
    console.log("home", redisObject.redisClient);

    app.get(
      "/repos/:username",
      redisObject.redisService.cache,
      redisObject.redisService.getRepos
    );

    app.listen(5000, () => {
      console.log(`App listening on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });

// connectToDatabase()
//   .then(async () => {
//     await fetchAccountsData();
//     setInterval(async () => await fetchAccountsData(), 60 * 60 * 1000);
//     app.use("/accountValue", accountValueRouter);

//     app.listen(port, () => {
//       console.log(`Server started at http://localhost:${port}`);
//     });
//   })
//   .catch((error: Error) => {
//     console.error("Database connection failed", error);
//     process.exit();
//   });

const fetchAccountsData = async () => {
  console.log(`[${new Date().toUTCString()}] Start fetching accounts`);
  const accountService: AccountService = new AccountService();
  const accounts: string[] = await accountService.getAllAccounts();
  console.log(
    `[${new Date().toUTCString()}] Fetched ${accounts.length} accounts`
  );
  const accountChunks = chunkArray(accounts, 100);
  console.log(
    `[${new Date().toUTCString()}] Starting to push account balance data to the database`
  );
  for (let i = 0; i < accountChunks.length; i++) {
    let accountData = await accountService.getAccountsData(accountChunks[i]);
    let newAccounts = accountData.map((account) => {
      return new Account(account.address, new Date(), {
        borrowValue: account.borrows,
        totalAccountValue: account.totalBalance,
        depositValue: account.deposits,
      });
    });
    await addAccountsData(newAccounts);
    await timer(100);
  }
  console.log(
    `[${new Date().toUTCString()}] Finished writing data to the database`
  );
};

const fetchPriceData = async () => {
  console.log(`[${new Date().toUTCString()}] Start fetching price data`);
  let priceEngineService: PriceEngineService = new PriceEngineService();
  const accountService: AccountService = new AccountService();

  const tokenPrices = await priceEngineService.getPricesLowerCase(
    accountService.getActiveConstants()
  );

  console.log("tokenprices ", tokenPrices);

  console.log(
    `[${new Date().toUTCString()}] After Console log. Data not saved to Database`
  );
};

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

function chunkArray(arr: string[], chunkSize: number): string[][] {
  const chunks = [];
  while (arr.length) {
    chunkSize = Math.min(arr.length, chunkSize);
    const chunk = arr.slice(0, chunkSize);
    chunks.push(chunk);
    arr = arr.slice(chunkSize);
  }
  return chunks;
}
