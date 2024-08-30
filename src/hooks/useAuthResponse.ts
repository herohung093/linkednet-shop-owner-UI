

import { useNavigate } from "react-router";

const useAuthResonse = () => {
  const navigate = useNavigate();

  const authenticateAndRedirect = (token: string, refreshToken: string) => {
    localStorage.setItem("authToken", token);
        localStorage.setItem("refreshToken", refreshToken);
    navigate("/store-settings");
  };

  return authenticateAndRedirect;
};

export default useAuthResonse;
