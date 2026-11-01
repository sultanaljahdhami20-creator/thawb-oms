import { TABS, TYPES, STAGES, array, photos } from './jacketWorkflow.js';

const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function errorPrintDocument(rows, rtl = true) {
  const t = (ar, en) => rtl ? ar : en;
  const label = (list, key) => list.find(item => item[0] === key)?.[rtl ? 1 : 2] || key || t('غير محدد', 'Not set');
  const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(rtl ? 'ar-OM' : 'en-GB') : t('غير مسجل', 'Not recorded');
  const field = (name, value) => `<div><b>${esc(name)}</b><span>${esc(value || '—')}</span></div>`;
  const eventText = event => event.type === 'workflow' ? [label(TABS, event.state), label(STAGES, event.stage), event.reason, event.next].filter(Boolean).join(' · ') : event.type === 'contact' ? `${t('رقم تواصل', 'Contact')}: ${event.phone || ''} ${event.label || ''}` : event.text || event.note;
  const body = rows.map(row => {
    const o = row.order || {}, wf = row.wf || {};
    const name = label(TYPES, wf.kind);
    const events = [
      ...array(o.errorNotes),
      ...array(row.notes),
      ...array(row.statusHistory ?? row.status_history).filter(e => !['note', 'state', 'contact'].includes(e.type)),
      ...array(row.relatedReports).flatMap(r => array(r.notes))
    ].filter(e => !['affected_jackets', 'original_date_unknown', 'duplicate_link', 'merge'].includes(e.type) && eventText(e)).sort((a,b) => (Date.parse(a.at)||0)-(Date.parse(b.at)||0));
    const images = photos(row);
    return `<article><h2>${esc(name)} · ${esc(row.order_id)}</h2><div class="grid">${[
      [t('رقم البلاغ','Report number'),row.id], [t('العميل','Customer'),o.customer || row.customer_name],
      [t('الهاتف','Phone'),o.phone || row.customer_phone], [t('تاريخ الطلب','Order date'),o.date],
      [t('عدد الجاكيتات المتضررة / الإجمالي','Affected / total jackets'),`${row.synthetic ? '—' : row.affectedJackets ?? row.affected_jackets ?? 1} / ${o.jackets ?? '—'}`],
      [t('الحالة الحالية','Current state'),label(TABS,wf.state)], [t('مرحلة المتابعة','Follow-up stage'),label(STAGES,wf.stage)],
      [t('تاريخ التسجيل','Registered'),date(row.created_at)], [t('آخر متابعة','Last follow-up'),date(row.lastFollowUp || row.updated_at)],
      [t('صاحب الجاكيت','Jacket owner'),row.jacket_owner], [t('المقاس','Size'),row.jacket_size], [t('نوع الجاكيت','Jacket type'),row.jacket_type]
    ].map(([k,v])=>field(k,v)).join('')}</div>${field(t('وصف الخطأ','Error description'),row.error_description)}${field(t('السبب','Reason'),wf.reason)}${field(t('الخطوة القادمة','Next step'),wf.next)}${wf.state==='refund'?field(t('استرجاع المبلغ','Refund'),wf.refundDone?t('مكتمل','Completed'):t('بانتظار الاسترجاع','Pending')):''}${wf.conflict?`<p>${esc(t('تحتاج تأكيد الحالة — بيانات الطلب والبلاغ متعارضة','Confirm state — order and report disagree'))}</p>`:''}${row.merged_into?field(t('مدمج مع البلاغ','Merged into report'),row.merged_into):''}
    <h3>${t('الملاحظات وسجل المتابعة','Notes and follow-up history')}</h3>${events.length?events.map(e=>`<section class="event"><p>${esc(eventText(e))}</p><small>${esc(e.by || '—')} · ${esc(date(e.at))}</small></section>`).join(''):`<p>${t('لا توجد ملاحظات مسجلة','No recorded notes')}</p>`}
    <h3>${t('الصور المرفقة','Attached images')} (${images.length})</h3>${images.length?images.map((p,i)=>`<figure><figcaption>${esc(name)} · ${esc(row.order_id)} · ${esc(o.customer || row.customer_name || '—')} · ${i+1}/${images.length}${p.caption?`<br>${esc(p.caption)}`:''}</figcaption><img src="${esc(p.url)}" alt="${esc(p.caption || name)}"><p class="image-error" hidden>${t('تعذر تحميل الصورة. أعد المحاولة قبل الطباعة.','Image failed to load. Retry before printing.')}</p></figure>`).join(''):`<p>${t('لا توجد صور مرفقة','No attached images')}</p>`}</article>`;
  }).join('');
  return `<!doctype html><html lang="${rtl?'ar':'en'}" dir="${rtl?'rtl':'ltr'}"><head><meta charset="utf-8"><title>THAWB · ${t('تقرير الأخطاء','Error report')}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:14px Arial,Tahoma,sans-serif;color:#172033;margin:0;line-height:1.6}header{border-bottom:3px solid #202f4d;margin-bottom:20px}h1{font-size:24px}h2{font-size:20px}h3{margin-top:22px}article+article{break-before:page}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.grid>div,.event{border:1px solid #ccd2db;padding:8px;break-inside:avoid}b,span{display:block}span,p,figcaption{white-space:pre-wrap;overflow-wrap:anywhere}article>div:not(.grid){margin-top:10px}figure{margin:16px 0;padding:12px;border:1px solid #ccd2db;break-inside:avoid}figcaption{font-weight:bold;margin-bottom:8px}img{display:block;max-width:100%;max-height:210mm;object-fit:contain;margin:auto}.image-error{color:#b91c1c}.toolbar{padding:14px;background:#f1f5f9}button{padding:10px 20px;cursor:pointer}@media print{.toolbar{display:none}h2,h3{break-after:avoid}}</style></head><body><div class="toolbar"><button id="print" disabled>${t('جارٍ تجهيز الصور…','Preparing images…')}</button><p id="warning" hidden>${t('بعض الصور لم تُحمّل. أعد فتح التقرير للمحاولة، أو اطبع النسخة المتاحة.','Some images failed to load. Reopen to retry, or print the available copy.')}</p></div><header><h1>THAWB · ${t('تقرير الأخطاء','Error report')}</h1><p>${t('عدد البلاغات','Reports')}: ${rows.length} · ${esc(date(new Date().toISOString()))}</p></header>${body}<script>
const button=document.getElementById('print');
Promise.all(Array.from(document.images,image=>new Promise(resolve=>{const done=()=>{if(!image.naturalWidth){image.nextElementSibling.hidden=false;document.getElementById('warning').hidden=false;}resolve();};if(image.complete)done();else{image.onload=done;image.onerror=done;}}))).then(()=>{button.disabled=false;button.textContent=${JSON.stringify(t('طباعة / حفظ PDF','Print / Save PDF'))};button.onclick=()=>window.print();});
</script></body></html>`;
}

export function openErrorPrint(rows, rtl) {
  if (!rows.length) return false;
  const preview = window.open('', '_blank');
  if (!preview) return false;
  preview.opener = null;
  preview.document.write(errorPrintDocument(rows, rtl));
  preview.document.close();
  return true;
}
