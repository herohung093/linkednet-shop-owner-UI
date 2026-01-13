import React from "react";
import { Navigate } from "react-router-dom";
import isTokenExpired from "../../helper/CheckTokenExpired";
import store from "../../redux toolkit/store";
import { clearUserDetails } from "../../redux toolkit/userDetailsSlice";
import { clearSelectedStore } from "../../redux toolkit/selectedStoreSlice";
import { clearStoresList } from "../../redux toolkit/storesListSlice";

const withAuth = (Component: React.ComponentType) => {
  const AuthenticatedComponent = (props: any) => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken || isTokenExpired(refreshToken)) {
      // Clear Redux state
      store.dispatch(clearUserDetails());
      store.dispatch(clearSelectedStore());
      store.dispatch(clearStoresList());
      // Clear localStorage
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
