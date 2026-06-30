import express from "express";
import {
  createEvent,
  getEventsByUser,
  getEventFaces,
  getEventFaceImages,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/user/:userId", getEventsByUser);
router.get("/:eventId/faces", getEventFaces); 
router.get("/:eventId/faces/:faceId/images", getEventFaceImages); 
router.put("/update/:eventId", updateEvent);
router.delete("/delete/:eventId", deleteEvent);


export default router;
