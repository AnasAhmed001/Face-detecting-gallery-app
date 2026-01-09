import api from "./axios";
import END_POINTS from "../constant/endPoints";

export const getEventsByUserId = async (userId) => {
  try {
    const response = await api.get(`${END_POINTS.GET_EVENTS_BY_USER_ID}/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post(
      END_POINTS.CREATE_EVENT,
      eventData,
    );
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`${END_POINTS.DELETE_EVENT}/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const isFormData = typeof FormData !== "undefined" && eventData instanceof FormData;
    const response = await api.put(
      `${END_POINTS.UPDATE_EVENT}/${eventId}`,
      eventData,
      isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

