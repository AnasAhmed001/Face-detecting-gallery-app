import api from "./axios";
import END_POINTS from "../constant/endPoints";

export const getTotalPhotos = async (userId) => {
  const res = await api.post(END_POINTS.GET_TOTAL_PHOTOS, { userId });
  return res.data.totalPhotos;
};
