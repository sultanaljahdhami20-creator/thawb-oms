import test from 'node:test';
import assert from 'node:assert/strict';
import {filterOrders, resultPage, loadQuery} from '../src/orderFilters.js';

const orders = [
  {id:'A',status:1,customer:null,phone:null,total:20,paid:0,date:'2026-11-01',supplier:'One'},
  {id:'B',status:'12',customer:'Customer',phone:123,total:30,paid:30,date:'2026-11-02',supplier:'Two'},
  {id:'C',status:13,customer:'Other',total:40,paid:10,date:'2026-11-03',supplier:'One',isUrgent:true},
];
test('every status matches numeric and imported string IDs',()=>{
  for(let status=1;status<=13;status++) {
    const fixtures=[{id:'n',status},{id:'s',status:String(status)},{id:'x',status:status+1}];
    assert.deepEqual(filterOrders(fixtures,{statuses:[status]}).map(o=>o.id),['n','s']);
  }
});
test('combined filters, clearing and delivered-only preserve the right orders',()=>{
  assert.deepEqual(filterOrders(orders,{statuses:[1,13],suppliers:['One'],urgentOnly:true,from:'2026-11-02',type:'outstanding'}).map(o=>o.id),['C']);
  assert.deepEqual(filterOrders(orders,{type:'delivered'}).map(o=>o.id),['B']);
  assert.equal(filterOrders(orders).length,3);
  assert.deepEqual(filterOrders(orders,{search:'123'}).map(o=>o.id),['B']);
  assert.equal(filterOrders(orders,{search:'missing'}).length,0);
});
test('large result sets render at most 50 rows while retaining all export results',()=>{
  const matches=filterOrders(Array.from({length:1200},(_,i)=>({id:String(i),status:7})),{statuses:[7]});
  assert.equal(matches.length,1200);
  assert.equal(resultPage(matches,1).rows.length,50);
  assert.equal(resultPage(matches,24).rows.at(-1).id,'1199');
  assert.deepEqual(resultPage([],24),{page:1,pages:1,rows:[]});
  assert.equal(resultPage(matches.slice(0,2),24).page,1);
});
test('hung requests time out and abort; retries and failures settle normally',async()=>{
  let signal;
  const hung={abortSignal(value){signal=value;return new Promise(()=>{});}};
  const result=await loadQuery(hung,10);
  assert.match(result.error.message,/timed out/);
  assert.equal(signal.aborted,true);
  assert.deepEqual(await loadQuery({abortSignal(){return Promise.resolve({data:orders,error:null});}},100),{data:orders,error:null});
  assert.match((await loadQuery({abortSignal(){throw new Error('offline');}},100)).error.message,/offline/);
});
