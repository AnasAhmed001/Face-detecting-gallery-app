import express from 'express';
import { generatePresignedPostUrl } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/generate-presigned-post', generatePresignedPostUrl);

export default router;
