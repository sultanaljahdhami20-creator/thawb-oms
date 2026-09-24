import test from 'node:test';
import assert from 'node:assert/strict';
import {jacketErrorPatch,saveJacketCorrection,updateRecord} from '../src/recordEdits.js';
const record={id:7,jacket_owner:'Owner',affectedJackets:4,status:1,notes:[{type:'affected_jackets',value:4},{text:'Keep this',by:'Staff'}],statusHistory:[{status:1}]};
const form={jacket_owner:'Corrected',jacket_type:'Leather',jacket_size:'L',affected_jackets:2,error_description:'Corrected issue',error_image_url:'',status:'2'};
function client(results=[]) {
  const writes=[];
  return {writes,from(table){return {update(payload){return {eq(key,id){writes.push({table,payload,key,id});return {select(){return {async single(){return results.length?results.shift():{data:{id,...payload},error:null};}};}};}};}};}};
}
test('count correction survives legacy note precedence and preserves ordinary notes and history',async()=>{
  const db=client();
  const saved=await saveJacketCorrection(db,record,form,5,'Admin');
  assert.equal(saved.affectedJackets,2);
  assert.equal(saved.notes.find(n=>n.type==='affected_jackets').value,2);
  assert.deepEqual(saved.notes[1],record.notes[1]);
  assert.equal(saved.statusHistory.length,2);
  assert.equal(saved.statusHistory[1].before.affected_jackets,4);
  assert.equal(record.notes[0].value,4);
});
test('rejects fractions, out of range, nonfinite, blank and negative affected counts before writing',async()=>{
  for(const count of [0,-1,1.5,6,NaN,Infinity,'']) {
    const db=client();
    await assert.rejects(saveJacketCorrection(db,record,{...form,affected_jackets:count},5,'Admin'));
    assert.equal(db.writes.length,0);
  }
  assert.throws(()=>jacketErrorPatch(record,{...form,error_description:'  '},5,'Admin'));
});
test('missing count column falls back only for schema errors and keeps new count on reload',async()=>{
  const db=client([{error:{code:'PGRST204',message:'affected_jackets column not found'}}]);
  const saved=await saveJacketCorrection(db,record,form,5,'Admin');
  assert.equal(db.writes.length,2);
  assert.equal('affected_jackets' in db.writes[1].payload,false);
  assert.equal(saved.notes.find(n=>n.type==='affected_jackets').value,2);
  assert.equal(saved.notes.filter(n=>n.type==='affected_jackets').length,1);
});
test('write failures and zero-row updates remain failures, never fake success',async()=>{
  for(const result of [{error:{code:'42501',message:'Permission denied: affected_jackets'}},{data:null,error:null}]) {
    const db=client([result]);
    await assert.rejects(saveJacketCorrection(db,record,form,5,'Admin'));
    assert.equal(db.writes.length,1);
  }
  await assert.rejects(updateRecord(client(),'expenses',undefined,{}));
});
