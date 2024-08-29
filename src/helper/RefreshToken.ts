import { axiosInstance } from "../utils/axios";

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export const refreshToken = async (
  navigate: (path: string) => void
): Promise<RefreshTokenResponse> => {
  const refreshToken = localStorage.getItem("refreshToken");
  try {
    const response = await axiosInstance.post("/auth/refresh-token", {
      refreshToken,
    });
    console.log(response.data);
    
    const { token, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem("authToken", token);
    localStorage.setItem("refreshToken", newRefreshToken);
    
    return { token, refreshToken: newRefreshToken };
  } catch (error) {
    navigate("/session-expired");
    console.error("Failed to refresh token:", error);
    throw error;
  }
};
