import api from "./axios";
import END_POINTS from "../constant/endPoints";


export const addPhotographer = async (photographerData) => {
    try {
        const response = await api.post(END_POINTS.ADD_PHOTOGRAHERS, photographerData);
        return response.data;
    } catch (error) {
        console.error("Error adding photographer:", error);
        throw error;
    }
};

export const getAllPhotographers = async () => {
    try {
        const response = await api.get(END_POINTS.GET_ALL_PHOTOGRAPHERS);
        return response.data;
    } catch (error) {
        console.error("Error fetching photographers:", error);
        throw error;
    }
};

export const deletePhotographer = async (id) => {
    try {
        const response = await api.delete(END_POINTS.DELETE_PHOTOGRAPHER + id);
        return response.data;
    } catch (error) {
        console.error("Error deleting photographer:", error);
        throw error;
    }
};

export const editPhotographer = async (id, photographerData) => {
    try {
        const response = await api.put(END_POINTS.EDIT_PHOTOGRAPHER + id, photographerData);
        return response.data;
    } catch (error) {
        console.error("Error editing photographer:", error);
        throw error;
    }
};