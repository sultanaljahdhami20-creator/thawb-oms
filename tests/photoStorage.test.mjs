import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadPhoto, transformPhotos, resolvePhoto, storedPhotoPath } from '../src/photoStorage.js';
import { factoryPrintDocument } from '../src/factoryReport.js';
import { errorPrintDocument } from '../src/jacketErrorPrint.js';
const source = 'data:image/jpeg;base64,aGVsbG8=';
const canonical = 'https://example.supabase.co/storage/v1/object/authenticated/jacket-photos/' + 'a'.repeat(64) + '.jpeg';
test('uploads immutable bytes and verifies download before returning a reference', async () => {
  let received;
  const bucket = {upload:async(path,bytes,options)=>{received={path,bytes,options};return {};},download:async()=>({data:new Blob(['hello'])}),getPublicUrl:path=>({data:{publicUrl:'https://example.supabase.co/storage/v1/object/public/jacket-photos/'+path}})};
  const result = await uploadPhoto({storage:{from:()=>bucket}}, source);
  assert.equal(received.options.upsert,false);
  assert.equal(new TextDecoder().decode(received.bytes),'hello');
  assert.match(storedPhotoPath(result),/^[a-f0-9]{64}\.jpeg$/);
  bucket.download=async()=>({data:new Blob(['different'])});
  await assert.rejects(uploadPhoto({storage:{from:()=>bucket}},source),/verification failed/);
});
test('duplicate uploads verify existing content; storage failures preserve the input',async()=>{
  const bucket={upload:async()=>({error:{statusCode:'409'}}),download:async()=>({data:new Blob(['hello'])}),getPublicUrl:()=>({data:{publicUrl:canonical.replace('/authenticated/','/public/')}})};
  assert.equal(await uploadPhoto({storage:{from:()=>bucket}},source),canonical);
  bucket.upload=async()=>({error:new Error('offline')});
  await assert.rejects(uploadPhoto({storage:{from:()=>bucket}},source),/offline/);
  assert.equal(source,'data:image/jpeg;base64,aGVsbG8=');
});
test('transforms nested original/crop images and encoded history without modifying other fields',async()=>{
  const input={notes:JSON.stringify([{photos:[{url:source,originalUrl:source,caption:source,crop:{x:5},printScale:50}]}]),status_history:JSON.stringify([{previous:{url:source}}]),unrelated:source};
  const result=await transformPhotos(input,async()=>canonical);
  const image=JSON.parse(result.notes)[0].photos[0];
  assert.equal(image.url,canonical); assert.equal(image.originalUrl,canonical); assert.equal(image.caption,source);assert.equal(image.crop.x,5);assert.equal(image.printScale,50);
  assert.equal(JSON.parse(result.status_history)[0].previous.url,canonical);assert.equal(result.unrelated,source);assert.ok(input.notes.includes(source));
});
test('private references sign afresh for display and both print layouts retain photos',async()=>{
  const signed='https://example.supabase.co/storage/v1/object/sign/jacket-photos/x.jpeg?token=a&x=b';
  const client={storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:signed}})})}};
  const photo=await transformPhotos({url:canonical},url=>resolvePhoto(client,url));
  const factory=factoryPrintDocument({order_id:'1'},{issues:[{received:photo}],formPhoto:photo});
  assert.equal((factory.match(/<figure>/g)||[]).length,2);assert.ok(factory.includes('token=a&amp;x=b'));
  const customer=errorPrintDocument([{order_id:'1',notes:[{photos:[photo]}]}]);
  assert.ok(customer.includes('token=a&amp;x=b'));assert.ok(factory.includes('Promise.all'));assert.ok(customer.includes('Promise.all'));
});
