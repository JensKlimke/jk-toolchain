import {UserData} from "../types/auth";
import HttpStatusCode from "./HttpStatusCode";
import ApiError from "./ApiError";
import process from "process";
import jwt from "jsonwebtoken";
import {CODE_KEY, HOST_URL, STATE_SECRET} from "../config/env";


const GITHUB_AUTHORIZE_URL = process.env.AUTH_GITHUB_AUTHORIZE_URL || 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = process.env.AUTH_GITHUB_TOKEN_URL || 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = process.env.AUTH_GITHUB_USER_URL || 'https://api.github.com/user';
const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_CLIENT_SECRET || '';


const GithubAuth = {

  // TODO: remove ApiErrors and handle in middleware

  getUserData : async (accessToken : string): Promise<UserData> => {
    return fetch(GITHUB_USER_URL, {
      headers: {'Authorization': `Bearer ${accessToken}`}
    })
      .then(async r => {
        // check status
        if (r.status !== HttpStatusCode.OK)
          throw new ApiError(HttpStatusCode.NOT_FOUND);
        // return json
        return r.json();
      })
      .then((user : any) => ({
        id: user.id,
        email: user.email,
        avatar: user.avatar_url,
        name: user.name,
        role: ''
      }));
  },

  getAccessToken : async (code : string) => {
    // create body
    const body = {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code
    };
    // fetch token
    return fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    })
      .then(async r => {
        // check status
        if (r.status !== HttpStatusCode.OK)
          throw new ApiError(HttpStatusCode.NOT_FOUND);
        // return json
        return r.json();
      })
      .then((r : any) => r.access_token)
  },


  generateAuthUrl : (state : any) => {
    // generate url
    const url = new URL(GITHUB_AUTHORIZE_URL);
    url.searchParams.append('client_id', GITHUB_CLIENT_ID);
    url.searchParams.append('redirect_uri', `${HOST_URL}/${CODE_KEY}`);
    url.searchParams.append('state', jwt.sign(state, STATE_SECRET));
    // return
    return url;
  }

}


export default GithubAuth;