import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Image } from "lucide-react";
import { useUserContext } from "../context/UserContext";
import { useDashboard } from "../hooks/useDashboard";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend as ReLegend,
} from "recharts";

export default function Dashboard() {
  const { userId } = useUserContext();
  const { stats, chartData } = useDashboard(userId);
  const [progressValues, setProgressValues] = useState([0, 0]);

  useEffect(() => {
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

    return () => timeouts.forEach((t) => clearInterval(t));
  }, [stats]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of events and photos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {stats.map((s, i) => (
            <Card key={s.id} className="overflow-hidden shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-md ${
                      s.id === "events" ? "bg-blue-500" : "bg-green-500"
                    } text-white`}
                  >
                    {s.id === "events" ? (
                      <Calendar className="w-6 h-6" />
                    ) : (
                      <Image className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {s.title}
                    </div>
                    <div className="text-2xl font-semibold">
                      {s.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  +{Math.floor(Math.random() * 15) + 1}%
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Progress value={progressValues[i] || 0} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Events and Photos Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <YAxis
                  tick={{ fill: "#666" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <ReTooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <ReLegend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Line
                  type="monotone"
                  dataKey="totalEvents"
                  stroke="#FF9326"
                  name="Total Events"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalPhotos"
                  stroke="#FF5733"
                  name="Total Photos"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
