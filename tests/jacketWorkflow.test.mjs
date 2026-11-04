import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {array,workflow,reportRows,filterRows,photos,persistReport,insertReport} from '../src/jacketWorkflow.js';

test('legacy classification uses explicit states, never note text',()=>{
  assert.equal(workflow({status:1,notes:[{text:'resolved refund rejected'}]}).state,'new');
  for(const status of [2,3,4,5,6,7,8,11])assert.equal(workflow({status}).state,'active');
  for(const status of [9,10])assert.equal(workflow({status}).state,'resolved');
  assert.equal(workflow({status:1},{errorSubStatus:9}).state,'rejected');
  assert.equal(workflow({status:1},{errorSubStatus:10}).state,'refund');
  assert.equal(workflow({status:1},{errorSubStatus:8}).state,'active');
});
test('conflicts stay active until explicitly confirmed per report',()=>{
  assert.deepEqual(workflow({status:10},{errorSubStatus:4}).conflict,true);
  assert.equal(workflow({status:10},{errorSubStatus:4}).state,'active');
  const notes=[{type:'workflow',state:'paused',reason:'no reply'},{type:'workflow',state:'resolved'}];
  assert.equal(workflow({status:1,notes:JSON.stringify(notes)},{errorSubStatus:4}).state,'resolved');
});
test('reports remain independent; order-only cases remain visible without invented dates',()=>{
  const orders=[{id:'A',jackets:5,status:13},{id:'B',status:13},{id:'C',status:11}];
  const reports=[{id:1,order_id:'A',status:1,created_at:'2020-01-01',notes:[{type:'affected_jackets',value:2}]},{id:2,order_id:'A',status:10}];
  const rows=reportRows(orders,reports);
  assert.equal(rows.length,3);assert.equal(rows[0].affectedJackets,2);
  assert.equal(rows[2].synthetic,true);assert.equal(rows[2].created_at,null);
  assert.equal(reportRows(orders,[{...reports[0],notes:[{type:'original_date_unknown'}]}])[0].created_at,null);
});
test('filters dates inclusively, keeps unknown dates last and searches descriptions',()=>{
  const rows=reportRows([],[{id:1,created_at:'2026-10-01T12:00:00',status:2,error_description:'wrong color'},{id:2,created_at:'2026-10-03T12:00:00',status:2},{id:3,created_at:null,status:2}]);
  assert.deepEqual(filterRows(rows,{tab:'active'}).map(r=>r.id),[1,2,3]);
  assert.deepEqual(filterRows(rows,{tab:'active',sort:'newest'}).map(r=>r.id),[2,1,3]);
  assert.deepEqual(filterRows(rows,{tab:'active',from:'2026-10-01',to:'2026-10-01'}).map(r=>r.id),[1]);
  assert.equal(filterRows(rows,{tab:'active',search:'COLOR'}).length,1);
});
test('legacy and note images are combined; malformed data and unsafe URLs are excluded',()=>{
  assert.deepEqual(array('{"x":1}'),[]);
  assert.equal(photos({error_image_url:'https://example.com/image.jpg',notes:[{photos:[{url:'data:image/jpeg;base64,abc',caption:'after'},{url:'javascript:alert(1)'}]}]}).length,2);
});
function db(results) {
  const calls=[];return {calls,from(table){return {insert(payload){calls.push({table,payload});return {select(){return {single:async()=>results.shift()};}};},update(payload){calls.push({table,payload});const chain={eq(){return chain;},select(){return {single:async()=>results.shift()};}};return chain;}};}};
}
test('creation keeps a stable unique key and preserves payload and notes',async()=>{
  const payload={order_id:'A',affected_jackets:3,notes:JSON.stringify([{text:'keep'}])};
  const client=db([{data:{id:1,...payload}}]);
  const saved=await insertReport(client,payload,{key:'stable-key',signature:'signature'});
  assert.equal(client.calls[0].payload.submission_key,'stable-key');assert.equal(client.calls[0].payload.notes,payload.notes);assert.equal(saved.submissionExisting,false);
});
test('permission failures, concurrent changes, and zero-row results never become successes',async()=>{
  for(const result of [{error:{message:'denied',code:'42501'}},{data:null,error:null}]) {
    await assert.rejects(persistReport(db([result]),{id:1,updated_at:'2020-01-01'},{}));
    await assert.rejects(insertReport(db([result]),{},{key:'key',signature:'signature'}));
  }
});

test('malformed legacy data remains visible but cannot be overwritten',async()=>{
  const {normalizeReport,reportArrays}=await import('../src/jacketWorkflow.js');
  for(const notes of ['broken JSON','{"unknown":"keep"}',JSON.stringify([null])]) {
    const record=normalizeReport({id:1,notes,status_history:'[]'});
    assert.equal(record.storedNotes,notes);
    assert.equal(record.dataWarning,true);
    assert.throws(()=>reportArrays(record));
    const client=db([]);
    await assert.rejects(persistReport(client,record,{notes:'[]'}));
    assert.equal(client.calls.length,0);
  }
});

function versionedDb(initial) {
  const fingerprint=r=>createHash('md5').update(JSON.stringify(r.notes)+'\n'+JSON.stringify(r.status_history)).digest('hex');
  let row=structuredClone(initial);row.content_fingerprint=fingerprint(row);
  return {get row(){return row;},legacyEdit(notes){row.notes=JSON.stringify(notes);row.content_fingerprint=fingerprint(row);},from(){return {update(patch){
    const filters=[];
    const chain={eq(k,v){filters.push([k,v]);return chain;},select(){return {async single(){
      const matches=filters.every(([k,v])=>['notes','status_history'].includes(k)?JSON.stringify(row[k])===v:row[k]===v);
      if(!matches)return {data:null,error:{code:'PGRST116'}};
      row={...row,...structuredClone(patch)};row.content_fingerprint=fingerprint(row);return {data:structuredClone(row),error:null};
    }};}};return chain;
  }};}};
}

test('concurrent staff edits never overwrite a newer note, even from an old client with unchanged timestamp',async()=>{
  const {normalizeReport}=await import('../src/jacketWorkflow.js');
  const initial={id:1,updated_at:'2026-10-30T12:00:00Z',notes:'[{"text":"original"}]',status_history:'[]'};
  const client=versionedDb(initial),snapshot=normalizeReport(client.row);
  client.legacyEdit([{text:'original'},{text:'another employee update'}]);
  await assert.rejects(persistReport(client,snapshot,{notes:'[{"text":"stale replacement"}]',updated_at:'2026-10-30T12:01:00Z'}));
  assert.equal(JSON.parse(client.row.notes)[1].text,'another employee update');
});

test('note corrections preserve image attachments, workflow, attribution, count metadata and history',async()=>{
  const {normalizeReport}=await import('../src/jacketWorkflow.js');
  const {saveJacketNoteEdit,saveJacketCorrection}=await import('../src/recordEdits.js');
  const notes=[{type:'workflow',state:'paused',reason:'Customer unavailable'},{type:'affected_jackets',value:2},{text:'before',photos:[{url:'https://example.com/photo.jpg',caption:'before'}],by:'Original author',at:'2026-01-01'}];
  const initial={id:1,status:1,updated_at:'2026-10-30T12:00:00Z',notes:JSON.stringify(notes),status_history:'[{"status":1}]'};
  const client=versionedDb(initial),snapshot=normalizeReport(client.row);
  const saved=await saveJacketNoteEdit(client,snapshot,2,'Corrected text','Admin','2026-10-30T12:01:00Z');
  assert.deepEqual(saved.notes[0],notes[0]);assert.deepEqual(saved.notes[1],notes[1]);
  assert.deepEqual(saved.notes[2].photos,notes[2].photos);assert.equal(saved.notes[2].by,'Original author');
  assert.equal(saved.notes[2].text,'Corrected text');assert.equal(saved.statusHistory[1].before.text,'before');
  await assert.rejects(saveJacketCorrection(client,snapshot,{affected_jackets:1},5,'Admin'));
  assert.equal(JSON.parse(client.row.notes)[2].text,'Corrected text');
});

test('large image notes use only a bounded content token, never image data in query filters',async()=>{
  const {normalizeReport}=await import('../src/jacketWorkflow.js');
  const original={id:2,updated_at:'2026-10-30',notes:JSON.stringify([{text:'Image',photos:[{url:'data:image/jpeg;base64,'+'A'.repeat(700000)}]}]),status_history:'[]',content_fingerprint:'a'.repeat(32)};
  const filters=[];
  const client={from(){return {update(){const chain={eq(k,v){filters.push([k,v]);return chain;},select(){return {single:async()=>({data:original})};}};return chain;}};}};
  await persistReport(client,normalizeReport(original),{updated_at:'2026-10-31'});
  assert(filters.every(([,value])=>String(value).length<100));
  assert(filters.some(([key])=>key==='content_fingerprint'));
  assert(!filters.some(([key])=>key==='notes'||key==='status_history'));
});

test('dismissed reports stay out of the workflow after reload; later reports remain visible',()=>{
  const order={id:'A',status:10,errorSubStatus:0,error_dismissed_at:'2026-10-30T12:00:00Z'};
  const reports=[{id:1,order_id:'A',created_at:'2026-10-29'}, {id:2,order_id:'A',created_at:'2026-10-31'}];
  assert.deepEqual(reportRows([order],reports).map(r=>r.id),[2]);
  assert.equal(reportRows([order],[reports[0]]).length,0);
});

test('legacy follow-up persists cancellation without inserting a report or losing notes',async()=>{
  const {persistLegacyFollowUp}=await import('../src/jacketWorkflow.js');
  const original=[{text:'keep',photos:[{url:'https://example.com/a.jpg'}]}];
  const order={id:'A',status:13,error_notes:original,errorNotes:original};
  const entry={type:'workflow',state:'cancelled',stage:'sent',reason:'duplicate',at:'2026-10-31'};
  const filters=[];
  const client={from(table){assert.equal(table,'orders');return {update(patch){
    const chain={eq(k,v){filters.push([k,v]);return chain;},select(){return {single:async()=>({data:{error_notes:patch.error_notes}})};}};
    return chain;
  }};}};
  const saved=await persistLegacyFollowUp(client,order,entry);
  assert.deepEqual(saved.errorNotes[0],original[0]);
  assert(filters.some(([key,value])=>key==='error_notes'&&value===JSON.stringify(original)));
  const rows=reportRows([saved],[]);
  assert.equal(rows.length,1);assert.equal(rows[0].synthetic,true);
  assert.equal(rows[0].wf.state,'cancelled');assert.equal(rows[0].created_at,null);
  const failed={from(){return {update(){const chain={eq(){return chain;},select(){return {single:async()=>({data:null,error:{code:'PGRST116'}})};}};return chain;}};}};
  await assert.rejects(persistLegacyFollowUp(failed,order,entry));
  assert.deepEqual(order.error_notes,original);
});

test('location filter works independently of report state and combines with it', () => {
  const rows = [
    { id: 1, order: {}, wf: { state: 'paused', stage: 'warehouse' } },
    { id: 2, order: {}, wf: { state: 'active', stage: 'courier' } },
    { id: 3, order: {}, wf: { state: 'active', stage: 'warehouse' } }
  ];
  assert.deepEqual(filterRows(rows, { tab: 'all', stage: 'warehouse' }).map(r => r.id), [1, 3]);
  assert.deepEqual(filterRows(rows, { tab: 'active', stage: 'warehouse' }).map(r => r.id), [3]);
  assert.deepEqual(filterRows(rows, { tab: 'all', stage: 'factory' }), []);
});
