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
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);
};

export default useAuthHomePageRedirect;