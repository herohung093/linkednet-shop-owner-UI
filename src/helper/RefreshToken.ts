import { axiosInstance } from "../utils/axios";

interface RefreshTokenResponse {
  authToken: string;
  refreshToken: string;
}

export const refreshToken = async (
  navigate: (path: string) => void
): Promise<RefreshTokenResponse> => {
  const refreshToken = sessionStorage.getItem("refreshToken");
  try {
    const response = await axiosInstance.post("/auth/refresh-token", {
      refreshToken,
    });
    const { authToken, refreshToken: newRefreshToken } = response.data;
    sessionStorage.setItem("authToken", authToken);
    sessionStorage.setItem("refreshToken", newRefreshToken);
    return { authToken, refreshToken: newRefreshToken };
  } catch (error) {
    navigate("/session-expired");
    console.error("Failed to refresh token:", error);
    throw error;
  }
};
