import axios from "axios";
import express from "express";
import { createClient } from "redis";
import { PriceEngineService } from "./priceEngine.service";
import { AccountService } from "./account.service";

let PORT = process.env.PORT || 5000;
const REDIS_PORT = 6379;
const hostName = "Sentiment";
const password = "password";

export class RedisService {
  private client: any;

  async setClient(client: any) {
    // this.client = client;
    // console.log("hereeeee", client, this.client);
    // await this.client.connect();
  }

  private redisClient: any;

  async fetchPriceData() {
    console.log(`[${new Date().toUTCString()}] Start fetching price data`);
    let priceEngineService: PriceEngineService = new PriceEngineService();
    const accountService: AccountService = new AccountService();

    const tokenPrices = await priceEngineService.getPricesLowerCase(
      accountService.getActiveConstants()
    );

    console.log(
      `[${new Date().toUTCString()}] After Console log. Data not saved to Database`
    );
  }

  async getRepos(
    req: { params: { username: any } },
    res: { send: (arg0: any) => void; status: (arg0: number) => void },
    next: any
  ) {
    try {
      console.log(`[${new Date().toUTCString()}] Fetching Data...`);

      let priceEngineService: PriceEngineService = new PriceEngineService();
      const accountService: AccountService = new AccountService();

      const tokenPrices = await priceEngineService.getPricesLowerCase(
        accountService.getActiveConstants()
      );

      console.log(
        `[${new Date().toUTCString()}] After Console log. Data not saved to Database`
      );

      const { username } = req.params;

      let redisClient = createClient();

      await redisClient.connect();

      redisClient.set(
        username,

        "(" +
          `{
        "price": "${tokenPrices.get(username).toString()}",
        "timestamp": "${new Date().toUTCString()}",
      }` +
          ")"
      );

      res.send(
        `<h2>Price Data: </h2><h2>${username} is currently ${tokenPrices
          .get(username)
          .toString()} USD</h2>`
      );
    } catch (err) {
      console.log("here getrepo");
      console.error(err);
      res.status(500);
    }
  }

  async cache(
    req: { params: { username: any } },
    res: { send: (arg0: any) => void },
    next: () => void
  ) {
    try {
      const { username } = req.params;

      let redisClient = createClient();

      await redisClient.connect();

      let data = await redisClient.get(username);

      if (data !== null) {
        res.send(
          `<h2>Price Data: </h2><h2>${username} was ${
            eval(data).price
          } USD. :Last updated : ${eval(data).timestamp}</h2>`
        );
      } else {
        next();
      }
    } catch (err) {
      console.log("here cache");
      console.error(err);
    }
  }
}
