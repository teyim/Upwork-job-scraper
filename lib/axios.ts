import { TELEGRAM_API } from "./../constants";
import axios, { AxiosInstance } from "axios";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: TELEGRAM_API,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
