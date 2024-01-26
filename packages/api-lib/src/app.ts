import express, {Express} from "express";
import "./index";
import {MongoClient} from "mongodb";
import {MONGO_URL} from "./config/env";
import ApiError from "./utils/ApiError";
import {errorHandler, HttpStatusCode} from "./index";

export default function App(router: express.Router) {
  // create client
  const dbClient = new MongoClient(MONGO_URL);
  // connect database
  dbClient.connect()
    .then(() => `[${MONGO_URL}] Connected to database`)
    .then(console.log)
    .catch(console.error);
  // create express app
  const App : Express = express();
  // add database
  App.use(async (req, res, next) => {
    req.db = dbClient
    next();
  });
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