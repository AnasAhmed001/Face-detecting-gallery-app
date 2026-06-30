import express from "express";
import {
  createEvent,
  getEventsByUser,
  getEventFaces,
  getEventFaceImages,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, createEvent);
router.get("/user/:userId", verifyToken, getEventsByUser);
router.get("/:eventId/faces", getEventFaces); 
router.get("/:eventId/faces/:faceId/images", getEventFaceImages); 
router.put("/update/:eventId", verifyToken, updateEvent);
router.delete("/delete/:eventId", verifyToken, deleteEvent);


export default router;
