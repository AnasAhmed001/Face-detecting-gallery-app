import express from 'express';
import { generatePresignedPost } from '../controllers/s3PresignedController.js';

const router = express.Router();

router.post('/generate-presigned-post', generatePresignedPost);

export default router;