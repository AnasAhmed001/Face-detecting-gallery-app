import Redis from 'ioredis';
import crypto from 'crypto';

// Initialize Upstash Redis client
const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {
    rejectUnauthorized: true
  },
  maxRetriesPerRequest: null,
});

export class CacheService {
  // Cache face match results (30 min TTL)
  async cacheFaceMatch(eventId, selfieBuffer, results) {
    const selfieHash = crypto.createHash('md5').update(selfieBuffer).digest('hex');
    const key = `face-match:${eventId}:${selfieHash}`;
    await redis.setex(key, 1800, JSON.stringify(results));
  }

  async getCachedFaceMatch(eventId, selfieBuffer) {
    const selfieHash = crypto.createHash('md5').update(selfieBuffer).digest('hex');
    const key = `face-match:${eventId}:${selfieHash}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache image URLs (24h TTL)
  async cacheImageUrls(imageKey, urls) {
    const key = `image-urls:${imageKey}`;
    await redis.setex(key, 86400, JSON.stringify(urls));
  }

  async getCachedImageUrls(imageKey) {
    const cached = await redis.get(`image-urls:${imageKey}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Invalidate cache when event is deleted
  async invalidateEvent(eventId) {
    const pattern = `*:${eventId}:*`;
    const stream = redis.scanStream({ match: pattern });
    const keys = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (resultKeys) => {
        keys.push(...resultKeys);
      });
      stream.on('end', async () => {
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        resolve(keys.length);
      });
      stream.on('error', reject);
    });
  }
}

export const cache = new CacheService();
export { redis };
