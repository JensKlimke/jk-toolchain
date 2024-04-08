import {NextFunction, Request, Response} from "express";
import {AuthController, GithubAuth, HttpStatusCode} from "@sdk/api-lib";
import process from "process";

export const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || null;


// create auth controller
const client = new AuthController();


/**
 * Helper function to resolve session and redirects (if url is set)
 * @param res Response object
 * @param redirect Redirect url as string or undefined
 * @param clientToken Client token
 */
const resolveSession = (res : Response, redirect : string | undefined, clientToken : string) => {
  if (redirect) {
    // create uri
    const redirectUri = new URL(redirect.toString());
    redirectUri.searchParams.set('token', clientToken);
    // redirect to url
    res.redirect(redirectUri.toString());
  } else {
    // send status
    res.status(HttpStatusCode.OK).send({'token': clientToken});
  }
}

const user = (req : Request, res : Response) => {
  // check if user is set
  if (!req.auth.user)
    return res.sendStatus(HttpStatusCode.UNAUTHORIZED);
  // send user
  res.send(req.auth.user);
}

const login = (req : Request, res : Response) => {
  // check redirect url
  let state : any = {};
  if(req.query?.redirect)
    state = {redirect: req.query.redirect.toString()};
  // generate url
  const url = GithubAuth.generateAuthUrl(state);
  // redirect
  res.redirect(url.toString());
}

const logout = async (req: Request, res: Response) => {
  // check
  if (!req.auth.clientToken)
    return res.sendStatus(HttpStatusCode.UNAUTHORIZED);
  // unset token
  await client.deleteSession(req.auth.clientToken);
  // send status code
  res.sendStatus(HttpStatusCode.OK);
}

const code = async (req: Request, res: Response, next : NextFunction) => {
  // get state
  const state = req?.query?.state?.toString() || '';
  // verify state
  const redirect = AuthController.checkState(state);
  if (!redirect) {
    // abort and send status
    return res.sendStatus(HttpStatusCode.BAD_REQUEST);
  }
  // get and check code
  const code = req?.query?.code?.toString();
  if (!code)
    return res.sendStatus(HttpStatusCode.NOT_FOUND);
  // try to get data
  try {
    // get access token
    const accessToken = await GithubAuth.getAccessToken(req?.query?.code?.toString());
    // get user data
    const userData = await GithubAuth.getUserData(accessToken);
    // check super admin role
    if (userData.email === SUPER_ADMIN_ID)
      userData.role = 'super_admin';
    // update user
    const {user, mode} = await client.updateUserData(userData, userData.role === 'super_admin');
    // check mode (user must be available)
    if (mode === 'not_found')
      return res.sendStatus(HttpStatusCode.NOT_FOUND);
    // generate and save token
    const token = await client.createSession(user.id, accessToken);
    // create and resolve session
    resolveSession(res, redirect?.redirect, token);
  } catch(e) {
    // next with error
    next(e);
  }
}

const fake = async (req: Request, res: Response) => {
  // get redirect url and data
  const type = req?.query?.type?.toString() || 'user';
  // set user data and store
  const {user} = await client.updateUserData(AuthController.fakeUsers[type], true);
  // generate and save token
  const token = await client.createSession(user.id);
  // create and resolve session
  resolveSession(res, req?.query?.redirect?.toString(), token);
}

export const authController = {
  user,   // (A)
  login,  // (B)
  logout, // (I)
  code,   // (C)->(D)->(E)->(F)
  fake    // (H)->(F)
};