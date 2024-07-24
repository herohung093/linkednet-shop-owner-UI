import { getToken } from "./getToken";
import isTokenExpired from "./CheckTokenExpired";
import { refreshToken } from "./RefreshToken";
import { useNavigate } from 'react-router-dom'; 

const ValidateAndRefreshToken = async (): Promise<boolean> => {
  const navigate = useNavigate();
  try {
    const token = getToken();
    if (!token) {
      navigate("/session-expired");
      return false;
    }

    if (isTokenExpired(token)) {
      const isRefreshed = await refreshToken(navigate);
      if (!isRefreshed) {
        navigate("/session-expired");
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Token validation error: ", error);
    navigate("/session-expired");
    return false;
  }
};

export default ValidateAndRefreshToken;
