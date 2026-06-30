import axios from 'axios';
import crypto from 'crypto';

const MODAL_DETECT_FACES_URL = process.env.MODAL_DETECT_FACES_URL || `${process.env.MODAL_FUNCTION_URL}/detect-faces`;
const MODAL_MATCH_FACE_URL = process.env.MODAL_MATCH_FACE_URL || `${process.env.MODAL_FUNCTION_URL}/match-face`;
const MODAL_WEBHOOK_SECRET = process.env.MODAL_WEBHOOK_SECRET;

/**
 * Trigger face detection job on Modal Labs
 */
export async function enqueueFaceDetection({ userId, eventId, imageKey }) {
  try {
    const response = await axios.post(MODAL_DETECT_FACES_URL, {
      userId,
      eventId,
      imageKey,
      bucket: process.env.R2_BUCKET,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': MODAL_WEBHOOK_SECRET,
      },
      timeout: 300000, // 5 minute timeout
    });

    return response.data;
  } catch (error) {
    console.error('Error triggering face detection on Modal:', error.message);
    throw error;
  }
}

/**
 * Trigger face matching job on Modal Labs
 */
export async function enqueueFaceMatching({ eventId, selfieBuffer, threshold = 0.75 }) {
  try {
    // Convert buffer to base64 for transmission
    const selfieBase64 = selfieBuffer.toString('base64');

    const response = await axios.post(MODAL_MATCH_FACE_URL, {
      eventId,
      selfieBase64,
      threshold,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': MODAL_WEBHOOK_SECRET,
      },
      timeout: 60000, // 1 minute timeout for matching
    });

    return response.data;
  } catch (error) {
    console.error('Error triggering face matching on Modal:', error.message);
    throw error;
  }
}

/**
 * Verify webhook signature from Modal Labs
 */
export function verifyModalWebhook(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', MODAL_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
