import axios from "axios";
import END_POINTS from "../constant/endPoints";

const api = axios.create({
  baseURL: END_POINTS.API_BASE_URL,
  withCredentials: true,
});

export default api;