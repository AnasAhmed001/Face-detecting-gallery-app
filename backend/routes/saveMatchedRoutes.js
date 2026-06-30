import express from 'express';
import { saveMatchedFaceData } from '../controllers/saveMatchedFaceData.js';

const router = express.Router();

router.post('/save-matched-face-data', saveMatchedFaceData);

export default router;