import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AuthContextType, SessionType} from "./types";
import {AuthContext} from "./AuthContext";
import {AUTH_API_URL, SESSION_STORAGE_KEY} from "../config/env";
import secureLocalStorage from "react-secure-storage";

// TODO: session with atomWithStorage

const sessionPromise = () =>
  new Promise<SessionType | undefined>((resolve, reject) => {
    // get refresh token
    const token = secureLocalStorage.getItem(SESSION_STORAGE_KEY);
    // check session
    if (!token || typeof token !== 'string') return resolve(undefined);
    // call API
    fetch(`${AUTH_API_URL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
      .then(r => r.json())
      .then(user => {
        resolve({user, token})
      })
      .catch(e => {
        console.error(e);
        reject('Unknown error');
      })
  });


export function AuthProvider({children}: { children: React.ReactNode }) {
  // states
  const [pending, setPending] = useState<boolean>(true);
  const [session, setSession] = useState<SessionType>();
  // router
  const navigate = useCallback((url : string) => window.location.href = url, []);
  const location = useMemo(() => new URL(window.location.href), []);
  // generate login url
  const login = useCallback(() => {
    // create url
    const url = new URL(`${AUTH_API_URL}/login`);
    url.searchParams.set('redirect', window.location.href);
    // forward
    navigate(url.toString());
    // log
    console.info('auth:login', 'Request login');
  }, [navigate]);
  // generate login url
  const createFakeSession = useCallback((type: string) => {
    // create url
    const url = new URL(`${AUTH_API_URL}/fake`);
    url.searchParams.set('type', type);
    url.searchParams.set('redirect', window.location.href);
    // forward
    navigate(url.toString());
    // log
    console.info('auth:createFakeSession', 'Request fake session');
  }, [navigate]);
  // logout callback
  const logout = useCallback(() => {
    // delete session
    secureLocalStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(undefined);
    // log
    console.info('auth:logout', 'logout session for user ' + session?.user.name);
  }, [session?.user.name]);
  // renew
  const renew = useCallback(() => {
    // get session data
    sessionPromise()
      .then(session => {
        setSession(session);
        !session && console.info('auth:renew', 'no session set');
        session && console.info('auth:renew', 'session renewed for ' + session?.user.name);
      })
      .catch(e => console.info('auth:renew', e))
      .finally(() => setPending(false))
  }, []);
  // check token
  useEffect(() => {
    // create url, get and remove token
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    // check token
    if (token) {
      // save session and redirect
      secureLocalStorage.setItem(SESSION_STORAGE_KEY, token);
      navigate(location.pathname);
    }
  }, [location.pathname, navigate, renew]);
  useEffect(() => {
    // renew session
    renew();
  }, [renew]);
  // context object
  const context: AuthContextType = {
    session,
    pending,
    login,
    logout,
    renew,
    createFakeSession
  };
  // render
  return (
    <AuthContext.Provider value={context}>
      {children}
    </AuthContext.Provider>
  );
}
