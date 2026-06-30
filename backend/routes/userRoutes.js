import express from "express";
import { addPhotographer, deletePhotographer, getAllPhotographers, editPhotographer } from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", verifyToken, isAdmin, addPhotographer);
router.get("/photographers", verifyToken, isAdmin, getAllPhotographers);
router.delete("/delete/:id", verifyToken, isAdmin, deletePhotographer);
router.put("/:id", verifyToken, isAdmin, editPhotographer);

export default router;
