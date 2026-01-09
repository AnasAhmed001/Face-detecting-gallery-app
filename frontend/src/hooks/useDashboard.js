import { useEffect, useState } from "react";
import { getTotalPhotos } from "../api/dashboard";
import { useEvents } from "./useEvents";

export const useDashboard = (userId) => {
  const { events } = useEvents(userId);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState([
    { id: "events", title: "Total Events", value: 0 },
    { id: "photos", title: "Total Photos", value: 0 },
  ]);

  const updateStat = (id, value) => {
    setStats((prev) =>
      prev.map((stat) => (stat.id === id ? { ...stat, value } : stat))
    );
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!userId) return;
      try {
        const total = await getTotalPhotos(userId);
        setTotalPhotos(total);
        updateStat("photos", total);
      } catch (err) {
        console.error("Failed to fetch total photos", err);
      }
    };
    fetchPhotos();
  }, [userId]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const sorted = [...events].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    let cumulativeEvents = 0;
    let cumulativePhotos = 0;

    const data = sorted.map((event, index) => {
      cumulativeEvents += 1;
      cumulativePhotos += event.images?.length || 0;

      return {
        eventName: event.title || `Event ${index + 1}`,
        eventDate: new Date(event.createdAt).toLocaleDateString(),
        totalEvents: cumulativeEvents,
        totalPhotos: cumulativePhotos,
        index: index + 1,
      };
    });

    if (data.length > 0) {
      data[data.length - 1].totalPhotos = totalPhotos;
    }

    updateStat("events", sorted.length);
    setChartData(data);
  }, [events, totalPhotos]);

  return { stats, chartData };
};
