import test from 'node:test';
import assert from 'node:assert/strict';
import {newDocument,totalsFor,validateDocument,saveDocument,listDocuments} from '../src/businessDocuments.js';
const doc=()=>({...newDocument('invoice'),items:[{id:'item',description:'JACKETS',quantity:'3',unitPrice:'1.005'}],vatRate:'5'});
function storage(){const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('OMR preserves baisa and VAT rounds at currency precision',()=>{
  const d=doc();assert.equal(validateDocument(d),'');assert.deepEqual(totalsFor(d),{lines:[3.015],subtotal:3.015,vat:.151,total:3.166});
});
test('AED totals use fils; changing currency does not silently round entered prices',()=>{
  const d={...doc(),currency:'AED'};assert.match(validateDocument(d),/2 decimal places/);
  d.items[0].unitPrice='12.25';assert.equal(validateDocument(d),'');assert.deepEqual(totalsFor(d),{lines:[36.75],subtotal:36.75,vat:1.84,total:38.59});
});
test('empty, negative, fractional and nonfinite inputs cannot be saved or exported',()=>{
  for(const quantity of ['',0,-1,'1.5',Infinity,1000001]){const d=doc();d.items[0].quantity=quantity;assert.ok(validateDocument(d));}
  for(const unitPrice of ['',-1,NaN,Infinity,'1.0001']){const d=doc();d.items[0].unitPrice=unitPrice;assert.ok(validateDocument(d));}
  for(const vatRate of ['',-1,101,NaN])assert.ok(validateDocument({...doc(),vatRate}));
  assert.ok(validateDocument({...doc(),date:'2026-02-30'}));assert.ok(validateDocument({...doc(),items:[]}));
});
test('saved documents survive reload and updates retain identity and provenance',()=>{
  const s=storage(),d=doc();const saved=saveDocument(s,d,null,'Owner');
  assert.deepEqual(listDocuments(s),[saved]);
  d.items[0].quantity='10';const updated=saveDocument(s,d,1,'Employee');
  assert.equal(updated.version,2);assert.equal(updated.created_by,'Owner');assert.equal(listDocuments(s).length,1);assert.equal(listDocuments(s)[0].document.items[0].quantity,'10');
  assert.throws(()=>saveDocument(s,d,1,'Employee'),/changed in another tab/);
});
test('duplicate numbers are rejected per document type; failed writes report failure',()=>{
  const s=storage(),d=doc();saveDocument(s,d,null,'Owner');
  assert.throws(()=>saveDocument(s,{...d,id:crypto.randomUUID()},null,'Owner'),/already exists/);
  saveDocument(s,{...d,id:crypto.randomUUID(),type:'quotation'},null,'Owner');assert.equal(listDocuments(s).length,2);
  const broken={...storage(),setItem(){throw new Error('storage full');}};
  assert.throws(()=>saveDocument(broken,d,null,'Owner'),/storage full/);
});
