import test from 'node:test';
import assert from 'node:assert/strict';
import {supplierAccountTotals,isSupplierDebt} from '../src/supplierAccounting.js';
const entries=[{supplier:'A',method:'Opening Debt',amount:500},{supplier:'A',method:'Cash',amount:200},{supplier:'B',method:'Opening Credit',amount:300},{supplier:'B',method:'Supplier Refund',amount:100}];
test('opening debt increases payable and settlement reduces it without counting debt as cash',()=>{
 const {debt,paid}=supplierAccountTotals(entries,'A');
 assert.equal(debt,500);assert.equal(paid,200);assert.equal(1000+debt-paid,1300);
});
test('receivable and money returned by supplier reduce the amount owed to us',()=>{
 const {debt,paid}=supplierAccountTotals(entries,'B');
 assert.equal(debt-paid,-200);
 assert.deepEqual(supplierAccountTotals(entries),{debt:200,paid:100});
});
test('legacy payments, reload, edits and deletion retain correct totals',()=>{
 const restored=JSON.parse(JSON.stringify(entries));
 restored[0].amount=600;
 assert.deepEqual(supplierAccountTotals(restored.filter(p=>p.method!=='Cash'),'A'),{debt:600,paid:0});
 assert.deepEqual(supplierAccountTotals([{amount:'25',supplier:'A'}]),{debt:0,paid:25});
 assert.equal(isSupplierDebt({method:'Bank Transfer'}),false);
});
