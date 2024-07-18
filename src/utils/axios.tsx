import { getToken } from "../helper/getToken";
import axios from "axios";

const BASE_URL = "https://big-umbrella-c5c3450b8837.herokuapp.com/";
// const BASE_URL = "http://localhost:8080/";
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-StoreID", "63a6afad-51b9-4bed-9fa7-a4722987bffe");
  return config;
});

export const axiosWithToken = axios.create({
  baseURL: BASE_URL,
});

axiosWithToken.interceptors.request.use((config) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-StoreID", "63a6afad-51b9-4bed-9fa7-a4722987bffe");
  config.headers["Authorization"] = `Bearer ${getToken()}`;
  return config;
});
