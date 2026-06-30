import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import connectDB from "./config/db.js";
import { initializeQdrant } from "./lib/qdrantService.js";
import { setupIndexes } from "./lib/mongoService.js";
import eventRoutes from "./routes/eventRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import presignedRoutes from "./routes/uploadRoutes.js";
import faceMatchRoutes from "./routes/faceMatchRoutes.js";
import userDashboardRoutes from "./routes/userDashboardRoutes.js";
import saveMatchedRoutes from "./routes/saveMatchedRoutes.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";

dotenv.config();

// Initialize database and services
await connectDB();
await initializeQdrant();
await setupIndexes();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable gzip compression for API responses
app.use(compression({
  level: 6,  // Balance between speed and compression
  threshold: 1024,  // Only compress responses > 1KB
}));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(cookieParser());
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
