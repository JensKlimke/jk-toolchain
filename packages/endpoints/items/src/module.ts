import express, {Request, Response, NextFunction} from "express";
import {addContract, deleteAllContracts, getContracts, importContract, updateContract} from "./controller";
import {App, Middleware} from "@sdk/api-lib";
import {DBClient} from "@sdk/api-lib/lib/utils/mongo";
import {ItemData} from "./types";

// get shortcuts
const {auth, validate} = Middleware;

// create router element
const router = express.Router();

// define routes TODO: validation
router.route('/contracts').get(auth(['getItems']), getContracts);
router.route('/contracts').post(auth(['manageItems']), addContract);
router.route('/contracts/:contractId').put(auth(['manageItems']), updateContract);
router.route('/contracts/batch').post(auth(['manageItems']), importContract);
router.route('/contracts/batch').delete(auth(['manageItems']), deleteAllContracts);

const config = (req : Request, _ : Response, next : NextFunction) => {
  // create client and initialize
  const client = new DBClient<ItemData>();
  client.initCollections(req.db.mongo.db('jk-api'), req.auth.user?.id);
  // add client to request
  req.db.addClient(client);
  // TODO: store rights
  // next
  next();
}

// update module
export const ItemModule = App(router, config);