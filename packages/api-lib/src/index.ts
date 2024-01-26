import {MongoClient} from 'mongodb';
import {MONGO_URL} from "./config/env";
import {AuthData} from "./types/auth";
import HttpStatusCode from './utils/HttpStatusCode'
import ApiError from './utils/ApiError'
import {errorHandler} from './middleware/errorHandler'


declare global {
    namespace Express {
        export interface Request {
            auth: AuthData
            db: MongoClient
        }
    }
}

export {
  HttpStatusCode,
  ApiError,
  errorHandler,
}