import { ObjectId } from "mongodb";
interface AccountValue {
  borrowValue: number,
  totalAccountValue: number,
  depositValue: number
}

export default class Account {
  constructor(
    public accountAddress: string,
    public timestamp: Date,
    public accountValue: AccountValue,
    public id?: ObjectId
  ) {}
}
