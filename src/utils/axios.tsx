import axios from "axios";
import { getStoreUuid } from "../helper/getStoreUuid";
import { getToken } from "../helper/getToken";
import { refreshToken } from "../helper/RefreshToken";

export const BASE_URL = import.meta.env.VITE_BACKEND_URL;


let isRefreshing = false;
let failedQueue: any[] = [];

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-StoreID", getStoreUuid());
  return config;
});

export const axiosWithToken = axios.create({
  baseURL: BASE_URL,
});

axiosWithToken.interceptors.request.use((config) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-StoreID", getStoreUuid());
  config.headers["Authorization"] = `Bearer ${getToken()}`;
  return config;
});

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor for API calls
axiosWithToken.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    if (error.response.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosWithToken(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        refreshToken()
          .then((newToken) => {
            axiosWithToken.defaults.headers.common["Authorization"] = `Bearer ${newToken.token}`;
            originalRequest.headers["Authorization"] = `Bearer ${newToken.token}`;
            processQueue(null, newToken.token);
            resolve(axiosWithToken(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            reject(err);
            // Navigate to the login page
            window.location.href = "/session-expired";
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);
