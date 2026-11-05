import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function migrateSessions(db = mongoose.connection.db) {
  const collections = await db.listCollections().toArray();
  const hasOldSessions = collections.some((c) => c.name === 'sessions');
  if (!hasOldSessions) {
    return { migratedLogin: 0, migratedLearning: 0 };
  }

  const oldSessionsCol = db.collection('sessions');
  const count = await oldSessionsCol.countDocuments();
  if (count === 0) return { migratedLogin: 0, migratedLearning: 0 };

  const allDocs = await oldSessionsCol.find({}).toArray();
  const loginDocs = allDocs.filter((d) => d.session);
  const learningDocs = allDocs.filter((d) => !d.session);

  let migratedLogin = 0;
  let migratedLearning = 0;

  if (loginDocs.length > 0) {
    const loginCol = db.collection('login_sessions');
    for (const doc of loginDocs) {
      await loginCol.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
      migratedLogin++;
    }
    try {
      await loginCol.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
    } catch (e) {
      // index might already exist
    }
  }

  if (learningDocs.length > 0) {
    const learningCol = db.collection('learning_sessions');
    for (const doc of learningDocs) {
      await learningCol.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
      migratedLearning++;
    }
  }

  // Remove migrated documents from old sessions collection to prevent collisions
  if (migratedLogin > 0 || migratedLearning > 0) {
    try {
      await oldSessionsCol.drop();
      console.log('✔ Dropped legacy colliding "sessions" collection.');
    } catch (err) {
      console.warn('Could not drop old sessions collection:', err.message);
    }
  }

  return { migratedLogin, migratedLearning };
}

// Standalone runner
if (process.argv[1]?.endsWith('migrate-sessions-collection.js')) {
  (async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Migration] Connected to DB:', mongoose.connection.name);
    const res = await migrateSessions();
    console.log('[Migration] Result:', res);
    const loginCount = await mongoose.connection.db.collection('login_sessions').countDocuments();
    const learningCount = await mongoose.connection.db.collection('learning_sessions').countDocuments();
    console.log('[Migration] Total login_sessions:', loginCount);
    console.log('[Migration] Total learning_sessions:', learningCount);
    await mongoose.disconnect();
  })().catch(console.error);
}

