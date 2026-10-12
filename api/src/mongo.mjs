import { MongoClient } from 'mongodb';

const databaseName = process.env.MONGODB_DATABASE || 'lyricsverse';
const mongoUri = () => process.env.MONGODB_URI || process.env.MONGO_DB_URI;
let client;
let pending;
export async function getDatabase() {
  if (!mongoUri()) throw new Error('mongodb_not_configured');
  if (!pending) {
    pending = (async () => {
      client = new MongoClient(mongoUri(), { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
      await client.connect();
      return client.db(databaseName);
    })().catch(error => { pending = undefined; client = undefined; throw error; });
  }
  return pending;
}
export async function checkMongoDatabase() {
  if (!mongoUri()) return { available: false, reason: 'not_configured' };
  try { const db = await getDatabase(); await db.command({ ping: 1 }); return { available: true }; }
  catch { return { available: false, reason: 'connection_failed' }; }
}
export async function closeMongoDatabase() { if (client) await client.close(); client = undefined; pending = undefined; }
