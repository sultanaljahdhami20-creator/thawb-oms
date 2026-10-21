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

import {supplierOrderCost} from '../src/supplierAccounting.js';
test('supplier rates add each recorded extra once and preserve general rates by default',()=>{
 const order={jackets:10,extras:3,orderType:'A'};
 const rates={A:20,_default:15};
 assert.equal(supplierOrderCost(order,{unitPrice:8},rates).total,200);
 const supplier={unitPrice:8,accountingSettings:{useSupplierRate:true,chargeExtras:true,extraLogoRate:2.5}};
 assert.deepEqual(supplierOrderCost(order,supplier,rates),{unitRate:8,extraRate:2.5,baseCost:80,extrasCost:7.5,total:87.5});
 assert.equal(supplierOrderCost(order,{...supplier,accountingSettings:{...supplier.accountingSettings,chargeExtras:false}},rates).total,80);
 assert.equal(supplierOrderCost({...order,extras:0},supplier,rates).total,80);
 assert.equal(supplierOrderCost({...order,orderType:''},undefined,rates).total,150);
 assert.equal(supplierOrderCost(order,{unitPrice:0,accountingSettings:{useSupplierRate:true}},rates).total,0);
 assert.equal(supplierOrderCost(order,JSON.parse(JSON.stringify(supplier)),rates).total,87.5);
});
