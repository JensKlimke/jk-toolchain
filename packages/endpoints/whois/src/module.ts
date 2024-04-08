import express, {Request, Response} from "express";
import "@sdk/api-lib"
import {App, catchAsync} from "@sdk/api-lib";

// get ID
const getID = catchAsync(async (req: Request, res: Response) => {
  // get database and collection
  const db = req.db.mongo.db('jk-api');
  const collection = db.collection('meta');
  // get ID
  const doc = await collection.findOne({type: 'api-instance'});
  // save ID if not exist
  let id : string;
  if (!doc) {
    // create id
    const instance = await collection.insertOne({type: 'api-instance'});
    id = instance.insertedId.toString();
  } else {
    // save id
    id = doc._id.toString();
  }
  // send ID
  res.send({id});
});

// create router element
const router = express.Router();
router.route('/').get(getID);

export const WhoIsApp = App(router);