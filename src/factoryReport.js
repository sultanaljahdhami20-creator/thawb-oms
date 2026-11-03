import { array } from './jacketWorkflow.js';

export const newFactoryIssue = () => ({ id: crypto.randomUUID(), received: null, expected: null, extra: null, problem: '', correction: '' });
export function factoryReport(row) {
  return [...array(row.order?.errorNotes), ...array(row.notes)].filter(n => n.type === 'factory_report').at(-1) || null;
}
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeImage = p => /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(p?.url || '') ? p.url : '';
export function factoryPrintDocument(row, report) {
  const image = (p, caption) => safeImage(p) ? `<figure><img src="${safeImage(p)}" alt="${caption}"><figcaption>${caption}</figcaption></figure>` : '';
  const issues = report.issues.map((issue, i) => `<section class="issue"><h2>Issue ${i + 1}</h2><div class="photos">${image(issue.received, 'As received / Error')}${image(issue.expected, 'Expected result')}${image(issue.extra, 'Additional reference')}</div><p><b>What went wrong:</b> ${esc(issue.problem)}</p><p><b>Required correction:</b> ${esc(issue.correction)}</p></section>`);
  const pages = [];
  for (let i = 0; i < issues.length; i += 3) pages.push(`<article><header><strong>THAWB · Factory correction report</strong><div>Order: ${esc(row.order_id)} · Jackets: ${esc(row.order?.jackets ?? '—')} · Affected: ${esc(row.affectedJackets ?? row.affected_jackets ?? '—')} · Type: ${esc(report.jacketType || row.jacket_type || '—')}</div></header>${issues.slice(i, i + 3).join('')}<footer>Order ${esc(row.order_id)} · ${pages.length + 1} / ${Math.ceil(issues.length / 3)}</footer></article>`);
  if (safeImage(report.formPhoto)) pages.push(`<article><header>Order ${esc(row.order_id)} · Form reference</header>${image(report.formPhoto, 'Order form reference')}</article>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Factory report ${esc(row.order_id)}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#202f4d;margin:0;background:#e9edf2}.toolbar{text-align:center;padding:15px}button{padding:10px 20px;cursor:pointer}article{background:white;max-width:186mm;margin:16px auto;padding:8mm}header{border-bottom:2px solid #202f4d;padding-bottom:3mm;line-height:1.8}header strong{font-size:17px}.issue{break-inside:avoid;border-bottom:1px solid #ccd4df;padding:3mm 0}h2{font-size:13px;margin:0 0 2mm}.photos{display:flex;gap:3mm}figure{flex:1;min-width:0;margin:0;text-align:center}img{width:100%;height:40mm;object-fit:contain}figcaption{font-size:10px;padding:1mm}p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.35;margin:2mm 0}footer{font-size:10px;text-align:right;margin-top:3mm}article>figure img{height:220mm}@media print{body{background:white}.toolbar{display:none}article{margin:0;padding:0;max-width:none;break-after:page}article:last-child{break-after:auto}}</style></head><body><div class="toolbar"><button id="print" disabled>Preparing images…</button><p id="warning" hidden>Some images could not be loaded. Reopen the report before printing.</p></div>${pages.join('')}<script>Promise.all(Array.from(document.images,img=>new Promise(resolve=>{const done=()=>{if(!img.naturalWidth)document.getElementById('warning').hidden=false;resolve();};if(img.complete)done();else{img.onload=done;img.onerror=done;}}))).then(()=>{const b=document.getElementById('print');b.disabled=false;b.textContent='Print / Save as PDF';b.onclick=()=>window.print();});</script></body></html>`;
}
export function openFactoryPrint(row, report) {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.opener = null;
  win.document.write(factoryPrintDocument(row, report));
  win.document.close();
  return true;
}
