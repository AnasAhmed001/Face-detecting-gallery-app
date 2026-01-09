import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { s3 } from "../lib/awsClients.js";

const Bucket = process.env.S3_BUCKET;

export const generatePresignedPost = async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Missing userId or eventId" });
  }

  const Prefix = `saylani-moments/${userId}/${eventId}/rawuploads/`;

  try {
    const post = await createPresignedPost(s3, {
      Bucket,
      Key: `${Prefix}\${filename}`,
      Expires: 900,
      Conditions: [
        ["starts-with", "$key", Prefix],
        ["content-length-range", 0, 10485760], // 10MB max
      ],
    });

    res.status(200).json(post);
  } catch (err) {
    console.error("Presigned URL error:", err);
    res.status(500).json({ error: "Failed to generate presigned POST" });
  }
};

// import { S3Client } from "@aws-sdk/client-s3";
// import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
// import dotenv from "dotenv";

// dotenv.config();

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// export const generatePresignedPost = async (req, res) => {
//   const { userId, eventId } = req.body;

//   if (!userId || !eventId) {
//     return res.status(400).json({ error: "Missing userId or eventId" });
//   }

//   const Prefix = `saylani-moments/${userId}/${eventId}/rawuploads/`;

//   try {
//     const post = await createPresignedPost(s3, {
//       Bucket: process.env.S3_BUCKET,
//       Key: `${Prefix}\${filename}`,
//       Expires: 900,
//       Conditions: [
//         ["starts-with", "$key", Prefix],
//         ["content-length-range", 0, 10485760], // up to 10MB per image
//       ],
//     });

//     res.json(post);
//   } catch (err) {
//     console.error("Presigned URL error:", err);
//     res.status(500).json({ error: "Failed to generate presigned POST" });
//   }
// };
