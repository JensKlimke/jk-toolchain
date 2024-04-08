import React, {useCallback} from "react";
import {useAuth} from "./AuthContext";
import LoginWindow from "../components/LoginWindow";
import {useApiData} from "../api/useApi";
import {WHO_IS_API_URL} from "../config/env";

export function Auth({children}: { children: React.ReactNode }) {
  // hooks
  const {pending, session, login, createFakeSession} = useAuth();
  const whoIdData = useApiData<{id: string} | undefined>(WHO_IS_API_URL);
  // login callback
  const handleLogin = useCallback((type : string) => {
    (type === 'github') ? login() : createFakeSession(type);
  }, [login, createFakeSession]);
  // don't render if not logged in
  if (pending && !session)
    // return <div className="d-flex align-items-center justify-content-center text-muted vh-100">Loading session&hellip;</div>
    return <></>
  else if (!pending && session)
    return <>{children}</>;
  else
    return <LoginWindow login={handleLogin} apiInfo={whoIdData?.id} />;
}


export const withAuth = (element: React.ReactNode) => {
  return (
    <Auth>
      {element}
    </Auth>
  );
}
