// src/hooks/useAuthHomePageRedirect.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getToken } from "../helper/getToken";
import isTokenExpired from "../helper/CheckTokenExpired";
import { clearUserDetails } from "../redux toolkit/userDetailsSlice";
import { clearSelectedStore } from "../redux toolkit/selectedStoreSlice";
import { clearStoresList } from "../redux toolkit/storesListSlice";

const useAuthHomePageRedirect = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      // Clear Redux state
      dispatch(clearUserDetails());
      dispatch(clearSelectedStore());
      dispatch(clearStoresList());
      // Clear localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("storeUuid");
      navigate("/login");
    } else {
      navigate("/dashboard");
    }
  }, [navigate, dispatch]);
};

export default useAuthHomePageRedirect;
