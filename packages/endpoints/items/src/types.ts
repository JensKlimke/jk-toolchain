import {DbDocumentType} from "@sdk/api-lib/lib/utils/mongo/DocumentWrapper";

export class ItemData {
  name : string
  creditor : string
  amount : number
  shared : boolean
  months : boolean[]
}

export const db2api = (i : DbDocumentType<ItemData>) : {_id: string} & ItemData => ({
  _id: i._item.toHexString(),
  name: i.name,
  creditor: i.creditor,
  amount: i.amount,
  shared: i.shared,
  months: i.months
});
