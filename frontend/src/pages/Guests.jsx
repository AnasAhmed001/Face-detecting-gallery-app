import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ react-router-dom
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import api from "../api/axios";
import END_POINTS from "../constant/endPoints";

export default function GuestsPage({ eventId }) {
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function getEventFaces(eventId) {
    const { data } = await api.get(`/events/${eventId}/faces`);
    return data;
  }

  useEffect(() => {
    async function loadFaces() {
      try {
        const res = await getEventFaces(eventId);
        setFaces(res.faces || []);
      } catch (err) {
        console.error("Error fetching faces:", err);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadFaces();
    }
  }, [eventId]);

  // const handleImageClick = (eventId, faceId) => {
  //   // ✅ redirect with params
  //   navigate(`/event/${eventId}/people/${faceId}`);
  //   // console.log(faceId);
    
  // };


  const handleImageClick = (eventId, faceId) => {
  const url = `/event/${eventId}/people/${faceId}`;
  window.open(url, "_blank"); // _blank → opens in new tab/window
};

  return (
    <div className="container mx-auto py-2 space-y-3 px-2">
      <div className="flex items-center justify-between ml-2">
        <h1 className="text-3xl font-bold tracking-tight">Guests</h1>
      </div>
      <Card>
        <CardContent>
          {loading ? (
            <p className="p-4">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Face</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Photos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faces.map((f) => (
                  <TableRow key={f.faceId}>
                    <TableCell>
                      <img
                        src={`${END_POINTS.BUCKET_URL}${f.thumbUrl}`}
                        alt="face"
                        className="w-12 h-12 rounded-full object-cover cursor-pointer hover:scale-110 transition"
                        onClick={() => handleImageClick(f.eventId,f.faceId)
                     } // ✅ only image click
                      />
                    </TableCell>
                    <TableCell>{f.displayName || "Unknown"}</TableCell>
                    <TableCell>{f.email || "-"}</TableCell>
                    <TableCell>{f.company || "-"}</TableCell>
                    <TableCell>{f.designation || "-"}</TableCell>
                    <TableCell>{f.imageCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
