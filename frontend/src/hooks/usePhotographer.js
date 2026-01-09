import { useState, useEffect } from "react";
import {
  getAllPhotographers as apiGetAllPhotographers,
  addPhotographer as apiAddPhotographer,
  deletePhotographer as apiDeletePhotographer,
  editPhotographer as apiEditPhotographer,
} from "../api/photographer";

export const usePhotographer = () => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPhotographers = async () => {
    setLoading(true);
    try {
      const res = await apiGetAllPhotographers();
      // Expecting: { success: boolean, count: number, data: Array }
      const list = Array.isArray(res?.data) ? res.data : [];
      setPhotographers(list);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Unknown error";
      console.error("Error fetching photographers:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addPhotographerHandler = async (photographerData) => {
    setLoading(true);
    try {
      const data = await apiAddPhotographer(photographerData);
      // Backend returns { message, photographer }
      const created = data?.photographer || data;
      if (created) {
        setPhotographers((prev) => [...prev, created]);
      }
    } catch (err) {
      console.error("Error adding photographer:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePhotographerHandler = async (id) => {
    setLoading(true);
    try {
      await apiDeletePhotographer(id);
      setPhotographers((prev) =>
        prev.filter(
          (photographer) => photographer._id !== id && photographer.id !== id
        )
      );
    } catch (err) {
      console.error("Error deleting photographer:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editPhotographerHandler = async (id, photographerData) => {
    setLoading(true);
    try {
      const data = await apiEditPhotographer(id, photographerData);
      // Backend returns { message, photographer }
      const updated = data?.photographer || data;
      if (updated) {
        setPhotographers((prev) =>
          prev.map((photographer) =>
            photographer._id === id || photographer.id === id
              ? updated
              : photographer
          )
        );
      }
    } catch (err) {
      console.error("Error updating photographer:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotographers();
  }, []);

  return {
    photographers,
    loading,
    error,
    fetchPhotographers,
    addPhotographer: addPhotographerHandler,
    deletePhotographer: deletePhotographerHandler,
    editPhotographer: editPhotographerHandler,
  };
};
