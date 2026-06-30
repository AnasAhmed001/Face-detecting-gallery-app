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
