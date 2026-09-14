import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverySummary, expectedNetProfit} from '../src/deliveryAccounting.js';

test('200 prepaid orders: 150 shipped or delivered, 50 remaining; customer-paid deliveries excluded',()=>{
  const orders=Array.from({length:200},(_,i)=>({deliveryPaid:true,status:i<75?11:i<150?12:1}));
  orders.push(...Array.from({length:40},()=>({deliveryPaid:false,status:11})));
  assert.deepEqual(deliverySummary(orders),{count:200,paidCount:150,remainingCount:50,total:400,paid:300,remaining:100});
});

test('shipping moves cost to paid without changing total or profit; delivered is not charged again',()=>{
  const order={deliveryPaid:true,status:10};
  assert.equal(deliverySummary([order]).remaining,2);
  const before=deliverySummary([order]).total;
  order.status=11;
  assert.equal(deliverySummary([order]).remaining,0);
  assert.equal(deliverySummary([order]).paid,2);
  order.status=12;
  assert.equal(deliverySummary([order]).total,before);
  assert.equal(deliverySummary([order]).paid,2);
  assert.equal(expectedNetProfit({sales:22,supplierCost:10,expenses:1,refunds:0,deliveryCost:before}),9);
});

test('excluded orders, issue status, rate precision and zero rate',()=>{
  assert.equal(deliverySummary([{deliveryPaid:false,status:1}]).total,0);
  assert.equal(deliverySummary([{deliveryPaid:true,status:13}]).paid,0);
  assert.equal(deliverySummary([{status:1},{status:12},{status:11}],0.333).total,0.999);
  assert.equal(deliverySummary([{status:1}],0).total,0);
  assert.equal(deliverySummary([]).remaining,0);
  for(const rate of [-1,NaN,Infinity])assert.throws(()=>deliverySummary([],rate));
});
