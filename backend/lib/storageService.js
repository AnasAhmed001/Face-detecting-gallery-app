import * as Minio from 'minio';
import { Readable } from 'stream';
import crypto from 'crypto';

// Initialize Cloudflare R2 client (S3-compatible)
const r2Client = new Minio.Client({
  endPoint: `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKey: process.env.R2_ACCESS_KEY_ID,
  secretKey: process.env.R2_SECRET_ACCESS_KEY,
  useSSL: true,
  region: 'auto',
});

export const Bucket = process.env.R2_BUCKET;

// Generate public URL for objects
export function generatePublicUrl(key) {
  return `${process.env.R2_PUBLIC_ENDPOINT}/${key}`;
}

// List objects
export async function listObjects(prefix, maxKeys = 1000) {
  const objects = [];
  const stream = r2Client.listObjectsV2(Bucket, prefix, false);

  return new Promise((resolve, reject) => {
    stream.on('data', obj => objects.push(obj));
    stream.on('end', () => resolve(objects));
    stream.on('error', reject);
  });
}

// Put object with cache headers
export async function putObject(key, buffer, contentType) {
  const stream = Readable.from(buffer);
  const metadata = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000', // 1 year for images
    'ETag': crypto.createHash('md5').update(buffer).digest('hex'),
  };

  await r2Client.putObject(Bucket, key, stream, buffer.length, metadata);
}

// Delete objects
export async function deleteObjects(keys) {
  await r2Client.removeObjects(Bucket, keys);
}

// Get object
export async function getObject(key) {
  const stream = await r2Client.getObject(Bucket, key);
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Generate presigned POST URL (for direct uploads)
export async function generatePresignedPost(prefix, expirySeconds = 900) {
  const policy = r2Client.newPostPolicy();
  policy.setBucket(Bucket);
  policy.setKey(prefix);
  policy.setExpires(new Date(Date.now() + expirySeconds * 1000));
  policy.setContentLengthRange(0, 10485760); // 10MB max

  return await r2Client.presignedPostPolicy(policy);
}

// Generate presigned PUT URL (for direct uploads)
export async function generatePresignedPutUrl(key, expirySeconds = 900) {
  return await r2Client.presignedPutObject(Bucket, key, expirySeconds);
}

// Generate presigned GET URL (for downloads)
export async function generatePresignedUrl(key, expirySeconds = 3600) {
  return await r2Client.presignedGetObject(Bucket, key, expirySeconds);
}

export { r2Client as storageClient };
