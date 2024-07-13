import { getToken } from "../helper/getToken";
import axios from "axios";

const BASE_URL = "https://big-umbrella-c5c3450b8837.herokuapp.com/";
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-StoreID", "cosy_nails");
  return config;
});

export const axiosWithToken = axios.create({
  baseURL: BASE_URL,
});

axiosWithToken.interceptors.request.use((config) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-StoreID", "cosy_nails");
  config.headers["Authorization"] = `Bearer ${getToken()}`;
  return config;
});
