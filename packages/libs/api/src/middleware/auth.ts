import {NextFunction, Request, Response} from "express";
import {roleRights} from "../config/roles";
import HttpStatusCode from "../utils/HttpStatusCode";
import {catchAsync} from "../utils/catchAsync";
import {API_ENV, SESSION_SECRET} from "../config/env";
import AuthController from "../utils/AuthController";
import {TEST_USER} from "../config/fake";
import ApiError from "../utils/ApiError";


// create auth controller
const authController = new AuthController();

export const verifyToken = catchAsync(async (req, res, next) => {
  // create session object
  req.auth = {accessToken: undefined, user: undefined, clientToken: undefined};
  // check header for test auth
  if (req.headers.authorization === 'test' && API_ENV === 'test') {
    // set test data
    req.auth = TEST_USER;
    // next
    return next();
  }
  // check for real
  if (req.headers.authorization) {
    // get token and verify
    const bearer = req.headers.authorization.split(' ');
    const token = AuthController.checkToken(bearer[1], SESSION_SECRET);
    // abort if token is not set
    if (!token)
      return next();
    // check token in database
    const tokenData = await authController.getSession(token.toString());
    // check auth
    if (!tokenData)
      return next();
    // get user
    const user = await authController.getUserById(tokenData.user);
    // check user
    if (!user)
      return next();
    // save data
    req.auth.clientToken = token.toString();
    req.auth.accessToken = tokenData.accessToken;
    // add user
    req.auth.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role
    }
  }
  // next
  next();
});


export const auth = (requiredRights: string[]) => async (req: Request, _: Response, next: NextFunction) => {
  // check user
  if (!req.auth.user) {
    next(new ApiError(HttpStatusCode.UNAUTHORIZED, 'Please authenticate'));
    return;
  }
  // check rights
  const userRights = roleRights.get(req.auth.user.role || 'user') || [];
  // every right must be fulfilled
  const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
  // switch
  if (hasRequiredRights)
    next();
  else
    next(new ApiError(HttpStatusCode.UNAUTHORIZED, 'Right insufficient'));
}
