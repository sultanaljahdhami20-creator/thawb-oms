import test from 'node:test';
import assert from 'node:assert/strict';
import {additionalContacts,normalizePhone,validContactPhone,submissionSignature,submissionRequest,matchingReports,mergeReports} from '../src/jacketReportActions.js';
import {insertReport,reportRows} from '../src/jacketWorkflow.js';
const payload={order_id:'A',affected_jackets:1,error_description:'Logo wrong',notes:JSON.stringify([{type:'workflow',kind:'embroidery',at:'2026-01-01'},{type:'contact',phone:'+968 9123 4567'}]),status_history:'[]'};
test('retry after server commit and lost response recovers exactly the same report',async()=>{
  let committed=null,visible=false,calls=0;
  const client={from(){return {
    insert(entry){return {select(){return {async single(){calls++;if(!committed){committed={id:55,...entry};return {error:{message:'Response lost after commit'}};}return {error:{code:'23505'}};}};}};},
    select(){const chain={eq(){return chain;},async single(){return visible?{data:committed}:{error:{message:'Network still unavailable'}};}};return chain;}
  };}};
  const request={key:crypto.randomUUID(),signature:await submissionSignature(payload)};
  await assert.rejects(insertReport(client,payload,request));visible=true;
  const result=await insertReport(client,payload,request);
  assert.equal(result.id,55);assert.equal(result.submissionExisting,true);assert.equal(calls,2);
});
test('submission keys survive form remount/retry without storing contact data',async()=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const signature=await submissionSignature(payload);
  const first=submissionRequest(signature,false,storage),retry=submissionRequest(signature,false,storage);
  assert.equal(first.key,retry.key);assert(!JSON.stringify([...values]).includes('9123'));
  assert.notEqual(submissionRequest(signature,true,storage).key,first.key);
  const changed={...payload,notes:JSON.stringify([{type:'workflow',kind:'embroidery',at:'different'},{type:'contact',phone:'+968 9123 4567'}])};
  assert.equal(await submissionSignature(changed),signature);
});
test('additional phone numbers are validated, deduplicated and never replace original phone',()=>{
  assert.equal(normalizePhone('٩١٢٣ ٤٥٦٧'),'9123 4567');
  for(const number of ['9123 4567','+968 9123 4567','٩١٢٣٤٥٦٧'])assert(validContactPhone(number));
  for(const number of ['123','abc','<script>','1234567890123456'])assert(!validContactPhone(number));
  const record={customer_phone:'original',notes:[{type:'contact',phone:'9123 4567'},{type:'contact',phone:'91234567'},{text:'keep'}]};
  assert.equal(additionalContacts(record).length,1);assert.equal(record.customer_phone,'original');
});
test('matching duplicates and archived copies never hide legitimate distinct reports',()=>{
  const reports=[{id:1,order_id:'A',error_description:' Logo wrong ',affectedJackets:1},{id:2,order_id:'A',error_description:'Wrong size',affectedJackets:1},{id:3,order_id:'A',error_description:'Logo wrong',affectedJackets:1,notes:[{type:'duplicate_link',target_id:1}]}];
  assert.deepEqual(matchingReports(reports,'A','logo wrong',1).map(r=>r.id),[1]);
  assert.equal(reportRows([],reports).length,2);assert.equal(reportRows([],reports,{includeMerged:true}).length,3);
});
test('linking a duplicate writes only a protected source marker and preserves both originals',async()=>{
  const source={id:2,order_id:'A',updated_at:'2026-01-01',content_fingerprint:'source',notes:[{text:'Source note',photos:[{url:'https://example.com/source.jpg'}]}],status_history:[]};
  const target={id:1,order_id:'A',content_fingerprint:'target',notes:[{text:'Target note'}],status_history:[]};
  const filters=[],writes=[];
  const client={from(){return {
    select(){const chain={eq(){return chain;},single:async()=>({data:structuredClone(target)})};return chain;},
    update(patch){writes.push(patch);const chain={eq(key,value){filters.push([key,value]);return chain;},select(){return {single:async()=>({data:{...source,...patch}})};}};return chain;}
  };}};
  const result=await mergeReports(client,source,target,'Staff');
  assert.equal(writes.length,1);assert(filters.some(([key,value])=>key==='content_fingerprint'&&value==='source'));
  assert.deepEqual(result.source.notes[0],source.notes[0]);assert.equal(result.source.notes.at(-1).target_id,1);
  assert.deepEqual(result.target.notes,target.notes);
  const rows=reportRows([],[result.target,result.source]);assert.equal(rows.length,1);assert.equal(rows[0].relatedReports[0].id,2);
  assert.equal(source.notes.length,1);
  await assert.rejects(mergeReports(client,target,source,'Staff'));
});
