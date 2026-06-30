import mongoose from 'mongoose';

const db = mongoose.connection.db;

export async function setupIndexes() {
  // face_metadata collection (stores non-vector face data)
  await db.collection('face_metadata').createIndex({ faceId: 1 }, { unique: true });
  await db.collection('face_metadata').createIndex({ eventId: 1, createdAt: -1 });
  await db.collection('face_metadata').createIndex({ imageKey: 1 });

  // Events collection (already using Mongoose model)
  await db.collection('events').createIndex({ userId: 1, createdAt: -1 });

  console.log('MongoDB indexes created');
}
