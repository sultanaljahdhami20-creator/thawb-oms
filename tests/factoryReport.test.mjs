import test from 'node:test';
import assert from 'node:assert/strict';
import { factoryReport, factoryPrintDocument, factoryIssueHasContent, cropRectangle, photoScale } from '../src/factoryReport.js';
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

test('reports allow text-only, image-only and partial issues without mandatory photos', () => {
  for (const issue of [{ problem: 'Wrong color' }, { correction: 'Use navy' }, { extra: photo }, { received: photo }, { expected: photo }]) assert.ok(factoryIssueHasContent(issue));
  assert.equal(factoryIssueHasContent({ problem: ' ', correction: '' }), false);
  const html = factoryPrintDocument(row, { issues: [{ problem: 'Wrong color' }] });
  assert.ok(html.includes('Wrong color'));
  assert.ok(!html.includes('<figure>'));
  assert.ok(!html.includes('<div class="photos">'));
  assert.ok(!html.includes('<b>Required correction:</b>'));
});
test('crop coordinates remain within the original image and preserve aspect dimensions', () => {
  assert.deepEqual(cropRectangle(1000, 500, { x: 10, y: 20, width: 60, height: 50 }), { x: 100, y: 100, width: 600, height: 250 });
  assert.deepEqual(cropRectangle(1000, 500, { x: 95, y: 95, width: 100, height: 100 }), { x: 950, y: 475, width: 50, height: 25 });
});
test('printed image sizes use saved scale and reject unsafe values', () => {
  assert.equal(photoScale({ printScale: '50' }), 50);
  for (const value of [undefined, -1, 200, 'bad', '50; color:red']) assert.equal(photoScale({ printScale: value }), 100);
  const html = factoryPrintDocument(row, { issues: [{ received: { ...photo, printScale: 50 } }] });
  assert.ok(html.includes('style="width:50%;height:20mm"'));
});
