import { openPhotoPrint } from './photoStorage.js';
import { array } from './jacketWorkflow.js';

export const newFactoryIssue = (jacketNumber = 1) => ({ jacketNumber, id: crypto.randomUUID(), received: null, expected: null, extra: null, problem: '', correction: '' });
export function factoryReport(row) {
  return [...array(row.order?.errorNotes), ...array(row.notes)].filter(n => n.type === 'factory_report').at(-1) || null;
}
export function factoryJacketCount(row) {
  const count = Number(row.affectedJackets ?? row.affected_jackets ?? array(row.notes).find(n => n.type === 'affected_jackets')?.value ?? 1);
  return Number.isInteger(count) && count > 0 ? count : 1;
}
export function factoryJacketNumbers(row, report) {
  return Array.from({ length: Math.max(factoryJacketCount(row), ...array(report.issues).map(i => Number(i.jacketNumber) || 1)) }, (_, i) => i + 1);
}
export function factoryDraft(row) {
  const saved = factoryReport(row);
  return { ...saved, jacketType: saved?.jacketType ?? row.jacket_type ?? '', formPhoto: saved?.formPhoto ?? null,
    jacketLabels: saved?.jacketLabels || {},
    issues: saved ? array(saved.issues).map(i => ({ ...i, jacketNumber: i.jacketNumber || 1 })) : Array.from({ length: factoryJacketCount(row) }, (_, i) => newFactoryIssue(i + 1)) };
}
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeImage = p => /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(p?.url || '') || /^https:\/\//i.test(p?.url || '') ? esc(p.url) : '';
export function factoryIssueHasContent(issue) {
  return !!(issue.problem?.trim() || issue.correction?.trim() || issue.received || issue.expected || issue.extra);
}
export function photoScale(photo) {
  const value = Number(photo?.printScale);
  return Number.isFinite(value) && value >= 30 && value <= 100 ? value : 100;
}
export function cropRectangle(width, height, crop) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const x = clamp(crop.x, 0, 95), y = clamp(crop.y, 0, 95);
  return { x: width * x / 100, y: height * y / 100, width: width * clamp(crop.width, 5, 100 - x) / 100, height: height * clamp(crop.height, 5, 100 - y) / 100 };
}
export function factoryPrintDocument(row, report, { autoPrint = false } = {}) {
  const image = (p, caption, form = false) => safeImage(p) ? `<figure><img src="${safeImage(p)}" alt="${caption}" style="width:${photoScale(p)}%;height:${(form ? 220 : 80) * photoScale(p) / 100}mm"><figcaption>${caption}</figcaption></figure>` : '';
  const renderIssue = (issue, i) => `<section class="issue"><h2>Issue ${i + 1}</h2>${issue.received || issue.expected || issue.extra ? '<div class="photos">' : ''}${image(issue.received, 'As received / Error')}${image(issue.expected, 'Expected result')}${image(issue.extra, 'Additional reference')}${issue.received || issue.expected || issue.extra ? '</div>' : ''}${issue.problem?.trim() ? `<p><b>What went wrong:</b> ${esc(issue.problem)}</p>` : ''}${issue.correction?.trim() ? `<p><b>Required correction:</b> ${esc(issue.correction)}</p>` : ''}</section>`;
  const pages = [];
  for (const number of factoryJacketNumbers(row, report)) {
    const issues = report.issues.filter(issue => Number(issue.jacketNumber || 1) === number).map(renderIssue);
    const label = report.jacketLabels?.[number];
    for (let i = 0; i < Math.max(issues.length, 1); i += 1) pages.push(`<article><header><strong>THAWB · Factory correction report</strong><div>Order: ${esc(row.order_id)} · Jackets: ${esc(row.order?.jackets ?? '—')} · Affected: ${factoryJacketCount(row)} · Type: ${esc(report.jacketType || row.jacket_type || '—')}</div><h2>Jacket ${number}${label ? ` · ${esc(label)}` : ''}</h2></header>${issues.slice(i, i + 1).join('') || '<p>No issues recorded for this jacket.</p>'}<footer>Order ${esc(row.order_id)} · Jacket ${number} · ${i + 1} / ${Math.max(1, issues.length)}</footer></article>`);
  }
  if (safeImage(report.formPhoto)) pages.push(`<article><header>Order ${esc(row.order_id)} · Form reference</header>${image(report.formPhoto, 'Order form reference', true)}</article>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Factory report ${esc(row.order_id)}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#202f4d;margin:0;background:#e9edf2}.toolbar{text-align:center;padding:15px}button{padding:10px 20px;cursor:pointer}article{background:white;max-width:186mm;margin:16px auto;padding:8mm}header{border-bottom:2px solid #202f4d;padding-bottom:3mm;line-height:1.8}header strong{font-size:17px}.issue{break-inside:avoid;border-bottom:1px solid #ccd4df;padding:3mm 0}h2{font-size:13px;margin:0 0 2mm}.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3mm}figure{flex:1;min-width:0;margin:0;text-align:center}img{width:100%;height:80mm;object-fit:contain}figcaption{font-size:10px;padding:1mm}p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.35;margin:2mm 0}footer{font-size:10px;text-align:right;margin-top:3mm}article>figure img{height:220mm}@media print{body{background:white}.toolbar{display:none}article{margin:0;padding:0;max-width:none;break-after:page}article:last-child{break-after:auto}}</style></head><body><div class="toolbar"><button id="print" disabled>Preparing images…</button><p id="warning" hidden>Some images could not be loaded. Reopen the report before printing.</p></div>${pages.join('')}<script>Promise.all(Array.from(document.images,img=>new Promise(resolve=>{const done=()=>{if(!img.naturalWidth)document.getElementById('warning').hidden=false;resolve();};if(img.complete)done();else{img.onload=done;img.onerror=done;}}))).then(()=>{const b=document.getElementById('print');b.disabled=false;b.textContent='Print / Save as PDF';b.onclick=()=>window.print();${autoPrint ? "if(document.getElementById('warning').hidden)window.print();" : ''}});</script></body></html>`;
}
export function openFactoryPrint(row, report, client, options) {
  return openPhotoPrint(client, report, resolved => factoryPrintDocument(row, resolved, options));
}
