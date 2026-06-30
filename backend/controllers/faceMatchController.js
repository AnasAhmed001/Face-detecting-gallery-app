import { enqueueFaceMatching } from "../lib/jobQueue.js";
import { generatePublicUrl } from "../lib/storageService.js";
import { cache } from "../lib/cacheService.js";
import mongoose from 'mongoose';

export const faceMatchImages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No selfie uploaded" });
    }

    // Check cache first
    const cached = await cache.getCachedFaceMatch(eventId, uploadedFile.buffer);
    if (cached) {
      console.log('Cache HIT - returning cached face match results');
      return res.status(200).json(cached);
    }

    console.log('Cache MISS - performing face matching');

    // Enqueue and wait for face matching
    const result = await enqueueFaceMatching({
      eventId,
      selfieBuffer: uploadedFile.buffer,
      threshold: 0.75,
    });

    if (!result || !result.matches || result.matches.length === 0) {
      return res.status(200).json({
        message: "No matching faces found",
        images: [],
        total: 0,
      });
    }

    const matches = result.matches;
    const db = mongoose.connection.db;

    // Get unique images
    const uniqueImageKeys = [...new Set(matches.map(m => m.imageKey))];

    const matchedImages = await Promise.all(
      uniqueImageKeys.map(async (imageKey) => {
        const faceImage = await db.collection('face_images').findOne({ mdKey: imageKey });
        if (!faceImage) return null;

        const match = matches.find(m => m.imageKey === imageKey);
        const baseName = imageKey.split('/').pop().split('.')[0];

        return {
          id: baseName,
          thumbUrl: generatePublicUrl(faceImage.thumbKey),
          mdUrl: generatePublicUrl(faceImage.mdKey),
          rawUrl: generatePublicUrl(faceImage.originalKey),
          matchedFaceId: match.faceId,
          similarity: match.similarity,
        };
      })
    );

    const validImages = matchedImages.filter(img => img !== null);

    const response = {
      message: `Found ${validImages.length} images with matching faces`,
      total: validImages.length,
      confidence: matches[0]?.similarity || 0,
      images: validImages,
    };

    // Cache the results for 30 minutes
    await cache.cacheFaceMatch(eventId, uploadedFile.buffer, response);

    res.status(200).json(response);
  } catch (err) {
    console.error("Face Matching Error:", err);
    res.status(500).json({ error: "Failed to match faces" });
  }
};