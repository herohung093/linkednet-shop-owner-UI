import axios from "axios";
import { useNavigate } from "react-router";


export const refreshToken = async () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate= useNavigate()
  try {
    const response = await axios.post("/auth/refresh-token");
    const { authToken, refreshToken } = response.data;
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("refreshToken", refreshToken);
    return { authToken, refreshToken };
  } catch (error) {
    navigate("/session-expired");
    console.error("Failed to refresh token:", error);
    throw error;
  }
};
