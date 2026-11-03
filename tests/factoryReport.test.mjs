import test from 'node:test';
import assert from 'node:assert/strict';
import { factoryReport, factoryPrintDocument } from '../src/factoryReport.js';
const photo = { url: 'data:image/jpeg;base64,AAAA' };
const issue = { received: photo, expected: photo, extra: photo, problem: '<wrong sleeve>', correction: 'Replace sleeve' };
const row = { order_id: 'ORD-44', order: { customer: 'SECRET CUSTOMER', phone: 'SECRET PHONE', jackets: 8, errorNotes: [] }, jacket_owner: 'SECRET OWNER', notes: [] };
test('factory print whitelists order metadata and escapes explanations', () => {
  const html = factoryPrintDocument(row, { jacketType: 'Varsity', issues: [issue] });
  for (const value of ['ORD-44', 'Jackets: 8', 'Varsity', 'As received / Error', 'Expected result', '&lt;wrong sleeve&gt;']) assert.ok(html.includes(value), value);
  for (const value of ['SECRET CUSTOMER', 'SECRET PHONE', 'SECRET OWNER', '<wrong sleeve>']) assert.ok(!html.includes(value), value);
  assert.equal((html.match(/<figure>/g) || []).length, 3);
});
test('groups three issues per page and only includes an attached form', () => {
  const report = { issues: Array(4).fill(issue) };
  assert.equal((factoryPrintDocument(row, report).match(/<article>/g) || []).length, 2);
  assert.equal((factoryPrintDocument(row, { ...report, formPhoto: photo }).match(/<article>/g) || []).length, 3);
  assert.ok(!factoryPrintDocument(row, report).includes('Form reference'));
});
test('unsafe image sources are excluded and latest saved report wins', () => {
  const saved = { type: 'factory_report', issues: [issue] };
  assert.equal(factoryReport({ order: { errorNotes: [saved] }, notes: [{ ...saved, jacketType: 'Latest' }] }).jacketType, 'Latest');
  const html = factoryPrintDocument(row, { issues: [{ ...issue, received: { url: 'javascript:alert(1)' } }] });
  assert.ok(!html.includes('javascript:'));
});
