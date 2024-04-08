import {NextFunction, Request, Response} from "express";
import {API_ENV} from "../config/env";
import HttpStatusCode from "../utils/HttpStatusCode";
import ApiError from "../utils/ApiError";

export const environment = (envs : string[]) => async (_: Request, __: Response, next: NextFunction) => {
  if (envs.findIndex(e => e === API_ENV) !== -1)
    next();
  else
    next(new ApiError(HttpStatusCode.NOT_FOUND, 'Wrong environment'));
}
