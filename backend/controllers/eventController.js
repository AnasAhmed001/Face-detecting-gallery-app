import Event from "../models/Event.js";
import { s3, docClient } from "../lib/awsClients.js";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { QueryCommand, BatchWriteCommand ,GetCommand } from "@aws-sdk/lib-dynamodb";

const Bucket = process.env.S3_BUCKET;
const TABLE_NAME = process.env.DYNAMO_TABLE;
const TABLE_INDEX_NAME = process.env.DYNAMO_TABLE_INDEX;

export const createEvent = async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ message: "Name and User ID are required" });
    }

    const newEvent = new Event({
      name,
      userId,
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating event",
      error: error.message,
    });
  }
};

export const getEventsByUser = async (req, res) => {
  try {
    const events = await Event.find({ userId: req.params.userId });


    if (!events.length) {
      return res
        .status(404)
        .json({ success: false, message: "No events found for this user" });
    }

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /events/:eventId/faces
export const getEventFaces = async (req, res) => {
  const { eventId } = req.params;
  console.log(eventId)

  if (!eventId) {
    return res
      .status(400)
      .json({ success: false, message: "eventId is required" });
  }

  try {
    const command = new QueryCommand({
      TableName: process.env.EVENT_FACES_TABLE || 'EventFaces', // e.g. "EventFaces"
      KeyConditionExpression: "EventId = :e",
      ExpressionAttributeValues: {
        ":e": eventId,
      },
    });

    const result = await docClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No faces found for this event" });
    }

    res.json({
      success: true,
      count: result.Count,
      faces: result.Items.map((f) => ({
        faceId: f.FaceId,
        eventId: f.EventId,
        thumbUrl: f.FaceThumbKey, // S3 key or full URL (depends how you store)
        imageCount: f.ImageCount ?? 0,
        guestId: f.GuestId ?? null,
        displayName: f.DisplayName ?? null,
        firstSeenAt: f.FirstSeenAt ?? null,
        lastSeenAt: f.LastSeenAt ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching event faces:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching event faces" });
  }
};

/** Builds a public S3 URL for a key using the bucket name */
function toPublicUrl(key) {
  const BUCKET = process.env.S3_BUCKET; // e.g. "saylanimoment"
  if (!key || !BUCKET) return null;
  // Encode safely but keep slashes
  const safeKey = encodeURIComponent(key).replace(/%2F/g, "/");
  return `https://${BUCKET}.s3.amazonaws.com/${safeKey}`;
}

export const getEventFaceImages = async (req, res) => {
  const FACE_IMAGES_TABLE = process.env.FACE_IMAGES_TABLE || "FaceImages";
  const EVENT_FACES_TABLE = process.env.EVENT_FACES_TABLE || "EventFaces";

  const { eventId, faceId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "30", 10), 100);
  const cursor = req.query.cursor ? String(req.query.cursor) : null;

  if (!eventId || !faceId) {
    return res
      .status(400)
      .json({ success: false, message: "eventId and faceId are required" });
  }

  const eventFaceId = `${eventId}#${faceId}`;

  let ExclusiveStartKey;
  if (cursor) {
    try {
      ExclusiveStartKey = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    } catch {
      return res.status(400).json({ success: false, message: "Invalid cursor" });
    }
  }

  try {
    // 1) Get face thumbnail from EventFaces
    const faceMeta = await docClient.send(
      new GetCommand({
        TableName: EVENT_FACES_TABLE,
        Key: { EventId: eventId, FaceId: faceId },
        ProjectionExpression: "FaceThumbKey",
      })
    );
    const faceThumbUrl = faceMeta?.Item?.FaceThumbKey
      ? toPublicUrl(faceMeta.Item.FaceThumbKey)
      : null;

    // 2) Query images for this face
    const out = await docClient.send(
      new QueryCommand({
        TableName: FACE_IMAGES_TABLE,
        KeyConditionExpression: "EventFaceId = :k",
        ExpressionAttributeValues: { ":k": eventFaceId },
        ScanIndexForward: false, // newest first
        Limit: limit,
        ExclusiveStartKey,
        ProjectionExpression:
          "ImageSort, OriginalKey, MdKey, ThumbKey, CapturedAt",
      })
    );

    // 3) Map to URL-only payload (no keys returned)
    const images = (out.Items || []).map((it) => ({
      imageSort: it.ImageSort,
      capturedAt: it.CapturedAt || null,
      originalUrl: toPublicUrl(it.OriginalKey),
      mdUrl: toPublicUrl(it.MdKey),
      thumbUrl: toPublicUrl(it.ThumbKey),
    }));

    const nextCursor = out.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(out.LastEvaluatedKey), "utf8").toString("base64")
      : null;

    return res.json({
      success: true,
      count: images.length,
      faceThumbUrl, // <- requested addition
      images,
      nextCursor,
    });
  } catch (err) {
    console.error("Error querying FaceImages:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching images" });
  }
};



export const updateEvent = async (req, res) => {
  try {
    const { name } = req.body;
    const eventId = req.params.eventId;

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (name) {
      event.name = name;
    }

    await event.save();

    res.json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating event",
      error: error.message,
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const userId = event.userId || event.createdBy;

    console.log(`🔒 ULTRA SAFE DELETE MODE`);
    console.log(`   EventID: "${eventId}" (length: ${eventId.length})`);
    console.log(`   UserID: "${userId}" (length: ${userId.length})`);

    const s3EventPath = `saylani-moments/${userId}/${eventId}/`;

    console.log(`   Constructed Path: "${s3EventPath}"`);
    console.log(`   Path Length: ${s3EventPath.length}`);

    if (
      !s3EventPath.includes(`/${userId}/`) ||
      !s3EventPath.includes(`/${eventId}/`)
    ) {
      throw new Error(`Path validation failed - missing required ID segments`);
    }

    if (!s3EventPath.endsWith(`${eventId}/`)) {
      throw new Error(`Path validation failed - must end with eventId/`);
    }

    const slashCount = (s3EventPath.match(/\//g) || []).length;
    if (slashCount !== 3) {
      throw new Error(
        `Path validation failed - expected 3 slashes, got ${slashCount}`
      );
    }

    console.log(`✅ Path validation passed`);

    const listParams = {
      Bucket,
      Prefix: s3EventPath,
      MaxKeys: 1000,
    };

    console.log(`📋 Listing objects with prefix: "${s3EventPath}"`);
    const listResponse = await s3.send(new ListObjectsV2Command(listParams));

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`📭 No S3 objects found for deletion`);
    } else {
      console.log(
        `📁 Found ${listResponse.Contents.length} objects to analyze:`
      );

      const safeObjects = [];
      const unsafeObjects = [];

      listResponse.Contents.forEach((obj, index) => {
        console.log(`   ${index + 1}. Checking: "${obj.Key}"`);

        if (!obj.Key.startsWith(s3EventPath)) {
          console.log(`   ❌ UNSAFE: Doesn't start with expected path`);
          unsafeObjects.push(obj);
          return;
        }

        if (obj.Key.length <= s3EventPath.length) {
          console.log(`   ❌ UNSAFE: Too short (might be parent folder)`);
          unsafeObjects.push(obj);
          return;
        }

        const pathParts = obj.Key.split("/");
        const eventIdIndex = pathParts.indexOf(eventId);
        const userIdIndex = pathParts.indexOf(userId);

        if (eventIdIndex === -1 || userIdIndex === -1) {
          console.log(`   ❌ UNSAFE: Missing required ID in path`);
          unsafeObjects.push(obj);
          return;
        }

        if (userIdIndex >= eventIdIndex) {
          console.log(`   ❌ UNSAFE: Incorrect ID order in path`);
          unsafeObjects.push(obj);
          return;
        }

        console.log(`   ✅ SAFE: Valid file in event folder`);
        safeObjects.push(obj);
      });

      if (unsafeObjects.length > 0) {
        console.log(
          `🚨 DANGER DETECTED: ${unsafeObjects.length} unsafe objects found!`
        );
        unsafeObjects.forEach((obj) => {
          console.log(`   💥 UNSAFE: ${obj.Key}`);
        });

        return res.status(400).json({
          success: false,
          message: "Unsafe delete operation detected",
          details: {
            eventId,
            userId,
            expectedPath: s3EventPath,
            totalObjects: listResponse.Contents.length,
            safeObjects: safeObjects.length,
            unsafeObjects: unsafeObjects.length,
            unsafeKeys: unsafeObjects.map((o) => o.Key),
          },
        });
      }

      if (safeObjects.length > 0) {
        console.log(
          `🔒 Proceeding with SAFE deletion of ${safeObjects.length} objects`
        );

        const deleteParams = {
          Bucket,
          Delete: {
            Objects: safeObjects.map((obj) => ({ Key: obj.Key })),
            Quiet: false,
          },
        };

        const deleteResponse = await s3.send(
          new DeleteObjectsCommand(deleteParams)
        );

        console.log(`✅ S3 Deletion completed:`);
        console.log(
          `   Successfully deleted: ${deleteResponse.Deleted?.length || 0}`
        );
        console.log(`   Errors: ${deleteResponse.Errors?.length || 0}`);

        if (deleteResponse.Deleted) {
          deleteResponse.Deleted.forEach((deleted) => {
            console.log(`   🗑️  Deleted: ${deleted.Key}`);
          });
        }
      } else {
        console.log(`📭 No safe objects to delete`);
      }
    }

    const gsi1pk = `EVENT#${eventId}`;
    let deletedFaceRecords = 0;

    try {
      const queryParams = {
        TableName: TABLE_NAME,
        IndexName: TABLE_INDEX_NAME,
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: { ":gsi1pk": gsi1pk },
      };

      const queryResult = await docClient.send(new QueryCommand(queryParams));

      if (queryResult.Items && queryResult.Items.length > 0) {
        const batchSize = 25;
        for (let i = 0; i < queryResult.Items.length; i += batchSize) {
          const batch = queryResult.Items.slice(i, i + batchSize);
          const validRecords = batch.filter((record) => record.FaceId);

          if (validRecords.length > 0) {
            const batchDeleteParams = {
              RequestItems: {
                [TABLE_NAME]: validRecords.map((record) => ({
                  DeleteRequest: { Key: { FaceId: record.FaceId } },
                })),
              },
            };

            await docClient.send(new BatchWriteCommand(batchDeleteParams));
            deletedFaceRecords += validRecords.length;
          }
        }
      }
    } catch (dynamoError) {
      console.error("DynamoDB deletion error:", dynamoError);
    }

    await Event.deleteOne({ _id: eventId });

    console.log(`🎉 Event deletion completed successfully`);

    res.json({
      success: true,
      message: "Event deleted safely",
      details: {
        eventId,
        userId,
        s3Path: s3EventPath,
        deletedS3Objects:
          listResponse.Contents?.filter(
            (obj) =>
              obj.Key.startsWith(s3EventPath) &&
              obj.Key.length > s3EventPath.length
          ).length || 0,
        deletedFaceRecords,
        pathValidation: {
          expectedPath: s3EventPath,
          slashCount: slashCount,
          endsWithEventId: s3EventPath.endsWith(`${eventId}/`),
          containsUserAndEvent:
            s3EventPath.includes(`/${userId}/`) &&
            s3EventPath.includes(`/${eventId}/`),
        },
      },
    });
  } catch (error) {
    console.error("Ultra Safe Delete Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: "Failed to delete event safely",
    });
  }
};

// export const deleteEvent = async (req, res) => {
//   try {
//     const event = await Event.findById(req.params.eventId);

//     if (!event) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Event not found" });
//     }

//     await Event.deleteOne({ _id: req.params.eventId });

//     res.json({ success: true, message: "Event deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
