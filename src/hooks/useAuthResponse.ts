

import { useNavigate } from "react-router";

const useAuthResonse = () => {
  const navigate = useNavigate();

  const authenticateAndRedirect = (token: string, refreshToken: string) => {
    localStorage.setItem("authToken", token);
        localStorage.setItem("refreshToken", refreshToken);
    navigate("/dashboard");
  };

  return authenticateAndRedirect;
};

export default useAuthResonse;
