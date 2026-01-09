// 📁 src/api/albums.js
import api from "./axios";
import END_POINTS from "../constant/endPoints";

export const getAlbums = async () => {
  const res = await api.get(END_POINTS.GET_ALBUMS);
  return res.data.data;
};

export const getAlbumById = async (id) => {
  const res = await api.get(END_POINTS.GET_ALBUM_BY_ID(id));
  return res.data.data;
};

export const createAlbum = async (formData) => {
  const res = await api.post(END_POINTS.CREATE_ALBUM, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const updateAlbum = async (id, formData) => {
  const res = await api.put(END_POINTS.UPDATE_ALBUM(id), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const deleteAlbum = async (id) => {
  const res = await api.delete(END_POINTS.DELETE_ALBUM(id));
  return res.data;
};