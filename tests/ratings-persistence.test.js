import test from 'node:test';
import assert from 'node:assert/strict';
import {saveRating,getRatingSummary} from '../api/src/ratings.mjs';

function mockDatabase(){
 const records=new Map();
 const collection={
  async createIndex(keys,options){ assert.deepEqual(keys,{visitorId:1});assert.equal(options.unique,true);return 'unique_rating_visitor'; },
  async updateOne(filter,update,options){
   assert.equal(options.upsert,true);
   const previous=records.get(filter.visitorId);
   records.set(filter.visitorId,{...(previous||update.$setOnInsert),...update.$set,visitorId:filter.visitorId});
   return {matchedCount:previous?1:0,upsertedCount:previous?0:1};
  },
  aggregate(pipeline){
   assert.equal(pipeline[0].$group.count.$sum,1);
   return {async toArray(){
    const ratings=[...records.values()];
    return ratings.length?[{count:ratings.length,total:ratings.reduce((sum,r)=>sum+r.rating,0)}]:[];
   }};
  }
 };
 return {database:async()=>({collection(name){assert.equal(name,'ratings');return collection;}}),records};
}
const visitorA='11111111-1111-4111-8111-111111111111';
const visitorB='22222222-2222-4222-8222-222222222222';
test('empty database returns zero ratings and null average',async()=>{
 const {database}=mockDatabase();assert.deepEqual(await getRatingSummary(database),{count:0,average:null});
});
test('first submission creates record and aggregate',async()=>{
 const {database,records}=mockDatabase();
 await saveRating({rating:5,visitorId:visitorA},database);
 assert.equal(records.size,1);
 assert.deepEqual(await getRatingSummary(database),{count:1,average:5});
});
test('repeat submission updates rather than doubles count',async()=>{
 const {database,records}=mockDatabase();
 await saveRating({rating:5,visitorId:visitorA},database);
 const createdAt=records.get(visitorA).createdAt;
 await saveRating({rating:3,visitorId:visitorA},database);
 assert.equal(records.size,1);
 assert.equal(records.get(visitorA).createdAt,createdAt);
 assert.deepEqual(await getRatingSummary(database),{count:1,average:3});
});
test('different visitors contribute to correct rounded average',async()=>{
 const {database}=mockDatabase();
 await saveRating({rating:5,visitorId:visitorA},database);
 await saveRating({rating:4,visitorId:visitorB},database);
 assert.deepEqual(await getRatingSummary(database),{count:2,average:4.5});
});
test('invalid rating or identifier cannot write records',async()=>{
 const {database,records}=mockDatabase();
 await assert.rejects(saveRating({rating:6,visitorId:visitorA},database),/invalid_rating/);
 await assert.rejects(saveRating({rating:5,visitorId:'bad'},database),/invalid_visitor_id/);
 assert.equal(records.size,0);
});
