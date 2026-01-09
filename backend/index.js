import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import presignedRoutes from "./routes/s3PresignedRoutes.js";
import faceMatchRoutes from "./routes/faceMatchRoutes.js";
import userDashboardRoutes from "./routes/userDashboardRoutes.js";
import saveMatchedRoutes from "./routes/saveMatchedRoutes.js";
import morgan from "morgan";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan("dev"));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/s3", presignedRoutes);
app.use("/api/faceMatch", faceMatchRoutes);
app.use("/api/dashboard", userDashboardRoutes);
app.use("/api/guest", saveMatchedRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
