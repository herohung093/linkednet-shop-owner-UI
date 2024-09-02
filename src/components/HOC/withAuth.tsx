import React from "react";
import { Navigate } from "react-router-dom";
import isTokenExpired from "../../helper/CheckTokenExpired";

const withAuth = (Component: React.ComponentType) => {
  const AuthenticatedComponent = (props: any) => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken || isTokenExpired(refreshToken)) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("storeUuid");
      return <Navigate to="/session-expired" />;
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
