import { generatePresignedPost } from "../lib/storageService.js";

export const generatePresignedPostUrl = async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Missing userId or eventId" });
  }

  const prefix = `saylani-moments/${userId}/${eventId}/rawuploads/`;

  try {
    const postData = await generatePresignedPost(prefix);

    res.status(200).json(postData);
  } catch (err) {
    console.error("Presigned URL error:", err);
    res.status(500).json({ error: "Failed to generate presigned POST" });
  }
};
