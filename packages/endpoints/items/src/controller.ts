import {catchAsync} from "@sdk/api-lib";
import {db2api, ItemData} from "./types";
import {DBClient} from "@sdk/api-lib/lib/utils/mongo";

export const getContracts = catchAsync(async (req, res) => {
  // get client
  const client = req.db.client<ItemData>(0);
  // get items and map
  const items = await client.getHeadItems();
  const result = items.map(db2api);
  // send result
  res.send(result);
})


export const addContract = catchAsync(async (req, res) => {
  // get client
  const client = req.db.client<ItemData>(0);
  // save data and get data
  const result = await client.addItem(req.body);
  const item = await client.getHeadItem(result.item);
  // send result
  res.send(db2api(item));
})

export const importContract = catchAsync(async (req, res) => {
  // get client
  const client = req.db.client<ItemData>(0);
  // save data and get data
  const result = await client.addItems(req.body);
  // send result
  res.send({added: result.items.length});
})

export const deleteAllContracts = catchAsync(async (req, res) => {
  // get client
  const client = req.db.client<ItemData>(0);
  // save data and get data
  // TODO: delete all
  // send result
  res.send({});
})

export const updateContract = catchAsync(async (req, res) => {
  // get client
  const client = req.db.client<ItemData>(0);
  // save data
  const id = DBClient.toId(req.params.contractId);
  await client.updateItem(id, req.body);
  // send result
  res.send(db2api(await client.getHeadItem(id)));
})
