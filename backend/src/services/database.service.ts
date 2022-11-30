import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";
import Account from "../models/account.model";
import { RedisService } from "./redisClient.service";
import { createClient } from "redis";

export const collections: {
  sentimentAccounts?: mongoDB.Collection<Account>;
  tokenPrices?: mongoDB.Collection<Object>;
} = {};

export async function connectToDatabase() {
  dotenv.config();
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.DB_CONN_STRING
  );
  await client.connect();
  const db: mongoDB.Db = client.db(process.env.DB_NAME);
  const accountsCollection: mongoDB.Collection<Account> =
    db.collection<Account>(process.env.ACCOUNTS_COLLECTION_NAME);
  const pricesCollection: mongoDB.Collection<Object> = db.collection<Object>(
    process.env.PRICES_COLLECTION_NAME
  );
  collections.sentimentAccounts = accountsCollection;
  collections.tokenPrices = pricesCollection;
  console.log(
    `Successfully connected to database: ${db.databaseName} and collections: ${accountsCollection.collectionName} and ${pricesCollection.collectionName}`
  );
}

export const addAccountsData = async (data: Account[]) => {
  try {
    const result = await collections.sentimentAccounts.insertMany(data);
    result
      ? console.log(
          `Successfully added ${result.insertedCount} accounts to the database`
        )
      : console.log("Failed to add accounts data to the database");
  } catch (error) {
    console.error(error);
  }
};

export const getCacheData = async () => {
  try {
    const redisService: RedisService = new RedisService();

    let redisClient = createClient();

    await redisService.setClient(redisClient);

    return { redisClient, redisService };
  } catch (error) {
    console.log("db error");
    console.error(error);
  }
};

