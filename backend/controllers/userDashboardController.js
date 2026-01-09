import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3 } from "../lib/awsClients.js";

const Bucket = process.env.S3_BUCKET;

export const getTotalUserPhotos = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "UserId is required" });

    const basePrefix = `saylani-moments/${userId}/`;
    const listAllObjects = async (prefix) => {
      let isTruncated = true;
      let continuationToken = undefined;
      let keys = [];

      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response = await s3.send(command);
        const objects = response.Contents || [];

        keys.push(...objects.map((obj) => obj.Key));

        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
      }

      return keys;
    };

    const allKeys = await listAllObjects(basePrefix);

    const mdImages = allKeys.filter((key) =>
      key.includes("/derivative/md/") &&
      (key.endsWith(".webp") || key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".png"))
    );

    return res.json({ totalPhotos: mdImages.length });
  } catch (err) {
    console.error("Error in getTotalUserPhotos:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
