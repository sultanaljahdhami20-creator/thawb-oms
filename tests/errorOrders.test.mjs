import test from 'node:test';
import assert from 'node:assert/strict';
import {isErrorOrder, dismissOrderError} from '../src/errorOrders.js';

const order={id:'test-order',status:10,errorSubStatus:0};
const oldReport={order_id:order.id,created_at:'2026-09-18T00:00:00Z'};
const dismissed={...order,error_dismissed_at:'2026-09-19T00:00:00Z'};

test('legacy cases remain visible, including resolved orders with a report',()=>{
  assert.equal(isErrorOrder(order,[oldReport]),true);
  assert.equal(isErrorOrder({...order,status:13},[]),true);
  assert.equal(isErrorOrder({...order,errorSubStatus:2},[]),true);
  assert.equal(isErrorOrder(order,[]),false);
});

test('dismissal persists after reload and retains historical reports',()=>{
  assert.equal(isErrorOrder(JSON.parse(JSON.stringify(dismissed)),[oldReport]),false);
  assert.equal(isErrorOrder(dismissed,[{...oldReport,created_at:dismissed.error_dismissed_at}]),false);
  assert.equal(oldReport.order_id,order.id);
});

test('new reports and explicitly reopened cases reappear',()=>{
  assert.equal(isErrorOrder(dismissed,[oldReport,{...oldReport,created_at:'2026-09-20T00:00:00Z'}]),true);
  assert.equal(isErrorOrder({...dismissed,status:13},[oldReport]),true);
  assert.equal(isErrorOrder({...dismissed,errorSubStatus:1},[oldReport]),true);
  assert.equal(isErrorOrder(dismissed,[{order_id:'other',created_at:'2026-09-20T00:00:00Z'}]),false);
});

function fakeClient(result){
  const writes=[];
  return {writes,from(table){
    assert.equal(table,'orders');
    return {update(payload){
      writes.push(payload);
      return {eq(column,id){
        assert.equal(column,'id');assert.equal(id,order.id);
        return {select(){return {async single(){return result ?? {data:{id,...payload},error:null};}};}};
      }};
    }};
  }};
}

test('dismissal is one confirmed write and preserves the selected production status',async()=>{
  const client=fakeClient();
  const saved=await dismissOrderError(client,order,10);
  assert.equal(client.writes.length,1);
  assert.equal(saved.status,10);
  assert.equal(saved.errorSubStatus,0);
  assert.ok(saved.error_dismissed_at);
  assert.equal(isErrorOrder(saved,[oldReport]),false);
  assert.deepEqual(Object.keys(client.writes[0]).sort(),['error_dismissed_at','error_sub_status','status','updated']);
});

test('invalid choices and database failures cannot appear successful',async()=>{
  const client=fakeClient();
  for(const status of [0,13,NaN,1.5])await assert.rejects(dismissOrderError(client,order,status));
  assert.equal(client.writes.length,0);
  const failure=new Error('Permission denied');
  await assert.rejects(dismissOrderError(fakeClient({data:null,error:failure}),order,10),failure);
  await assert.rejects(dismissOrderError(fakeClient({data:null,error:null}),order,10),/not updated/);
});
