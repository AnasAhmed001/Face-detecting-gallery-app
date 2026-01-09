import express from 'express';
import multer from 'multer';
import { faceMatchImages } from '../controllers/faceMatchController.js';

const router = express.Router();
const upload = multer();

router.post('/:eventId/', upload.single('selfie'), faceMatchImages);

export default router;
