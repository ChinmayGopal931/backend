import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import Account from "../models/account.model";

export const accountValueRouter = express.Router();

accountValueRouter.use(express.json());

accountValueRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const allAccounts = (await collections.sentimentAccounts
      .find({})
      .toArray()) as Account[];
    res.status(200).send(allAccounts);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

accountValueRouter.get("/:address", async (_req: Request, res: Response) => {
  const address = _req?.params?.address

  try {
    const query = { accountAddress: address}
    const account = (await collections.sentimentAccounts
      .find(query)
      .toArray()) as Account[];
    res.status(200).send(account);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
