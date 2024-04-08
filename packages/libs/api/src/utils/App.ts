import "../index";
import express, {RequestHandler} from "express";
import cors from 'cors';
import {MongoClient} from "mongodb";
import {MONGO_URL} from "../config/env";
import ApiError from "./ApiError";
import {verifyToken} from "../middleware/auth";
import {DBClient} from "./mongo";
import {errorHandler} from "../middleware/errorHandler";
import HttpStatusCode from "./HttpStatusCode";
import DatabaseManager from "./DatabaseManager";

export default function App(router: express.Router, reqHandler ?: RequestHandler) {
  // create client
  const client = new MongoClient(MONGO_URL);
  const dbClient = new DBClient<{}>();
  // connect database
  client.connect()
    .then(() => `[${MONGO_URL}] Connected to database`)
    .then(console.log)
    .then(() => {
      // save collections
      dbClient.initCollections(client.db('jk-api'));
    })
    .catch(console.error);
  // create express app
  const App = express();
  // set limit
  App.use(express.json({limit: '5mb'}));
  App.use(express.urlencoded({extended: true, limit: '5mb'}));
  // enable cors
  App.use(cors());
  App.options('*', cors());
  // verify user by token
  App.use(verifyToken);
  // add database
  App.use(async (req, res, next) => {
    // set auth
    req.auth.user?.id && dbClient.setAuthor(req.auth.user.id);
    // set clients
    req.db = new DatabaseManager(client);
    // continue
    next();
  });
  // add custom request handler
  reqHandler && App.use(reqHandler);
  // add routes
  App.use(router);
  // not found handler
  App.use((_, __, next) => {
    next(new ApiError(HttpStatusCode.NOT_FOUND, 'Not found'));
  });
  // error handler
  App.use(errorHandler);
  // return app
  return App;
}