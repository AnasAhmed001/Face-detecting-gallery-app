import Event from "../models/Event.js";
import { listObjects, deleteObjects, generatePublicUrl } from "../lib/storageService.js";
import { deleteFacesByEvent } from "../lib/qdrantService.js";
import { cache } from "../lib/cacheService.js";
import mongoose from 'mongoose';

const Bucket = process.env.MINIO_BUCKET;

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
  console.log(eventId);

  if (!eventId) {
    return res
      .status(400)
      .json({ success: false, message: "eventId is required" });
  }

  try {
    const db = mongoose.connection.db;

    // Aggregate to get unique faces per event with image counts
    const faces = await db.collection('face_metadata').aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: "$faceId",
          faceId: { $first: "$faceId" },
          eventId: { $first: "$eventId" },
          imageKey: { $first: "$imageKey" },
          firstSeenAt: { $min: "$createdAt" },
          lastSeenAt: { $max: "$createdAt" },
          imageCount: { $sum: 1 }
        }
      }
    ]).toArray();

    if (!faces || faces.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No faces found for this event" });
    }

    res.json({
      success: true,
      count: faces.length,
      faces: faces.map((f) => ({
        faceId: f.faceId,
        eventId: f.eventId,
        thumbUrl: generatePublicUrl(f.imageKey), // Using the first image as thumb
        imageCount: f.imageCount,
        firstSeenAt: f.firstSeenAt,
        lastSeenAt: f.lastSeenAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching event faces:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching event faces" });
  }
};

export const getEventFaceImages = async (req, res) => {
  const { eventId, faceId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "30", 10), 100);
  const page = parseInt(req.query.page || "1", 10);
  const skip = (page - 1) * limit;

  if (!eventId || !faceId) {
    return res
      .status(400)
      .json({ success: false, message: "eventId and faceId are required" });
  }

  try {
    const db = mongoose.connection.db;

    // Get face thumbnail from face_metadata
    const faceMeta = await db.collection('face_metadata').findOne({
      faceId,
      eventId
    });

    const faceThumbUrl = faceMeta?.imageKey
      ? generatePublicUrl(faceMeta.imageKey)
      : null;

    // Query images for this face with pagination
    const faceImages = await db.collection('face_images').find({
      eventId,
      faceId
    })
    .sort({ processedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('face_images').countDocuments({
      eventId,
      faceId
    });

    // Map to URL-only payload
    const images = faceImages.map((it) => ({
      imageId: it._id.toString(),
      capturedAt: it.processedAt || null,
      originalUrl: generatePublicUrl(it.originalKey),
      mdUrl: generatePublicUrl(it.mdKey),
      thumbUrl: generatePublicUrl(it.thumbKey),
    }));

    return res.json({
      success: true,
      count: images.length,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      faceThumbUrl,
      images,
    });
  } catch (err) {
    console.error("Error querying face images:", err);
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

    // List objects from MinIO
    console.log(`📋 Listing objects with prefix: "${s3EventPath}"`);
    const listResponse = await listObjects(s3EventPath, 1000);

    if (!listResponse || listResponse.length === 0) {
      console.log(`📭 No MinIO objects found for deletion`);
    } else {
      console.log(`📁 Found ${listResponse.length} objects to analyze:`);

      const safeObjects = [];
      const unsafeObjects = [];

      listResponse.forEach((obj, index) => {
        console.log(`   ${index + 1}. Checking: "${obj.name}"`);

        if (!obj.name.startsWith(s3EventPath)) {
          console.log(`   ❌ UNSAFE: Doesn't start with expected path`);
          unsafeObjects.push(obj);
          return;
        }

        if (obj.name.length <= s3EventPath.length) {
          console.log(`   ❌ UNSAFE: Too short (might be parent folder)`);
          unsafeObjects.push(obj);
          return;
        }

        const pathParts = obj.name.split("/");
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
          console.log(`   💥 UNSAFE: ${obj.name}`);
        });

        return res.status(400).json({
          success: false,
          message: "Unsafe delete operation detected",
          details: {
            eventId,
            userId,
            expectedPath: s3EventPath,
            totalObjects: listResponse.length,
            safeObjects: safeObjects.length,
            unsafeObjects: unsafeObjects.length,
            unsafeKeys: unsafeObjects.map((o) => o.name),
          },
        });
      }

      if (safeObjects.length > 0) {
        console.log(
          `🔒 Proceeding with SAFE deletion of ${safeObjects.length} objects`
        );

        await deleteObjects(safeObjects.map((obj) => obj.name));

        console.log(`✅ MinIO Deletion completed:`);
        console.log(`   Successfully deleted: ${safeObjects.length}`);
      } else {
        console.log(`📭 No safe objects to delete`);
      }
    }

    // Delete from MongoDB
    const db = mongoose.connection.db;
    let deletedFaceRecords = 0;

    try {
      const faceRecords = await db.collection('face_metadata').find({ eventId }).toArray();

      if (faceRecords.length > 0) {
        await db.collection('face_metadata').deleteMany({ eventId });
        deletedFaceRecords = faceRecords.length;
      }
    } catch (mongoError) {
      console.error("MongoDB deletion error:", mongoError);
    }

    // Delete from Qdrant
    try {
      await deleteFacesByEvent(eventId);
      console.log(`✅ Deleted face vectors from Qdrant`);
    } catch (qdrantError) {
      console.error("Qdrant deletion error:", qdrantError);
    }

    // Invalidate cache
    try {
      const deletedCacheKeys = await cache.invalidateEvent(eventId);
      console.log(`✅ Invalidated ${deletedCacheKeys} cache keys`);
    } catch (cacheError) {
      console.error("Cache invalidation error:", cacheError);
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
          listResponse?.filter(
            (obj) =>
              obj.name.startsWith(s3EventPath) &&
              obj.name.length > s3EventPath.length
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
