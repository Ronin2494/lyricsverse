import { getDatabase } from './mongo.mjs';

export function validateRating(value) {
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('invalid_rating');
  return value;
}
export async function saveRating({ rating, visitorId }) {
  validateRating(rating);
  if (typeof visitorId !== 'string' || !/^[a-f0-9-]{36}$/.test(visitorId)) throw new Error('invalid_visitor_id');
  const db = await getDatabase();
  await db.collection('ratings').updateOne(
    { visitorId },
    { $set: { rating, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  return { rating };
}
export async function getRatingSummary() {
  const db = await getDatabase();
  const rows = await db.collection('ratings').aggregate([
    { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$rating' } } }
  ]).toArray();
  const count = rows[0]?.count || 0;
  return { count, average: count ? Math.round(rows[0].total / count * 10) / 10 : null };
}
