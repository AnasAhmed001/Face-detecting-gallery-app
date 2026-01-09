import express from "express";
import { addPhotographer, deletePhotographer, getAllPhotographers, editPhotographer } from "../controllers/userController.js";
// import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.post("/add", verifyToken, isAdmin, addPhotographer);
// router.delete("/delete/:id", verifyToken, isAdmin, deletePhotographer);

router.post("/add", addPhotographer);
router.get("/photographers", getAllPhotographers);
router.delete("/delete/:id", deletePhotographer);
router.put("/:id", editPhotographer);

export default router;
