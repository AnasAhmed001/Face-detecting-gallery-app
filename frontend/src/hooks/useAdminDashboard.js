import { useEffect, useState } from "react";
import { usePhotographer } from "./usePhotographer";

export const useAdminDashboard = () => {
  const {
    photographers,
    fetchPhotographers,
    loading: photographerLoading,
  } = usePhotographer();

  const [progressValues, setProgressValues] = useState([0]);
  const [stats, setStats] = useState([
    {
      id: "photographers",
      title: "Total Photographers",
      value: 0,
      color: "bg-blue-500",
    },
  ]);
  const [chartData, setChartData] = useState([]);

  // 🔹 Fetch photographers
  useEffect(() => {
    fetchPhotographers();
  }, []);

  // 🔹 Update stats after fetching
  useEffect(() => {
    if (!photographers || photographers.length === 0) return;
    setStats((prev) =>
      prev.map((s) =>
        s.id === "photographers" ? { ...s, value: photographers.length } : s
      )
    );
  }, [photographers]);

  // 🔹 Chart data generation
  useEffect(() => {
    if (!photographers || photographers.length === 0) return;

    const sorted = [...photographers].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    let cumulative = 0;

    const data = sorted.map((p, index) => {
      cumulative += 1;
      return {
        photographerName: p.name || `Photographer ${index + 1}`,
        photographerDate: new Date(p.createdAt).toLocaleDateString(),
        totalPhotographers: cumulative,
        index: index + 1,
      };
    });

    setChartData(data);
  }, [photographers]);

  // 🔹 Progress animation
  useEffect(() => {
    if (stats.every((s) => s.value === 0)) return;

    const timeouts = stats.map((s, i) => {
      const target = Math.min(100, (s.value / 2000) * 100);
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        setProgressValues((prev) => {
          const updated = [...prev];
          updated[i] = current;
          return updated;
        });
      }, 30);
      return interval;
    });

    return () => timeouts.forEach(clearInterval);
  }, [stats]);

  return {
    stats,
    chartData,
    progressValues,
    loading: photographerLoading,
  };
};
