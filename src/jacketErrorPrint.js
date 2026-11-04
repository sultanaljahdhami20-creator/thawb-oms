import { openPhotoPrint } from './photoStorage.js';
import { TABS, TYPES, photos } from './jacketWorkflow.js';

const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function errorPrintDocument(rows, rtl = true) {
  const t = (ar, en) => rtl ? ar : en;
  const label = (list, key) => list.find(item => item[0] === key)?.[rtl ? 1 : 2] || key || t('غير محدد', 'Not set');
  const field = (name, value) => value !== undefined && value !== null && value !== '' ? `<div class="detail"><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>` : '';
  const body = rows.map(row => {
    const o = row.order || {}, wf = row.wf || {};
    const name = label(TYPES, wf.kind);
    const images = photos(row);
    // Only customer-facing fields belong here. Notes, staff names, workflow
    // reasons, contacts and merge metadata remain in the internal report UI.
    return `<article class="sheet"><header class="brand-header"><div class="brand">THAWB<span>ثوب</span></div><div class="document-label">${t('متابعة طلب', 'Order care')}<span>${t('نسخة العميل', 'Customer copy')}</span></div></header>
    <div class="title-row"><div><p class="eyebrow">${t('تفاصيل البلاغ', 'Issue summary')}</p><h1>${esc(name)}</h1></div><div class="order-ref"><span>${t('رقم الطلب', 'Order number')}</span><strong dir="ltr">${esc(row.order_id)}</strong></div></div>
    <dl class="details">${[
      [t('العميل','Customer'),o.customer || row.customer_name],
      [t('رقم الهاتف','Phone'),o.phone || row.customer_phone],
      [t('الجاكيتات المتأثرة','Affected jackets'),row.synthetic ? null : row.affectedJackets ?? row.affected_jackets ?? 1],
      [t('الحالة','Status'),label(TABS,wf.state)],
      [t('صاحب الجاكيت','Jacket owner'),row.jacket_owner],
      [t('المقاس','Size'),row.jacket_size],
      [t('نوع الجاكيت','Jacket type'),row.jacket_type]
    ].map(([k,v])=>field(k,v)).join('')}</dl>
    ${row.error_description ? `<section class="description"><h2>${t('وصف المشكلة','Issue description')}</h2><p>${esc(row.error_description)}</p></section>` : ''}
    ${images.length ? `<section class="attachments"><h2>${t('صور المشكلة','Issue photos')}<span>${images.length} ${t('صور','photos')}</span></h2><div class="photo-grid">${images.map(p=>`<figure><img src="${esc(p.url)}" alt="${t('صورة توضح المشكلة','Issue photo')}"><p class="image-error" hidden>${t('تعذر تحميل الصورة','Image unavailable')}</p></figure>`).join('')}</div></section>` : ''}
    <footer><span>THAWB <i>·</i> ${t('ثوب','Order care')}</span><span>${t('طلبك محل اهتمامنا','Your order matters to us')}</span></footer></article>`;
  }).join('');
  return `<!doctype html><html lang="${rtl?'ar':'en'}" dir="${rtl?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>THAWB · ${t('متابعة طلب','Order care')}</title><style>
  @page{size:A4;margin:14mm 16mm}
  :root{--ink:#202f4d;--muted:#687487;--line:#e2e6eb;--accent:#e05e5c;--wash:#f5f7fa}
  *{box-sizing:border-box}body{font:14px Tahoma,Arial,sans-serif;color:var(--ink);margin:0;line-height:1.7;background:#e9edf2}
  .sheet{max-width:178mm;margin:24px auto;background:white;padding:26px 30px;box-shadow:0 4px 24px #202f4d10}
  .brand-header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:16px}
  .brand{font:900 26px Arial,sans-serif;letter-spacing:3px;display:flex;gap:16px;align-items:center;direction:ltr}.brand span{font:700 20px Tahoma,sans-serif;letter-spacing:0;color:var(--accent)}
  .document-label{font-size:12px;font-weight:700;text-align:end}.document-label span{display:block;font-size:10px;font-weight:400;color:var(--muted)}
  .title-row{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:25px 0 22px}.eyebrow{color:var(--muted);font-size:11px;margin:0 0 4px}h1{font-size:25px;line-height:1.4;margin:0;font-weight:700}.order-ref{text-align:end;flex-shrink:0;border-inline-start:3px solid var(--accent);padding-inline-start:16px}.order-ref span{display:block;color:var(--muted);font-size:10px}.order-ref strong{display:block;font:700 17px Arial,sans-serif;margin-top:5px}
  .details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;column-gap:24px;background:var(--wash);padding:10px 16px;border-radius:8px}.detail{padding:9px 0;border-bottom:1px solid var(--line);break-inside:avoid}.detail:last-child,.detail:nth-last-child(2):nth-child(odd){border:0}dt{color:var(--muted);font-size:10px}dd{font-size:13px;font-weight:700;margin:3px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext}
  section{margin-top:22px}h2{font-size:13px;margin:0 0 10px;font-weight:700}h2 span{float:inline-end;color:var(--muted);font-size:10px;font-weight:400}.description p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.9}.photo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}figure{margin:0;border:1px solid var(--line);border-radius:7px;padding:5px;break-inside:avoid;background:white}img{display:block;width:100%;height:49mm;object-fit:contain}.image-error{font-size:10px;color:#b91c1c;text-align:center}
  footer{display:flex;justify-content:space-between;gap:15px;margin-top:24px;padding-top:10px;border-top:1px solid var(--line);color:var(--muted);font-size:10px}footer i{font-style:normal;color:var(--accent);padding:0 5px}
  .toolbar{padding:14px 20px;text-align:center;background:white;border-bottom:1px solid var(--line)}button{border:0;border-radius:6px;background:var(--ink);color:white;padding:10px 24px;font:700 13px Tahoma,Arial;cursor:pointer}button:disabled{opacity:.5;cursor:wait}#warning{color:#b91c1c;font-size:12px}
  @media screen and (max-width:600px){.sheet{margin:12px;padding:20px}.photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.brand{font-size:21px}.title-row{gap:12px}h1{font-size:21px}}
  @media print{body{background:white;print-color-adjust:exact;-webkit-print-color-adjust:exact}.toolbar{display:none}.sheet{margin:0;padding:0;max-width:none;box-shadow:none}.sheet+.sheet{break-before:page}.brand-header,.title-row,.details,footer{break-inside:avoid}h2{break-after:avoid}.photo-grid{display:block;font-size:0}figure{display:inline-block;vertical-align:top;width:calc((100% - 20px)/3);margin:0 0 10px;margin-inline-end:10px}figure:nth-child(3n){margin-inline-end:0}img{height:49mm}}
  </style></head><body><div class="toolbar"><button id="print" disabled>${t('جارٍ تجهيز الصور…','Preparing images…')}</button><p id="warning" hidden>${t('بعض الصور لم تُحمّل. أعد فتح التقرير للمحاولة، أو اطبع النسخة المتاحة.','Some images failed to load. Reopen to retry, or print the available copy.')}</p></div>${body}<script>
const button=document.getElementById('print');
Promise.all(Array.from(document.images,image=>new Promise(resolve=>{const done=()=>{if(!image.naturalWidth){image.nextElementSibling.hidden=false;document.getElementById('warning').hidden=false;}resolve();};if(image.complete)done();else{image.onload=done;image.onerror=done;}}))).then(()=>{button.disabled=false;button.textContent=${JSON.stringify(t('طباعة / حفظ PDF','Print / Save PDF'))};button.onclick=()=>window.print();});
</script></body></html>`;
}

export function openErrorPrint(rows, rtl, client) {
  if (!rows.length) return false;
  return openPhotoPrint(client, rows, resolved => errorPrintDocument(resolved, rtl));
}
