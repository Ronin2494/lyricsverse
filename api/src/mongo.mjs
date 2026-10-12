import { MongoClient } from 'mongodb';

const databaseName = process.env.MONGODB_DATABASE || 'lyricsverse';
let client;
let pending;
export async function getDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('mongodb_not_configured');
  if (!pending) {
    pending = (async () => {
      client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
      await client.connect();
      return client.db(databaseName);
    })().catch(error => { pending = undefined; client = undefined; throw error; });
  }
  return pending;
}
export async function checkMongoDatabase() {
  if (!process.env.MONGODB_URI) return { available: false, reason: 'not_configured' };
  try { const db = await getDatabase(); await db.command({ ping: 1 }); return { available: true }; }
  catch { return { available: false, reason: 'connection_failed' }; }
}
export async function closeMongoDatabase() { if (client) await client.close(); client = undefined; pending = undefined; }
