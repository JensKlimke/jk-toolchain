import jwt from "jsonwebtoken";
import {UserData} from "../types/auth";
import {v4} from "uuid";
import {Collection, MongoClient, ObjectId} from "mongodb";
import {
  AUTH_DB,
  MONGO_URL,
  SESSION_SECRET,
  STATE_SECRET,
  TOKEN_COLLECTION,
  USER_COLLECTION,
} from "../config/env";
import {FAKE_ADMIN_USER, FAKE_USER} from "../config/fake";

class AuthController {

  client = new MongoClient(MONGO_URL);

  userCollection : Collection | undefined;
  sessionCollection : Collection | undefined;

  constructor() {
    this.client.connect()
      .then(() => {
        this.userCollection = this.client.db(AUTH_DB).collection(USER_COLLECTION);
        this.sessionCollection = this.client.db(AUTH_DB).collection(TOKEN_COLLECTION);
      });
  }

  /**
   * Returns all (non-fake) users
   * @returns All users
   */
  async getUsers () {
    // get users
    return await this.userCollection?.find({fake: false}).toArray();
  }

  /**
   * Updates the user data in the database. Inserts the user, if not existing already (and flag is set).
   * @param user User data to be updated
   * @param upsert Flag, if user shall be created
   * @returns The user (with ID) and the update mode (inserted, not_found, updated)
   */
  async updateUserData(user: UserData, upsert : boolean) {
    // get client, insert user and update ID
    const result = await this.userCollection?.updateOne({email: user.email}, {
      "$set": {...user, fake: false, _updated: new Date()},
      "$setOnInsert": {_created: new Date()}
    }, {upsert});
    // stop
    if (result === undefined)
      throw new Error('Could not update user data');
    // check result and save ID
    let mode : string;
    if (result.upsertedId !== null) {
      // save user ID
      user.id = result.upsertedId.toString();
      // set mode
      mode = 'inserted';
    } else if (result.matchedCount === 0) {
      // set mode
      mode = 'not_found';
    } else {
      // save mode
      mode = result.modifiedCount === 1 ? mode = 'updated' : '';
      // get existing user and save ID
      const existing = await this.userCollection?.findOne({email: user.email});
      user.id = existing?._id.toString();
    }
    // return updated user
    return {user, mode};
  }


  /**
   * Returns the user by its ID
   * @param id ID of the user
   * @returns User
   */
  async getUserById (id: string) {
    return await this.userCollection?.findOne({_id: new ObjectId(id)});
  }


  /**
   * Returns the session by the client key
   * @param clientKey Client key
   * @returns Session
   */
  async getSession (clientKey : string) {
    // get session
    return await this.sessionCollection?.findOne({clientKey});
  }


  /**
   * Creates the session in the database, generates and signs the client key with the session secret.
   * @param uid User ID
   * @param accessToken Access token (when not set, the session is stored as fake session)
   * @returns The signed client key
   */
  async createSession (uid : string, accessToken ?: string) {
    // save access token to database
    const clientKey = v4();
    // TODO: check ENV, remove fake (can be identified by the access token)
    // save session
    await this.sessionCollection?.insertOne({
      accessToken: accessToken || null,
      user: uid,
      clientKey,
      fake: !accessToken,
      _created: new Date(),
      _ended: null
    });
    // return token
    return jwt.sign(clientKey, SESSION_SECRET);
  }


  /**
   * Deletes the session from the database
   * @param clientKey Client key
   */
  async deleteSession (clientKey : string) {
    // TODO: don't delete: set end date and only use sessions without end date as active tokens
    // delete token by clientKey
    await this.sessionCollection?.deleteMany({clientKey});
  }


  /**
   * Checks the token
   * @param token The token to be checked
   * @param secret The secret, which is used to sign the token
   * @returns The token's content or undefined (in terms of errors)
   */
  static checkToken (token: string, secret: string): any | undefined {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      return undefined;
    }
  }


  /**
   * Checks the state
   * @param state State to be checked
   * @returns see checkToken
   */
  static checkState(state : any) {
    return AuthController.checkToken(state, STATE_SECRET);
  }


  /**
   * Returns the configuration for fake users
   * @returns Fake users
   */
  static fakeUsers = {
    admin: FAKE_ADMIN_USER,
    user: FAKE_USER
  }

}


export default AuthController;
