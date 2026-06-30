import mongoose from 'mongoose';

export async function setupIndexes() {
  const db = mongoose.connection.db;
  if (!db) {
    console.error('MongoDB connection not ready when setupIndexes was called');
    return;
  }
  // face_metadata collection (stores non-vector face data)
  await db.collection('face_metadata').createIndex({ faceId: 1 }, { unique: true });
  await db.collection('face_metadata').createIndex({ eventId: 1, createdAt: -1 });
  await db.collection('face_metadata').createIndex({ imageKey: 1 });

  // Events collection (already using Mongoose model)
  await db.collection('events').createIndex({ userId: 1, createdAt: -1 });

  console.log('MongoDB indexes created');
}
