import express from 'express';
import { generatePresignedPostUrl, processUploadedImage, processUploadedImagesBatch } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/generate-presigned-post', generatePresignedPostUrl);
router.post('/process-image', processUploadedImage);
router.post('/process-images', processUploadedImagesBatch);

export default router;
