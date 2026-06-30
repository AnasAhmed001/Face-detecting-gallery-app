import express from "express";
import { addPhotographer, deletePhotographer, getAllPhotographers, editPhotographer } from "../controllers/userController.js";

const router = express.Router();

router.post("/add", addPhotographer);
router.get("/photographers", getAllPhotographers);
router.delete("/delete/:id", deletePhotographer);
router.put("/:id", editPhotographer);

export default router;
