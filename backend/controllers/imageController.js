import { s3, docClient } from "../lib/awsClients.js";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { getBaseName, generateImageUrls } from "../utils/imageUtils.js";

const Bucket = process.env.S3_BUCKET;
const TABLE_NAME = process.env.DYNAMO_TABLE;
const INDEX_NAME = process.env.DYNAMO_TABLE_INDEX;

export const listGalleryImages = async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    const basePath = `saylani-moments/${userId}/${eventId}/`;
    const PrefixThumb = `${basePath}derivative/thumb/`;
    const PrefixMd = `${basePath}derivative/md/`;
    const PrefixRaw = `${basePath}rawuploads/`;

    const listObjects = async (Prefix) => {
      const command = new ListObjectsV2Command({ Bucket, Prefix });
      const response = await s3.send(command);
      return response.Contents || [];
    };

    const [thumbContents, mdContents, rawContents] = await Promise.all([
      listObjects(PrefixThumb),
      listObjects(PrefixMd),
      listObjects(PrefixRaw),
    ]);

    const rawBaseSet = new Set(rawContents.map((i) => getBaseName(i.Key)));
    const mdBaseSet = new Set(mdContents.map((i) => getBaseName(i.Key)));

    const allImages = thumbContents
      .map((item) => item.Key.split("/").pop())
      .filter((file) => {
        const base = file.split(".")[0];
        return rawBaseSet.has(base) && mdBaseSet.has(base);
      })
      .map((fileName) => {
        const base = fileName.split(".")[0];

        const rawExt =
          rawContents
            .find((i) => i.Key.includes(`${base}.`))
            ?.Key?.split(".")
            .pop() || "jpeg";
        const mdExt =
          mdContents
            .find((i) => i.Key.includes(`${base}.`))
            ?.Key?.split(".")
            .pop() || "jpeg";
        const thumbExt =
          thumbContents
            .find((i) => i.Key.includes(`${base}.`))
            ?.Key?.split(".")
            .pop() || "webp";

        return generateImageUrls({
          Bucket,
          basePath,
          baseName: base,
          exts: { raw: rawExt, md: mdExt, thumb: thumbExt },
        });
      });

    const paginatedImages = allImages.slice(startIndex, startIndex + limit);

    res.status(200).json({
      page,
      total: allImages.length,
      totalPages: Math.ceil(allImages.length / limit),
      images: paginatedImages,
    });
  } catch (err) {
    console.error("List Images Error:", err);
    res.status(500).json({ error: "Failed to list images" });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const { userId, eventId, fileBaseName } = req.params;
    const basePath = `saylani-moments/${userId}/${eventId}/`;
    const gsi1pk = `EVENT#${eventId}`;

    const queryParams = {
      TableName: TABLE_NAME,
      IndexName: INDEX_NAME,
      KeyConditionExpression: "GSI1PK = :gsi1pk",
      FilterExpression: "begins_with(ImageKey, :imageKey)",
      ExpressionAttributeValues: {
        ":gsi1pk": gsi1pk,
        ":imageKey": `${basePath}derivative/md/${fileBaseName}`,
      },
    };

    const queryResult = await docClient.send(new QueryCommand(queryParams));
    const faceRecords = queryResult.Items || [];

    const [rawList, mdList, thumbList] = await Promise.all([
      s3.send(
        new ListObjectsV2Command({
          Bucket,
          Prefix: `${basePath}rawuploads/`,
        })
      ),
      s3.send(
        new ListObjectsV2Command({
          Bucket,
          Prefix: `${basePath}derivative/md/`,
        })
      ),
      s3.send(
        new ListObjectsV2Command({
          Bucket,
          Prefix: `${basePath}derivative/thumb/`,
        })
      ),
    ]);

    const filesToDelete = [];

    const rawMatch = rawList.Contents?.filter((i) =>
      i.Key.includes(`${fileBaseName}.`)
    );
    const mdMatch = mdList.Contents?.filter((i) =>
      i.Key.includes(`${fileBaseName}.`)
    );
    const thumbMatch = thumbList.Contents?.filter((i) =>
      i.Key.includes(`${fileBaseName}.`)
    );

    if (rawMatch?.length)
      filesToDelete.push(...rawMatch.map((i) => ({ Key: i.Key })));
    if (mdMatch?.length)
      filesToDelete.push(...mdMatch.map((i) => ({ Key: i.Key })));
    if (thumbMatch?.length)
      filesToDelete.push(...thumbMatch.map((i) => ({ Key: i.Key })));

    if (filesToDelete.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket,
          Delete: { Objects: filesToDelete },
        })
      );
    }

    const deleteDynamoPromises = [];
    if (faceRecords.length > 0) {
      const batchSize = 25;
      for (let i = 0; i < faceRecords.length; i += batchSize) {
        const batch = faceRecords.slice(i, i + batchSize);
        const batchDeleteParams = {
          RequestItems: {
            [TABLE_NAME]: batch.map((record) => ({
              DeleteRequest: { Key: { FaceId: record.FaceId } },
            })),
          },
        };
        deleteDynamoPromises.push(
          docClient.send(new BatchWriteCommand(batchDeleteParams))
        );
      }
    }

    await Promise.all(deleteDynamoPromises);

    res.status(200).json({
      message: "Image and associated face data deleted successfully",
      deletedFaceRecords: faceRecords.length,
      deletedFiles: filesToDelete.map((f) => f.Key),
    });
  } catch (err) {
    console.error("Delete Image Error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete image", details: err.message });
  }
};

export const uploadCoverPhoto = async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const key = `saylani-moments/${userId}/${eventId}/cover/${file.originalname}`;

    const uploadParams = {
      Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const url = `https://${Bucket}.s3.amazonaws.com/${key}`;

    res.status(200).json({
      message: "Cover photo uploaded successfully",
      fileName: file.originalname,
      url,
    });
  } catch (err) {
    console.error("Upload Cover Error:", err);
    res.status(500).json({ error: "Failed to upload cover photo" });
  }
};

export const getCoverPhoto = async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    const prefix = `saylani-moments/${userId}/${eventId}/cover/`;

    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: prefix,
      MaxKeys: 1, // ek hi photo expected
    });

    const response = await s3.send(command);
    const coverObj = response.Contents?.[0];

    if (!coverObj) {
      return res.status(404).json({ error: "No cover photo found" });
    }

    const url = `https://${Bucket}.s3.amazonaws.com/${coverObj.Key}`;

    res.status(200).json({
      fileName: coverObj.Key.split("/").pop(),
      url,
    });
  } catch (err) {
    console.error("Get Cover Error:", err);
    res.status(500).json({ error: "Failed to get cover photo" });
  }
};

export const deleteCoverPhoto = async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    const prefix = `saylani-moments/${userId}/${eventId}/cover/`;

    const listCommand = new ListObjectsV2Command({ Bucket, Prefix: prefix });
    const response = await s3.send(listCommand);
    const coverObjects = response.Contents || [];

    if (coverObjects.length === 0) {
      return res.status(404).json({ error: "No cover photo found to delete" });
    }

    const deleteCommand = new DeleteObjectsCommand({
      Bucket,
      Delete: { Objects: coverObjects.map((obj) => ({ Key: obj.Key })) },
    });

    await s3.send(deleteCommand);

    res.status(200).json({
      message: "Cover photo(s) deleted successfully",
      deletedFiles: coverObjects.map((f) => f.Key.split("/").pop()),
    });
  } catch (err) {
    console.error("Delete Cover Error:", err);
    res.status(500).json({ error: "Failed to delete cover photo" });
  }
};

// import { s3, docClient } from "../lib/awsClients.js";
// import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
// import {
//   QueryCommand,
//   DeleteCommand,
//   BatchWriteCommand,
// } from "@aws-sdk/lib-dynamodb";
// import { getBaseName, generateImageUrls } from "../utils/imageUtils.js";

// const Bucket = process.env.S3_BUCKET;
// const TABLE_NAME = process.env.DYNAMO_TABLE;
// const INDEX_NAME = process.env.DYNAMO_TABLE_INDEX;

// export const listGalleryImages = async (req, res) => {
//   try {
//     const { userId, eventId } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const startIndex = (page - 1) * limit;

//     const basePath = `saylani-moments/${userId}/${eventId}/`;
//     const PrefixThumb = `${basePath}derivative/thumb/`;
//     const PrefixMd = `${basePath}derivative/md/`;
//     const PrefixRaw = `${basePath}rawuploads/`;

//     const listObjects = async (Prefix) => {
//       const command = new ListObjectsV2Command({ Bucket, Prefix });
//       const response = await s3.send(command);
//       return response.Contents || [];
//     };

//     const [thumbContents, mdContents, rawContents] = await Promise.all([
//       listObjects(PrefixThumb),
//       listObjects(PrefixMd),
//       listObjects(PrefixRaw),
//     ]);

//     const rawBaseSet = new Set(rawContents.map((i) => getBaseName(i.Key)));
//     const mdBaseSet = new Set(mdContents.map((i) => getBaseName(i.Key)));

//     const allImages = thumbContents
//       .map((item) => item.Key.split("/").pop())
//       .filter((file) => {
//         const base = file.split(".")[0];
//         return rawBaseSet.has(base) && mdBaseSet.has(base);
//       })
//       .map((fileName) => {
//         const base = fileName.split(".")[0];
//         const rawMatch = rawContents.find((item) =>
//           item.Key.includes(`/rawuploads/${base}.`)
//         );
//         const rawExtension = rawMatch?.Key?.split(".").pop() || "png";
//         return generateImageUrls({
//           Bucket,
//           basePath,
//           baseName: base,
//           rawExt: rawExtension,
//         });
//       });

//     const paginatedImages = allImages.slice(startIndex, startIndex + limit);

//     res.status(200).json({
//       page,
//       total: allImages.length,
//       totalPages: Math.ceil(allImages.length / limit),
//       images: paginatedImages,
//     });
//   } catch (err) {
//     console.error("List Images Error:", err);
//     res.status(500).json({ error: "Failed to list images" });
//   }
// };

// export const deleteGalleryImage = async (req, res) => {
//   try {
//     const { userId, eventId, fileBaseName } = req.params;
//     const basePath = `saylani-moments/${userId}/${eventId}/`;

//     const imageKeyPrefix = `${basePath}derivative/md/${fileBaseName}`;
//     const gsi1pk = `EVENT#${eventId}`;

//     console.log("Querying DynamoDB:", { gsi1pk, imageKeyPrefix });

//     const queryParams = {
//       TableName: TABLE_NAME,
//       IndexName: INDEX_NAME,
//       KeyConditionExpression: "GSI1PK = :gsi1pk",
//       FilterExpression: "begins_with(ImageKey, :imageKey)",
//       ExpressionAttributeValues: {
//         ":gsi1pk": gsi1pk,
//         ":imageKey": imageKeyPrefix,
//       },
//     };

//     const queryResult = await docClient.send(new QueryCommand(queryParams));
//     const faceRecords = queryResult.Items || [];

//     console.log(
//       `Found ${faceRecords.length} face records to delete for image: ${fileBaseName}`
//     );

//     // Step 2: Delete from S3
//     const knownRawExtensions = ["jpg", "jpeg", "png", "webp"];
//     const keysToDelete = [
//       `${basePath}derivative/thumb/${fileBaseName}.webp`,
//       `${basePath}derivative/md/${fileBaseName}.png`,
//       ...knownRawExtensions.map(
//         (ext) => `${basePath}rawuploads/${fileBaseName}.${ext}`
//       ),
//     ];

//     const deleteS3Command = new DeleteObjectsCommand({
//       Bucket,
//       Delete: {
//         Objects: keysToDelete.map((Key) => ({ Key })),
//       },
//     });

//     const deleteDynamoPromises = [];

//     if (faceRecords.length > 0) {
//       const batchSize = 25;

//       for (let i = 0; i < faceRecords.length; i += batchSize) {
//         const batch = faceRecords.slice(i, i + batchSize);

//         const batchDeleteParams = {
//           RequestItems: {
//             [TABLE_NAME]: batch.map((record) => ({
//               DeleteRequest: {
//                 Key: {
//                   FaceId: record.FaceId,
//                 },
//               },
//             })),
//           },
//         };

//         deleteDynamoPromises.push(
//           docClient.send(new BatchWriteCommand(batchDeleteParams))
//         );
//       }
//     }

//     await Promise.all([s3.send(deleteS3Command), ...deleteDynamoPromises]);

//     res.status(200).json({
//       message: "Image and associated face data deleted successfully",
//       deletedFaceRecords: faceRecords.length,
//       gsi1pk: gsi1pk,
//       imageKeyPrefix: imageKeyPrefix,
//       foundRecords: faceRecords.map((r) => ({
//         FaceId: r.FaceId,
//         ImageKey: r.ImageKey,
//       })),
//     });
//   } catch (err) {
//     console.error("Delete Image Error:", err);
//     res.status(500).json({
//       error: "Failed to delete image",
//       details: err.message,
//     });
//   }
// };
