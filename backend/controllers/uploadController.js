import { generatePresignedPost, generatePublicUrl } from "../lib/storageService.js";
import { enqueueFaceDetection } from "../lib/jobQueue.js";

export const generatePresignedPostUrl = async (req, res) => {
  const { userId, eventId, files } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Missing userId or eventId" });
  }

  try {
    if (Array.isArray(files) && files.length > 0) {
      // Generate a batch of presigned POST URLs, one for each file
      const promises = files.map(async (file) => {
        const key = `saylani-moments/${userId}/${eventId}/rawuploads/${file.fileName}`;
        const postData = await generatePresignedPost(key);
        return {
          fileName: file.fileName,
          url: postData.postURL,
          fields: postData.formData,
        };
      });

      const results = await Promise.all(promises);
      return res.status(200).json(results);
    } else {
      // Fallback for single/general uploads
      const key = `saylani-moments/${userId}/${eventId}/rawuploads/\${filename}`;
      const postData = await generatePresignedPost(key);
      return res.status(200).json({
        url: postData.postURL,
        fields: postData.formData,
      });
    }
  } catch (err) {
    console.error("Presigned URL error:", err);
    res.status(500).json({ error: "Failed to generate presigned POST" });
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
