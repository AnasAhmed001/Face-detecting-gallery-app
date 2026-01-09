import express from "express";
import multer from "multer";
import {
  deleteCoverPhoto,
  deleteGalleryImage,
  getCoverPhoto,
  listGalleryImages,
  uploadCoverPhoto,
} from "../controllers/imageController.js";

const router = express.Router();
const upload = multer();

router.get("/:userId/:eventId", listGalleryImages);
router.delete("/:userId/:eventId/:fileBaseName", deleteGalleryImage);
router.post("/cover/:userId/:eventId", upload.single("cover"), uploadCoverPhoto);
router.get("/cover/:userId/:eventId", getCoverPhoto);
router.delete("/cover/:userId/:eventId/cover", deleteCoverPhoto);

export default router;

// import express from "express";
// import {
//     deleteImageByKey,
//     getAllImagesByUserAndEvent,
//     getImagesByFace
// } from "../controller/imageController.js";

// const router = express.Router();

// router.get("/by-face/:faceId", getImagesByFace); // crop image par click par yeah khulega image iski<< http://localhost:5000/api/images/by-face/0c9cf3-fb44-48d9-8e63-d183ba8
// router.get('/:userId/:eventName', getAllImagesByUserAndEvent); //album par click sa event ke sub images show hojayengi <<< http://localhost:5000/api/images/64f33dd33e87ac4/Weddirereara
// router.delete('/', deleteImageByKey); //delete ma image key jayegi params ma query ke trha<<< http://localhost:5000/api/images?key=uploads/12345/Myweed/8f8b7538-ec14-4c45-b971-3ae51adf0350_profile.png

// export default router;
