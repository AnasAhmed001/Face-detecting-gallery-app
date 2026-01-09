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


// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import Event from "../models/Event.js";

// const router = express.Router();

// // Ensure uploads folder exists
// const uploadDir = path.join(process.cwd(), "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// // Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads"),
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });
// const upload = multer({ storage });

// /* -------------------- CREATE EVENT -------------------- */
// // POST /events/create
// router.post("/create", upload.array("images", 10), async (req, res) => {
//   try {
//     const { name, eventId, userId } = req.body;

//     if (!name || !eventId || !userId) {
//       return res
//         .status(400)
//         .json({ message: "Name, Event ID, and User ID are required" });
//     }

//     const imagePaths = (req.files || []).map((file) => file.path);

//     const newEvent = new Event({
//       name,
//       eventId,
//       userId,
//       images: imagePaths,
//     });

//     await newEvent.save();

//     res.status(201).json({
//       success: true,
//       message: "Event created successfully",
//       event: newEvent,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error creating event",
//       error: error.message,
//     });
//   }
// });

// /* -------------------- GET EVENTS BY USER -------------------- */
// // GET /events/user/:userId
// router.get("/user/:userId", async (req, res) => {
//   try {
//     const events = await Event.find({ userId: req.params.userId });

//     if (!events.length) {
//       return res
//         .status(404)
//         .json({ success: false, message: "No events found for this user" });
//     }

//     res.json({
//       success: true,
//       count: events.length,
//       events,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// /* -------------------- UPDATE EVENT -------------------- */
// // PUT /events/update/:eventId
// router.put("/update/:eventId", upload.array("images", 10), async (req, res) => {
//   try {
//     const { name } = req.body;
//     const eventId = req.params.eventId;

//     const event = await Event.findOne({ eventId });
//     if (!event) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Event not found" });
//     }

//     // Update name if provided
//     if (name) {
//       event.name = name;
//     }

//     // Replace images if new ones are uploaded
//     if (req.files && req.files.length > 0) {
//       event.images.forEach((imagePath) => {
//         if (fs.existsSync(imagePath)) {
//           fs.unlinkSync(imagePath);
//         }
//       });
//       event.images = req.files.map((file) => file.path);
//     }

//     await event.save();

//     res.json({
//       success: true,
//       message: "Event updated successfully",
//       event,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error updating event",
//       error: error.message,
//     });
//   }
// });

// /* -------------------- DELETE EVENT -------------------- */
// // DELETE /events/delete/:eventId
// router.delete("/delete/:eventId", async (req, res) => {
//   try {
//     const event = await Event.findOne({ eventId: req.params.eventId });

//     if (!event) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Event not found" });
//     }

//     // Delete images from the uploads folder
//     event.images.forEach((imagePath) => {
//       if (fs.existsSync(imagePath)) {
//         fs.unlinkSync(imagePath);
//       }
//     });

//     // Delete event from DB
//     await Event.deleteOne({ eventId: req.params.eventId });

//     res.json({ success: true, message: "Event deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// export default router;
