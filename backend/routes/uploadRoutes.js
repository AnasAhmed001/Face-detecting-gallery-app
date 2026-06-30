import express from 'express';
import { generatePresignedPostUrl, processUploadedImage } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/generate-presigned-post', generatePresignedPostUrl);
router.post('/process-image', processUploadedImage);

export default router;
