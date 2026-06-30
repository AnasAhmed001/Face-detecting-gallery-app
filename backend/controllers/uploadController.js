import { generatePresignedPutUrl, generatePublicUrl } from "../lib/storageService.js";
import { enqueueFaceDetection, enqueueFaceDetectionAsync } from "../lib/jobQueue.js";

export const generatePresignedPostUrl = async (req, res) => {
  const { userId, eventId, files } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Missing userId or eventId" });
  }

  try {
    if (Array.isArray(files) && files.length > 0) {
      // Generate a batch of presigned PUT URLs, one for each file
      const promises = files.map(async (file) => {
        const key = `saylani-moments/${userId}/${eventId}/rawuploads/${file.fileName}`;
        const uploadUrl = await generatePresignedPutUrl(key);
        return {
          fileName: file.fileName,
          url: uploadUrl,
        };
      });

      const results = await Promise.all(promises);
      return res.status(200).json(results);
    } else {
      // Fallback for single/general uploads
      const key = `saylani-moments/${userId}/${eventId}/rawuploads/\${filename}`;
      const uploadUrl = await generatePresignedPutUrl(key);
      return res.status(200).json({
        url: uploadUrl,
      });
    }
  } catch (err) {
    console.error("Presigned PUT URL error:", err);
    res.status(500).json({ error: "Failed to generate presigned PUT URL" });
  }
};

export const processUploadedImage = async (req, res) => {
  const { userId, eventId, imageKey } = req.body;

  if (!userId || !eventId || !imageKey) {
    return res.status(400).json({ error: "Missing required fields: userId, eventId, imageKey" });
  }

  try {
    console.log(`Triggering face extraction for: ${imageKey}`);
    const result = await enqueueFaceDetection({ userId, eventId, imageKey });

    if (result && result.success) {
      const baseName = imageKey.split('/').pop().split('.')[0];
      result.image = {
        id: baseName,
        name: baseName,
        rawUrl: generatePublicUrl(imageKey),
        mdUrl: generatePublicUrl(result.mdKey),
        thumbUrl: generatePublicUrl(result.thumbKey),
        faceCount: result.faceCount,
      };
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error processing face extraction:", err);
    res.status(500).json({ error: "Failed to process image face extraction", details: err.message });
  }
};

export const processUploadedImagesBatch = async (req, res) => {
  const { userId, eventId, imageKeys } = req.body;

  if (!userId || !eventId || !Array.isArray(imageKeys) || imageKeys.length === 0) {
    return res.status(400).json({ error: "Missing required fields: userId, eventId, and imageKeys (non-empty array)" });
  }

  try {
    console.log(`Triggering batch face extraction for ${imageKeys.length} images...`);
    
    // Trigger async face detection for each image key
    imageKeys.forEach((imageKey) => {
      enqueueFaceDetectionAsync({ userId, eventId, imageKey });
    });

    res.status(202).json({
      success: true,
      message: `Batch face extraction started in the background for ${imageKeys.length} images.`,
    });
  } catch (err) {
    console.error("Error starting batch face extraction:", err);
    res.status(500).json({ error: "Failed to initiate batch face extraction", details: err.message });
  }
};
