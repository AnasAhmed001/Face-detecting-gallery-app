import { listObjects, deleteObjects, putObject, generatePublicUrl } from "../lib/storageService.js";
import { getBaseName } from "../utils/imageUtils.js";
import mongoose from 'mongoose';

const Bucket = process.env.MINIO_BUCKET;

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

    const [thumbContents, mdContents, rawContents] = await Promise.all([
      listObjects(PrefixThumb),
      listObjects(PrefixMd),
      listObjects(PrefixRaw),
    ]);

    const rawBaseSet = new Set(rawContents.map((i) => getBaseName(i.name)));
    const mdBaseSet = new Set(mdContents.map((i) => getBaseName(i.name)));

    const allImages = thumbContents
      .map((item) => item.name.split("/").pop())
      .filter((file) => {
        const base = file.split(".")[0];
        return rawBaseSet.has(base) && mdBaseSet.has(base);
      })
      .map((fileName) => {
        const base = fileName.split(".")[0];

        const rawExt =
          rawContents
            .find((i) => i.name.includes(`${base}.`))
            ?.name?.split(".")
            .pop() || "jpeg";
        const mdExt =
          mdContents
            .find((i) => i.name.includes(`${base}.`))
            ?.name?.split(".")
            .pop() || "jpeg";
        const thumbExt =
          thumbContents
            .find((i) => i.name.includes(`${base}.`))
            ?.name?.split(".")
            .pop() || "webp";

        return {
          id: base,
          thumbUrl: generatePublicUrl(`${PrefixThumb}${base}.${thumbExt}`),
          mdUrl: generatePublicUrl(`${PrefixMd}${base}.${mdExt}`),
          rawUrl: generatePublicUrl(`${PrefixRaw}${base}.${rawExt}`),
        };
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
    const db = mongoose.connection.db;

    // Query MongoDB for face records
    const imageKeyPrefix = `${basePath}derivative/md/${fileBaseName}`;
    const faceRecords = await db.collection('face_metadata').find({
      eventId,
      imageKey: { $regex: fileBaseName }
    }).toArray();

    // List objects from MinIO
    const [rawList, mdList, thumbList] = await Promise.all([
      listObjects(`${basePath}rawuploads/`),
      listObjects(`${basePath}derivative/md/`),
      listObjects(`${basePath}derivative/thumb/`),
    ]);

    const filesToDelete = [];

    const rawMatch = rawList.filter((i) => i.name.includes(`${fileBaseName}.`));
    const mdMatch = mdList.filter((i) => i.name.includes(`${fileBaseName}.`));
    const thumbMatch = thumbList.filter((i) => i.name.includes(`${fileBaseName}.`));

    if (rawMatch?.length) filesToDelete.push(...rawMatch.map((i) => i.name));
    if (mdMatch?.length) filesToDelete.push(...mdMatch.map((i) => i.name));
    if (thumbMatch?.length) filesToDelete.push(...thumbMatch.map((i) => i.name));

    // Delete from MinIO
    if (filesToDelete.length > 0) {
      await deleteObjects(filesToDelete);
    }

    // Delete from MongoDB
    if (faceRecords.length > 0) {
      await db.collection('face_metadata').deleteMany({
        faceId: { $in: faceRecords.map(r => r.faceId) }
      });
    }

    res.status(200).json({
      message: "Image and associated face data deleted successfully",
      deletedFaceRecords: faceRecords.length,
      deletedFiles: filesToDelete,
    });
  } catch (err) {
    console.error("Delete Image Error:", err);
    res.status(500).json({ error: "Failed to delete image", details: err.message });
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

    await putObject(key, file.buffer, file.mimetype);

    res.status(200).json({
      message: "Cover photo uploaded successfully",
      fileName: file.originalname,
      url: generatePublicUrl(key),
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

    const coverObjects = await listObjects(prefix);

    if (!coverObjects || coverObjects.length === 0) {
      return res.status(404).json({ error: "No cover photo found" });
    }

    const coverObj = coverObjects[0];
    const url = generatePublicUrl(coverObj.name);

    res.status(200).json({
      fileName: coverObj.name.split("/").pop(),
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

    const coverObjects = await listObjects(prefix);

    if (coverObjects.length === 0) {
      return res.status(404).json({ error: "No cover photo found to delete" });
    }

    await deleteObjects(coverObjects.map((obj) => obj.name));

    res.status(200).json({
      message: "Cover photo(s) deleted successfully",
      deletedFiles: coverObjects.map((f) => f.name.split("/").pop()),
    });
  } catch (err) {
    console.error("Delete Cover Error:", err);
    res.status(500).json({ error: "Failed to delete cover photo" });
  }
};
