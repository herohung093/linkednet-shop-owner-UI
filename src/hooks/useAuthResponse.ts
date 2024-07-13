

import { useNavigate } from "react-router";

const useAuthResonse = () => {
  const navigate = useNavigate();

  const authenticateAndRedirect = (token: string, refreshToken: string) => {
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("refreshToken", refreshToken);
    navigate("/dashboard");
  };

  return authenticateAndRedirect;
};

export default useAuthResonse;
