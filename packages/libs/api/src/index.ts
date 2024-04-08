import {MongoClient} from 'mongodb';
import {AuthData} from "./types/auth";
import {DBClient} from "./utils/mongo";
import HttpStatusCode from './utils/HttpStatusCode'
import ApiError from './utils/ApiError'
import GithubAuth from './utils/GithubAuth'
import AuthController from './utils/AuthController'
import App from './utils/App'
import {catchAsync} from './utils/catchAsync'
import Middleware from "./middleware";
import {COMMIT_ID, ENTRY_ID, JOI_ID} from "./utils/validation";
import DatabaseManager from "./utils/DatabaseManager";

declare global {
  namespace Express {
    export interface Request {
      auth: AuthData
      db : DatabaseManager
    }
  }
}

export {
  Middleware,
  App,
  HttpStatusCode,
  ApiError,
  catchAsync,
  COMMIT_ID, ENTRY_ID, JOI_ID,
  GithubAuth,
  AuthController
}