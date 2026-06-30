import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant Cloud client with API key
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 30000,
});

const COLLECTION_NAME = 'faces';

export async function initializeQdrant() {
  try {
    // Check if collection exists
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      // Create collection with optimized settings
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 512,
          distance: 'Cosine',
        },
        hnsw_config: {
          m: 16,
          ef_construct: 200,
        },
      });

      // Create payload index for filtering
      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'eventId',
        field_schema: 'keyword',
      });

      console.log('Qdrant Cloud collection created');
    } else {
      console.log('Qdrant Cloud collection already exists');
    }
  } catch (error) {
    console.error('Qdrant Cloud initialization error:', error);
  }
}

export async function deleteFacesByEvent(eventId) {
  await qdrant.delete(COLLECTION_NAME, {
    filter: {
      must: [{ key: 'eventId', match: { value: eventId } }],
    },
  });
}

export { qdrant };
