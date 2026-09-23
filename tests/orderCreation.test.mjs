import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrderWithPayment} from '../src/orderCreation.js';

function database({orderError = null, paymentError = null} = {}) {
  const rows = {orders: [], payments: []};
  return {rows, from(table) {
    return {insert(payload) {
      if (table === 'orders') {
        if (!orderError) rows.orders.push({...payload});
        return Promise.resolve({error: orderError});
      }
      return {select() {return {async single() {
        if (paymentError) return {data: null, error: paymentError};
        const data = {...payload, id: 'saved-payment-id'};
        rows.payments.push(data);
        rows.orders.find(o => o.id === payload.order_id).paid += payload.amount;
        return {data, error: null};
      }}}};
    }};
  }};
}
const order = {id: 'test-order', date: '2026-09-22', total: 100, paid: 15};

test('deposit is counted once and has a saved ID immediately and after reload', async () => {
  const db = database();
  const result = await createOrderWithPayment(db, order, 'Admin');
  assert.equal(result.order.paid, 15);
  assert.equal(db.rows.orders[0].paid, 15);
  const payment = result.order.payments[0];
  assert.equal(payment.id, db.rows.payments[0].id);
  // The existing edit flow can target the deposit immediately by ID.
  const persisted = db.rows.payments.find(p => p.id === payment.id);
  db.rows.orders[0].paid += 10 - persisted.amount;
  persisted.amount = 10;
  assert.equal(JSON.parse(JSON.stringify(db.rows)).orders[0].paid, 10);
});

test('zero deposit creates no payment', async () => {
  const db = database();
  const result = await createOrderWithPayment(db, {...order, paid: 0}, 'Admin');
  assert.equal(result.order.paid, 0);
  assert.deepEqual(result.order.payments, []);
  assert.equal(db.rows.payments.length, 0);
});

test('payment failure is reported without inventing a payment or losing the saved order', async () => {
  const error = new Error('Payment rejected');
  const db = database({paymentError: error});
  const result = await createOrderWithPayment(db, order, 'Admin');
  assert.equal(result.paymentError, error);
  assert.equal(result.order.id, order.id);
  assert.equal(result.order.paid, 0);
  assert.deepEqual(result.order.payments, []);
  assert.equal(db.rows.orders.length, 1);
});

test('order failure never attempts a payment', async () => {
  const db = database({orderError: new Error('Order rejected')});
  await assert.rejects(createOrderWithPayment(db, order, 'Admin'), /Order rejected/);
  assert.deepEqual(db.rows.payments, []);
});

test('invalid amounts never create an order', async () => {
  for (const paid of [-1, NaN, Infinity, 'invalid']) {
    const db = database();
    await assert.rejects(createOrderWithPayment(db, {...order, paid}, 'Admin'), /Invalid paid amount/);
    assert.deepEqual(db.rows.orders, []);
  }
});
