import { s3, rekognition, docClient } from "../lib/awsClients.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getBaseName, generateImageUrls } from "../utils/imageUtils.js";

const Bucket = process.env.S3_BUCKET;
const TableName = process.env.DYNAMO_TABLE;

export const faceMatchImages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No selfie uploaded" });
    }

    const searchResponse = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: eventId,
        Image: { Bytes: uploadedFile.buffer },
        MaxFaces: 100,
        FaceMatchThreshold: 75,
      })
    );

    if (!searchResponse.FaceMatches?.length) {
      return res.status(200).json({
        message: "No matching faces found",
        images: [],
        total: 0,
      });
    }

    const matchingFaceIds = searchResponse.FaceMatches.map(
      (match) => match.Face.FaceId
    );

    const imageKeys = [];
    const faceIdToImageKeyMap = new Map(); // Track which faceId belongs to which imageKey

    for (const faceId of matchingFaceIds) {
      const queryParams = {
        TableName,
        KeyConditionExpression: "FaceId = :faceId",
        ExpressionAttributeValues: { ":faceId": faceId },
      };
      const queryResult = await docClient.send(new QueryCommand(queryParams));
      if (queryResult.Items?.length > 0) {
        const imageKey = queryResult.Items[0].ImageKey;
        imageKeys.push(imageKey);
        faceIdToImageKeyMap.set(faceId, imageKey); // Map faceId to its imageKey
      }
    }

    const uniqueImageKeys = [...new Set(imageKeys)];

    const matchedImages = await Promise.all(
      uniqueImageKeys.map(async (imageKey) => {
        const baseName = getBaseName(imageKey);
        const pathParts = imageKey.split("/");
        const userId = pathParts[1];
        const basePath = `saylani-moments/${userId}/${eventId}`;

        const [rawList, mdList, thumbList, facesList] = await Promise.all([
          s3.send(
            new ListObjectsV2Command({
              Bucket,
              Prefix: `${basePath}/rawuploads/`,
            })
          ),
          s3.send(
            new ListObjectsV2Command({
              Bucket,
              Prefix: `${basePath}/derivative/md/`,
            })
          ),
          s3.send(
            new ListObjectsV2Command({
              Bucket,
              Prefix: `${basePath}/derivative/thumb/`,
            })
          ),
          // Get cropped faces for this specific image only
          s3.send(
            new ListObjectsV2Command({
              Bucket,
              Prefix: `${basePath}/faces/`,
            })
          ),
        ]);

        const rawExt =
          rawList.Contents?.find((i) => i.Key.includes(baseName))
            ?.Key?.split(".")
            .pop() || "jpeg";
        const mdExt =
          mdList.Contents?.find((i) => i.Key.includes(baseName))
            ?.Key?.split(".")
            .pop() || "jpeg";
        const thumbExt =
          thumbList.Contents?.find((i) => i.Key.includes(baseName))
            ?.Key?.split(".")
            .pop() || "webp";

        // Find the specific faceId that matches this imageKey
        const matchingFaceId = Array.from(faceIdToImageKeyMap.entries()).find(
          ([faceId, imgKey]) => imgKey === imageKey
        )?.[0];

        // Find cropped face for this SPECIFIC faceId (not just baseName)
        const croppedFace = facesList.Contents?.find(
          (face) =>
            face.Key.includes(baseName) &&
            matchingFaceId &&
            face.Key.includes(matchingFaceId)
        );

        const imageUrls = generateImageUrls({
          Bucket,
          basePath,
          baseName,
          exts: { raw: rawExt, md: mdExt, thumb: thumbExt },
        });

        // Add cropped face URL only if it belongs to this specific face match
        if (croppedFace) {
          const baseUrl = `https://${Bucket}.s3.amazonaws.com`;
          imageUrls.croppedFaceUrl = `${baseUrl}/${croppedFace.Key}`;
          imageUrls.matchedFaceId = matchingFaceId; // For debugging
        }

        return imageUrls;
      })
    );

    res.status(200).json({
      message: `Found ${matchedImages.length} images with matching faces`,
      total: matchedImages.length,
      confidence: searchResponse.FaceMatches[0]?.Similarity || 0,
      // images: matchedImages,
      images: matchedImages.map((image) => ({
        ...image,
        matchedFaceId: image.matchedFaceId,
      })),
    });
  } catch (err) {
    console.error("Face Matching Error:", err);
    res.status(500).json({ error: "Failed to match faces" });
  }
};