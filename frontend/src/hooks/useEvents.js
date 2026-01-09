import { useState, useEffect } from "react";
import { getEventsByUserId, createEvent, deleteEvent, updateEvent } from "../api/events";
import { toast } from "sonner";

export const useEvents = (userId) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeEvents = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.events)) return data.events;
    return [];
  };

  const fetchEvents = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getEventsByUserId(userId);
      const list = normalizeEvents(data);
      if (Array.isArray(list)) {
        setEvents(list);
        if (list.length === 0) {
          toast.info("No events found");
        } else {
          toast.success("Events fetched successfully");
        }
      } else {
        setEvents([]);
        toast.info("No events found");
      }
    } catch (err) {
      setError(err);
      toast.error(err?.response?.data?.message || err.message || "Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  const createNewEvent = async (eventData) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await createEvent(eventData);
      const list = normalizeEvents(data);
      if (Array.isArray(list) && list.length) {
        setEvents(list);
      } else if (data && data.success) {
        await fetchEvents();
      }
      toast.success("Event created successfully");
    } catch (err) {
      setError(err);
      toast.error(err?.response?.data?.message || err.message || "Error creating event");
    } finally {
      setLoading(false);
    }
  };

  const deleteEventById = async (eventId) => {
    setLoading(true);
    try {
      // Use _id for deletion
      const data = await deleteEvent(eventId);

      if (data && data.success) {
        // Remove deleted event from local state using _id
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
        toast.success("Event deleted successfully");
      } else {
        toast.error("Delete failed:", data);
      }
    } catch (err) {
      setError(err);
      toast.error(err?.response?.data?.message || err.message || "Error deleting event");
    } finally {
      setLoading(false);
    }
  };

  const updateEventById = async (eventId, eventData) => {
    setLoading(true);
    try {
      const data = await updateEvent(eventId, eventData);
      const list = normalizeEvents(data);
      if (Array.isArray(list) && list.length) {
        setEvents(list);
      } else if (data && data.success) {
        await fetchEvents();
      }
      toast.success("Event updated successfully");
    } catch (err) {
      setError(err);
      toast.error(err?.response?.data?.message || err.message || "Error updating event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return {
    events,
    loading,
    error,
    refetchEvents: fetchEvents,
    createNewEvent,
    deleteEventById,
    updateEventById,
  };
};
