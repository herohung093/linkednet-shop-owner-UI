// src/hooks/useAuthHomePageRedirect.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../helper/getToken";
import isTokenExpired from "../helper/CheckTokenExpired";

const useAuthHomePageRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      navigate("/login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("storeUuid");
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);
};

export default useAuthHomePageRedirect;
