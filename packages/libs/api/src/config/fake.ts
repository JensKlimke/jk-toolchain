import {UserData} from "../types/auth";

export const FAKE_ADMIN_USER = {
  name: 'Fake Admin',
  email: 'admin@example.com',
  role: 'admin'
};

export const FAKE_USER = {
  name: 'Fake User',
  email: 'user@example.com',
  role: 'user'
};

export const TEST_USER = {
  clientToken : 'abcdefgh1234567890',
  accessToken : 'abcdefgh1234567890',
  user : {
    id: '6579e52e2dc110a650f0ba83',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin'
  }
}
