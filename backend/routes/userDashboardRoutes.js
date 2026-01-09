/** @format */

import express from "express";
import { getTotalUserPhotos } from "../controllers/userDashboardController.js";

const router = express.Router();

router.post("/photos", getTotalUserPhotos);

export default router;
