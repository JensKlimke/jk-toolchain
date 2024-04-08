import process from "process";

export const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

export const AUTH_PORT = process.env.PORT || 3003;
export const HOST_URL = process.env.API_URL || `http://localhost:${AUTH_PORT}`;
export const CODE_KEY = process.env.CODE_KEY || 'code';

// secrets
export const STATE_SECRET = process.env.STATE_SECRET || 'neAmWOyc5dAsPYWa00y';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'o0k37373sp3fe893jvf';
export const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || null;

export const API_ENV = process.env.API_ENV || 'prod';

export const AUTH_DB = process.env.AUTH_DB || 'auth';
export const USER_COLLECTION = process.env.USER_COLLECTION || 'users';
export const TOKEN_COLLECTION = process.env.TOKEN_COLLECTION || 'tokens';