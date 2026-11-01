import { handleEnterSubmit } from "./keyboardSubmit";
import { useState, useRef, useEffect } from 'react';
import { TABS, TYPES, STAGES, array, reportRows, filterRows, photos, persistReport, persistLegacyFollowUp, insertReport, reportArrays, workflow } from './jacketWorkflow';
import './jacketErrors.css';
import { openErrorPrint } from './jacketErrorPrint';
import {additionalContacts,validContactPhone,normalizePhone,matchingReports,submissionSignature,submissionRequest,mergeReports} from './jacketReportActions';

// Images are resized before being stored with their note, using the existing
// notes access policy; no public storage bucket or schema change is required.
async function readImages(files) {
  if (files.length > 6) throw new Error('الحد الأقصى ٦ صور / Maximum 6 images');
  return Promise.all([...files].map(async file => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) throw new Error('اختر JPG / PNG / WebP أصغر من 12MB');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const url = canvas.toDataURL('image/jpeg', 0.72);
    if (url.length > 700000) throw new Error('الصورة كبيرة، اختر صورة أصغر / Image too large');
    return {
      url,
      caption: file.name
    };
  }));
}
function Dialog({
  title,
  body,
  close,
  action,
  busy,
  imageBusy,
  error,
  text
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector('button')?.focus();
    return () => previous?.focus();
  }, []);
  function keyboard(event) {
    handleEnterSubmit(event);
    if (event.key === 'Escape' && !busy && !imageBusy) {
      event.stopPropagation();
      close();
    }
    if (event.key !== 'Tab') return;
    const controls = [...dialog.current.querySelectorAll('button,input,select,textarea,summary,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return <div className="je-overlay"><section data-enter-scope="" ref={dialog} onKeyDown={keyboard} role="dialog" aria-modal="true" aria-label={title} className="je-modal"><header><h2>{title}</h2><button disabled={busy || imageBusy} onClick={close}>×</button></header><fieldset disabled={busy||imageBusy} style={{border:0,padding:0,margin:0,minWidth:0}}>{body}</fieldset>{error && <p role="alert" className="je-error">{error}</p>}<footer><button disabled={busy || imageBusy} onClick={close}>{text('إلغاء', 'Cancel')}</button>{action && <button data-enter-submit="" aria-keyshortcuts="Enter" className="je-primary" disabled={busy || imageBusy} onClick={action}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button>}</footer></section></div>;
}
const empty = {
  kind: '',
  count: '1',
  description: '',
  owner: '',
  size: '',
  jacketType: '',
  photos: [],
  extraPhone: '',
  forceNew: false
};
export default function JacketErrors({
  orders,
  reports,
  setReports,
  client,
  user,
  rtl,
  dark,
  newOrderId,
  onCloseNew,
  onOpenOrder,
  notify,
  modalOnly,
  onEdit,
  onEditNote,
  onDismiss,
  onRegistered,
  onOrderSaved,
  loadError
}) {
  const lock = useRef(false);
  const pendingSubmission=useRef(null);
  const [showMerged,setShowMerged]=useState(false);
  const [now] = useState(() => Date.now());
  const [tab, setTab] = useState('active'),
    [search, setSearch] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [sort, setSort] = useState('oldest');
  const [detail, setDetail] = useState(null),
    [editor, setEditor] = useState(null),
    [draft, setDraft] = useState({}),
    [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false),
    [imageBusy, setImageBusy] = useState(false),
    [error, setError] = useState(''),
    [zoom, setZoom] = useState(null),
    [createOrder, setCreateOrder] = useState('');
  const text = (ar, en) => rtl ? ar : en;
  const label = (items, key) => {
    const item = items.find(i => i[0] === key);
    return item ? item[rtl ? 1 : 2] : key || text('غير محدد', 'Not set');
  };
  const date = v => v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString(rtl ? 'ar-OM' : 'en-GB') : text('تاريخ التسجيل غير متوفر', 'Registration date unavailable');
  const rows = reportRows(orders, reports,{includeMerged:showMerged}),
    shown = filterRows(rows, {
      tab,
      search,
      from,
      to,
      sort
    }),
    current = rows.find(r => r.id === detail);
  const orderId = newOrderId || createOrder,
    order = orders.find(o => o.id === orderId);
  const closeNew = () => {
    onCloseNew();
    setCreateOrder('');
    setForm(empty);
    pendingSubmission.current=null;
    setError('');
  };
  const replace = saved => setReports(prev => prev.map(r => r.id === saved.id ? saved : r));
  const fail = e => setError(e.message || text('تعذر الحفظ، حاول مرة أخرى', 'Save failed. Please retry'));
  function printReports(items) {
    if (!openErrorPrint(items, rtl)) notify(text('تعذر فتح الطباعة؛ اسمح بالنوافذ المنبثقة وحاول مجدداً', 'Could not open print preview; allow pop-ups and retry'));
  }
  async function attach(files, setter) {
    setImageBusy(true);
    setError('');
    try {
      const images = await readImages(files);
      setter(prev => {
        if ((prev.photos?.length || 0) + images.length > 6) {
          setError(text('الحد الأقصى ٦ صور', 'Maximum 6 images'));
          return prev;
        }
        return {
          ...prev,
          photos: [...(prev.photos || []), ...images]
        };
      });
    } catch (e) {
      fail(e);
    } finally {
      setImageBusy(false);
    }
  }
  async function create() {
    if (!order || !TYPES.some(t => t[0] === form.kind) || !Number.isInteger(Number(form.count)) || Number(form.count) < 1 || Number(form.count) > Number(order?.jackets)) {
      setError(text('اختر نوع الخطأ وعدداً صحيحاً ضمن إجمالي الطلب', 'Select an error type and a valid affected count'));
      return;
    }
    if(form.extraPhone&&!validContactPhone(form.extraPhone)){setError(text('رقم التواصل الإضافي غير صالح','Invalid additional phone number'));return;}
    const similar=matchingReports(reports,orderId,form.description,form.count);
    if(similar.length&&!form.forceNew){setError(text('يوجد بلاغ مشابه. افتح البلاغ الموجود لإضافة ملاحظات أو صور، أو اختر إنشاء بلاغ مستقل.','A matching report exists. Open it to add notes or images, or choose a separate report.'));return;}
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const synthetic = rows.find(r => r.synthetic && r.order_id === orderId);
      const now = new Date().toISOString(),
        by = user?.name || 'Admin';
      const initial = {
        type: 'workflow',
        state: synthetic?.wf.state || 'new',
        stage: synthetic?.wf.stage || 'review',
        kind: form.kind,
        by,
        at: now,
        reason: '',
        next: ''
      };
      const history = [{
        status: 1,
        type: 'created',
        by,
        at: now,
        note: text('تم تسجيل البلاغ', 'Report registered')
      }];
      // Completing an order-only report preserves its original notes and unknown date.
      const notes = [...array(synthetic?.notes), ...(synthetic ? [{
        type: 'original_date_unknown'
      }] : []), initial, ...(form.photos.length ? [{
        type: 'note',
        text: form.description,
        photos: form.photos,
        by,
        at: now
      }] : []),...(form.extraPhone?[{type:'contact',phone:normalizePhone(form.extraPhone),by,at:now}]:[])];
      const payload = {
        order_id: orderId,
        customer_name: order.customer || '',
        customer_phone: order.phone || '',
        jacket_owner: form.owner,
        jacket_size: form.size,
        jacket_type: form.jacketType,
        affected_jackets: Number(form.count),
        error_description: form.description,
        status: 1,
        notes: JSON.stringify(notes),
        status_history: JSON.stringify(history),
        created_at: now,
        updated_at: now
      };
      const signature=await submissionSignature(payload);
      if(!pendingSubmission.current||pendingSubmission.current.signature!==signature||pendingSubmission.current.forceNew!==form.forceNew)pendingSubmission.current=submissionRequest(signature,form.forceNew);
      const request=pendingSubmission.current;
      const data = await insertReport(client, payload,request);
      setReports(prev => [data, ...prev.filter(r=>r.id!==data.id)]);
      if(request.forceNew){try{sessionStorage.removeItem(request.cacheKey);}catch{/* Optional storage. */}}
      setTab(workflow(data,order).state);
      if(data.submissionExisting)setDetail(data.id);
      closeNew();
      notify(data.submissionExisting?text('تم العثور على البلاغ المحفوظ مسبقاً بدون تكرار','Recovered the saved report without duplication'):text('تم تسجيل البلاغ', 'Report registered'));
      if (onRegistered) await onRegistered(order);
    } catch (e) {
      fail(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function edit(row, mode) {
    setEditor({
      id: row.id,
      snapshot: row,
      mode
    });
    setDraft({
      ...row.wf,
      text: '',
      photos: [],
      phone: '',
      contactLabel: '',
      targetId: ''
    });
    setError('');
  }
  async function save() {
    const row = editor.snapshot;
    if (!row || row.merged_into) return;
    if (editor.mode === 'state' && ['paused', 'rejected', 'cancelled'].includes(draft.state) && !draft.reason?.trim()) {
      setError(text('اكتب سبب التعليق أو الرفض', 'Enter the reason for holding or rejecting'));
      return;
    }
    if(editor.mode==='contact'&&!validContactPhone(draft.phone)){setError(text('أدخل رقم تواصل صحيحاً من ٧ إلى ١٥ رقماً','Enter a valid contact number of 7–15 digits'));return;}
    if(editor.mode==='contact'&&additionalContacts(row).some(c=>normalizePhone(c.phone).replace(/\D/g,'')===normalizePhone(draft.phone).replace(/\D/g,''))){setError(text('هذا الرقم مضاف مسبقاً','This number is already added'));return;}
    if(editor.mode==='merge'&&!draft.targetId){setError(text('اختر البلاغ الأساسي','Choose the main report'));return;}
    if (editor.mode === 'note' && !draft.text?.trim() && !draft.photos?.length) {
      setError(text('أضف ملاحظة أو صورة', 'Add a note or image'));
      return;
    }
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const now = new Date().toISOString(),
        by = user?.name || 'Admin';
      if(editor.mode==='merge'){
        const target=reports.find(r=>String(r.id)===draft.targetId);
        const merged=await mergeReports(client,row,target,by);
        setReports(prev=>prev.map(r=>r.id===merged.source.id?merged.source:r.id===merged.target.id?merged.target:r));
        setEditor(null);setDetail(merged.target.id);notify(text('تم دمج المكرر مع حفظ السجل الأصلي','Merged duplicate; original record preserved'));return;
      }
      const entry = editor.mode === 'note' ? {
        type: 'note',
        text: draft.text.trim(),
        photos: draft.photos,
        by,
        at: now
      } : editor.mode==='contact'?{type:'contact',phone:normalizePhone(draft.phone),label:draft.contactLabel?.trim()||'',by,at:now}: {
        type: 'workflow',
        state: draft.state,
        stage: draft.stage,
        kind: draft.kind,
        reason: draft.reason || '',
        next: draft.next || '',
        refundDone: !!draft.refundDone,
        by,
        at: now
      };
      if(row.synthetic){
        onOrderSaved(await persistLegacyFollowUp(client,row.order,entry));
        setEditor(null);
        notify(text('تم الحفظ','Saved'));
        return;
      }
      const stored = reportArrays(row);
      const notes = [...stored.notes, entry];
      const hist = [...stored.history, {
        type: editor.mode,
        by,
        at: now,
        note: editor.mode==='contact'?text('إضافة رقم تواصل: ','Additional contact: ')+entry.phone:editor.mode === 'note' ? entry.text : `${label(TABS, entry.state)} · ${label(STAGES, entry.stage)}`,
        workflow: editor.mode === 'state' ? entry : undefined
      }];
      replace(await persistReport(client, row, {
        notes: JSON.stringify(notes),
        status_history: JSON.stringify(hist),
        updated_at: now
      }));
      setEditor(null);
      notify(text('تم الحفظ', 'Saved'));
    } catch (e) {
      fail(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function imageFields(value, setter) {
    return <div><div className="je-actions"><label className="je-upload">📷 {text('التقاط صورة', 'Take photo')}<input disabled={busy || imageBusy} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => {
          if (e.target.files?.length) attach(e.target.files, setter);
          e.target.value = '';
        }} /></label><label className="je-upload">＋ {text('إرفاق صور', 'Attach images')}<input disabled={busy || imageBusy} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => {
          attach(e.target.files, setter);
          e.target.value = '';
        }} /></label></div>{imageBusy && <p>{text('جارٍ تجهيز الصور…', 'Preparing images…')}</p>}<div className="je-thumbs">{(value.photos || []).map((p, i) => <div key={i}><img src={p.url} alt={p.caption} /><input aria-label={text('تعليق الصورة', 'Image caption')} value={p.caption} onChange={e => setter(prev => ({
            ...prev,
            photos: prev.photos.map((x, j) => j === i ? {
              ...x,
              caption: e.target.value
            } : x)
          }))} /><button type="button" onClick={() => setter(prev => ({
            ...prev,
            photos: prev.photos.filter((_, j) => i !== j)
          }))}>{text('إزالة', 'Remove')}</button></div>)}</div></div>;
  }
  if (loadError) return <div data-workflow-version="2026-10-31" className={`je ${dark ? 'je-dark' : ''}`} dir={rtl ? 'rtl' : 'ltr'}><p role="alert" className="je-error">{loadError}</p><button onClick={() => window.location.reload()}>{text('إعادة تحميل البيانات', 'Reload data')}</button>{newOrderId && <button onClick={onCloseNew}>{text('إغلاق', 'Close')}</button>}</div>;
  return <div data-workflow-version="2026-10-31" className={`je ${dark ? 'je-dark' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
    {!modalOnly && <><header className="je-heading"><div><h1>{text('أخطاء الجاكيتات', 'Jacket errors')}</h1><p>{text('كل بلاغ، وضعه الحالي، والخطوة القادمة في مكان واحد', 'Every report, its current progress and next step in one place')}</p></div><select aria-label={text('تسجيل بلاغ لطلب', 'Register a report for an order')} value="" onChange={e => {
          setForm(empty);
          setCreateOrder(e.target.value);
          setError('');
        }}><option value="">＋ {text('تسجيل بلاغ', 'Register report')}</option>{orders.map(o => <option key={o.id} value={o.id}>{o.id} · {o.customer}</option>)}</select></header>
    <div className="je-actions"><button disabled={!shown.length} onClick={() => printReports(shown)}>🖨️ {text('طباعة نسخ العملاء', 'Print customer copies')} ({shown.length})</button></div>
    <nav className="je-tabs" aria-label={text('حالات البلاغات', 'Report states')}>{TABS.map(([key, ar, en]) => <button key={key} aria-pressed={tab === key} className={tab === key ? 'selected' : ''} onClick={() => setTab(key)}>{rtl ? ar : en}<b>{key === 'all' ? rows.length : rows.filter(r => r.wf.state === key).length}</b></button>)}</nav>
    <div className="je-filters"><input aria-label={text('بحث', 'Search')} placeholder={text('بحث بالطلب، العميل أو وصف المشكلة…', 'Search order, customer or issue…')} value={search} onChange={e => setSearch(e.target.value)} /><label>{text('من', 'From')}<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>{text('إلى', 'To')}<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><select aria-label={text('ترتيب', 'Sort')} value={sort} onChange={e => setSort(e.target.value)}><option value="oldest">{text('الأقدم أولاً', 'Oldest first')}</option><option value="newest">{text('الأحدث أولاً', 'Newest first')}</option><option value="updated">{text('آخر متابعة', 'Last follow-up')}</option></select><button onClick={() => {
          setSearch('');
          setFrom('');
          setTo('');
          setSort('oldest');
        }}>{text('مسح الفلاتر', 'Clear filters')}</button></div>
    <label style={{display:'block',marginTop:12,fontSize:12}}><input type="checkbox" checked={showMerged} onChange={e=>setShowMerged(e.target.checked)}/>{text('إظهار النسخ المدمجة المحفوظة','Show preserved merged copies')}</label><p className="je-muted">{shown.length} {text('بلاغ', 'reports')}</p>
    <div className="je-list">{shown.map(row => {
          const notes = [...array(row.order.errorNotes), ...array(row.notes),...array(row.relatedReports).flatMap(r=>array(r.notes))].filter(n => n.text && !['affected_jackets','workflow','contact','merge','duplicate_link','original_date_unknown'].includes(n.type)).sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0)),
            last = notes.at(-1),
            closed = ['resolved', 'rejected', 'cancelled'].includes(row.wf.state) || row.wf.state === 'refund' && row.wf.refundDone;
          return <article key={row.id} className={`je-row state-${row.wf.state}`}><div className="je-rowhead"><div><strong>{row.order_id} · {row.order.customer || row.customer_name || '—'}</strong><p className="je-muted" style={{fontSize:13,margin:"6px 0 0"}}>{text('رقم العميل: ', 'Customer phone: ')}<bdi dir="ltr" style={{fontWeight:600}}>{row.order.phone || row.customer_phone || text('غير مسجل', 'Not recorded')}</bdi></p>{additionalContacts(row).map((contact,i)=><p key={i} style={{fontSize:13,margin:'6px 0 0'}}>{text('رقم إضافي','Additional phone')}{contact.label?' · '+contact.label:''}: <bdi dir="ltr">{contact.phone}</bdi></p>)}</div><span className="je-badge">{label(TABS, row.wf.state)}</span></div>
        {row.merged_into&&<p className="je-warning">{text('نسخة مدمجة مع البلاغ #','Merged into report #')}{row.merged_into}</p>}{row.dataWarning && <p className="je-error">{text('بيانات البلاغ تحتاج مراجعة؛ التعديل متوقف لحمايتها', 'Report data needs review; editing is disabled to protect it')}</p>}<h3>{label(TYPES, row.wf.kind)} · {text('المتضررة', 'Affected')}: <bdi dir="ltr">{row.synthetic ? '—' : row.affectedJackets ?? row.affected_jackets ?? 1} / {row.order.jackets ?? '—'}</bdi></h3>
        {row.error_description && <p className="je-description">{row.error_description}</p>}
        <p className="je-stage">{label(STAGES, row.wf.stage)}{row.wf.state === 'refund' && ` · ${row.wf.refundDone ? text('تم الاسترجاع', 'Refund completed') : text('بانتظار الاسترجاع', 'Refund pending')}`}</p>
        {row.wf.conflict && <p className="je-warning">⚠ {text('تحتاج تأكيد الحالة — بيانات الطلب والبلاغ متعارضة', 'Confirm state — order and report disagree')}</p>}
        {row.wf.reason && <p><b>{text('السبب: ', 'Reason: ')}</b>{row.wf.reason}</p>}
        {last ? <div className="je-note"><b>{text('آخر ملاحظة: ', 'Latest note: ')}</b>{last.text.length > 220 ? <details><summary>{last.text.slice(0, 220)}… {text('عرض المزيد', 'Show more')}</summary><p>{last.text}</p></details> : <span>{last.text}</span>}<small>{last.by || '—'} · {date(last.at)}</small></div> : <p className="je-muted">{text('لا توجد ملاحظات بعد', 'No notes yet')}</p>}
        {row.wf.next && <p><b>{text('الخطوة القادمة: ', 'Next step: ')}</b>{row.wf.next}</p>}
        <div className="je-meta"><span>{text('سُجّل: ', 'Registered: ')}{date(row.created_at)}</span>{!closed && row.created_at && Number.isFinite(Date.parse(row.created_at)) && <span>{Math.max(0, Math.floor((now - Date.parse(row.created_at)) / 86400000))} {text('يوم مفتوح', 'days open')}</span>}<span>{text('آخر متابعة: ', 'Last follow-up: ')}{date(row.lastFollowUp||row.updated_at)}</span><span>📷 {photos(row).length}</span></div>
        <div className="je-actions"><button onClick={() => printReports([row])}>🖨️ {text('طباعة نسخة العميل', 'Print customer copy')}</button>{row.synthetic ? <><button onClick={() => edit(row, 'state')}>{text('تغيير الحالة', 'Change state')}</button><button onClick={() => onDismiss(row.order)}>{text('إزالة من قائمة الأخطاء', 'Remove from Errors')}</button><button onClick={() => {
                setForm(empty);
                setCreateOrder(row.order_id);
              }}>{text('استكمال البلاغ', 'Complete report')}</button></> : <><button disabled={row.dataWarning||!!row.merged_into} onClick={() => edit(row, 'state')}>{text('تغيير الحالة', 'Change state')}</button><button disabled={row.dataWarning||!!row.merged_into} onClick={() => edit(row, 'note')}>{text('إضافة ملاحظة / صور', 'Add note / images')}</button></>}{!row.synthetic&&!row.merged_into&&<button onClick={()=>edit(row,'contact')}>{text('إضافة رقم تواصل','Add contact number')}</button>}{!row.synthetic&&!row.merged_into&&matchingReports(reports,row.order_id,row.error_description,row.affectedJackets).some(r=>Number(r.id)<Number(row.id))&&<button onClick={()=>edit(row,'merge')}>{text('دمج المكرر','Merge duplicate')}</button>}<button className="je-primary" onClick={() => setDetail(row.id)}>{text('التفاصيل', 'Details')}</button></div>
      </article>;
        })}{!shown.length && <div className="je-empty">{text('لا توجد بلاغات في هذه القائمة', 'No reports in this list')}</div>}</div>
    </>}
    {orderId && <Dialog title={text('تسجيل خطأ جاكيت', 'Register jacket error')} body={<div className="je-form"><p>{orderId} · {order?.customer} · {text('التاريخ يُسجل تلقائياً', 'Date recorded automatically')}</p><label>{text('نوع الخطأ *', 'Error type *')}<select value={form.kind} onChange={e => setForm({
          ...form,
          kind: e.target.value
        })}><option value="">{text('اختر', 'Select')}</option>{TYPES.map(([key, ar, en]) => <option key={key} value={key}>{rtl ? ar : en}</option>)}</select></label><label>{text('عدد الجاكيتات المتضررة *', 'Affected jackets *')}<input type="number" min="1" step="1" max={order?.jackets} value={form.count} onChange={e => setForm({
          ...form,
          count: e.target.value
        })} /><small>{text('من إجمالي', 'Out of')} {order?.jackets}</small></label><label>{text('وصف مختصر — اختياري', 'Short description — optional')}<textarea value={form.description} onChange={e => setForm({
          ...form,
          description: e.target.value
        })} /></label><label>{text('رقم تواصل إضافي — اختياري','Additional phone — optional')}<input type="tel" dir="ltr" value={form.extraPhone} onChange={e=>setForm({...form,extraPhone:e.target.value})}/></label>{matchingReports(reports,orderId,form.description,form.count).length>0&&<div className="je-warning"><p>{text('يوجد بلاغ مشابه لهذا الطلب. افتحه لإضافة الملاحظات أو الصور.','A matching report exists. Open it to add notes or images.')}</p><button type="button" onClick={()=>{const existing=matchingReports(reports,orderId,form.description,form.count)[0];closeNew();setTab(workflow(existing).state);setDetail(existing.id);}}>{text('فتح البلاغ الموجود','Open existing report')}</button><label><input type="checkbox" checked={form.forceNew} onChange={e=>{setForm({...form,forceNew:e.target.checked});pendingSubmission.current=null;}}/>{text('هذه مشكلة مستقلة؛ أنشئ بلاغاً جديداً','This is a separate issue; create a new report')}</label></div>}{imageFields(form, setForm)}<details><summary>{text('تفاصيل إضافية — اختيارية', 'Additional details — optional')}</summary>{[['owner', 'اسم صاحب الجاكيت', 'Jacket owner'], ['size', 'المقاس', 'Size'], ['jacketType', 'نوع الجاكيت', 'Jacket type']].map(([key, ar, en]) => <label key={key}>{rtl ? ar : en}<input value={form[key]} onChange={e => setForm({
            ...form,
            [key]: e.target.value
          })} /></label>)}</details></div>} close={closeNew} action={() => create()} busy={busy} imageBusy={imageBusy} error={error} text={text} />}
    {editor && <Dialog title={editor.mode==='contact'?text('إضافة رقم تواصل','Add contact number'):editor.mode==='merge'?text('دمج بلاغ مكرر','Merge duplicate'):editor.mode === 'note' ? text('إضافة ملاحظة وصور', 'Add note and images') : text('تحديث المتابعة', 'Update follow-up')} body={<div className="je-form">{editor.mode==='contact'?<><label>{text('رقم التواصل الإضافي *','Additional phone *')}<input type="tel" dir="ltr" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label><label>{text('اسم المتواصل — اختياري','Contact name — optional')}<input value={draft.contactLabel} onChange={e=>setDraft({...draft,contactLabel:e.target.value})}/></label></>:editor.mode==='merge'?<><p>{text('ستظهر ملاحظات وصور وأرقام النسخة المكررة ضمن البلاغ الأساسي، وتبقى النسخة الأصلية محفوظة. لا يتم حذف أي سجل أو جمع عدد الجاكيتات.','Notes, images and contacts appear under the main report. The original stays preserved; records are not deleted and quantities are not added.')}</p><label>{text('البلاغ الأساسي','Main report')}<select value={draft.targetId} onChange={e=>setDraft({...draft,targetId:e.target.value})}><option value="">{text('اختر','Choose')}</option>{matchingReports(reports,editor.snapshot.order_id,editor.snapshot.error_description,editor.snapshot.affectedJackets).filter(r=>Number(r.id)<Number(editor.id)).map(r=><option key={r.id} value={r.id}>#{r.id} · {date(r.created_at)} · 📷 {photos(r).length}</option>)}</select></label></>:editor.mode === 'note' ? <><label>{text('الملاحظة', 'Note')}<textarea value={draft.text} onChange={e => setDraft({
            ...draft,
            text: e.target.value
          })} /></label>{imageFields(draft, setDraft)}</> : <><label>{text('الحالة', 'State')}<select value={draft.state} onChange={e => setDraft({
            ...draft,
            state: e.target.value
          })}>{TABS.filter(t => t[0] !== 'all').map(([key, ar, en]) => <option key={key} value={key}>{rtl ? ar : en}</option>)}</select></label><label>{text('مرحلة المتابعة', 'Follow-up stage')}<select value={draft.stage} onChange={e => setDraft({
            ...draft,
            stage: e.target.value,
            state: 'active'
          })}>{STAGES.map(([key, ar, en]) => <option key={key} value={key}>{rtl ? ar : en}</option>)}</select></label><label>{text('نوع الخطأ', 'Error type')}<select value={draft.kind || ''} onChange={e => setDraft({
            ...draft,
            kind: e.target.value
          })}><option value="">{text('غير محدد', 'Not set')}</option>{TYPES.map(([key, ar, en]) => <option key={key} value={key}>{rtl ? ar : en}</option>)}</select></label><label>{text('السبب', 'Reason')}{['paused', 'rejected', 'cancelled'].includes(draft.state) ? ' *' : ''}<textarea value={draft.reason || ''} onChange={e => setDraft({
            ...draft,
            reason: e.target.value
          })} /></label><label>{text('الخطوة القادمة', 'Next step')}<input value={draft.next || ''} onChange={e => setDraft({
            ...draft,
            next: e.target.value
          })} /></label>{draft.state === 'refund' && <label><input type="checkbox" checked={!!draft.refundDone} onChange={e => setDraft({
            ...draft,
            refundDone: e.target.checked
          })} />{text('اكتمل استرجاع المبلغ', 'Refund completed')}</label>}{draft.state === 'resolved' && <p className="je-warning">{text('احفظ فقط بعد اكتمال الحل والتسليم للعميل', 'Save only after the issue is resolved and delivery is complete')}</p>}</>}</div>} close={() => {
      setEditor(null);
      setError('');
    }} action={() => save()} busy={busy} imageBusy={imageBusy} error={error} text={text} />}
    {current && !editor && <Dialog title={`${text('تفاصيل البلاغ', 'Report details')} · ${current.order_id}`} body={<div><button onClick={() => printReports([current])}>🖨️ {text('طباعة نسخة العميل', 'Print customer copy')}</button><p>{current.error_description}</p>{!current.merged_into && <div className="je-actions"><button onClick={() => edit(current, 'state')}>{text('تغيير الحالة', 'Change state')}</button><button onClick={() => edit(current, 'note')}>{text('إضافة ملاحظة / صور', 'Add note / images')}</button></div>}{!current.synthetic && user?.role === 'admin' && <button onClick={() => {
        setDetail(null);
        onEdit(current);
      }}>{text('تعديل بيانات البلاغ', 'Edit report data')}</button>}<button onClick={() => {
        setDetail(null);
        onDismiss(current.order);
      }}>{text('إزالة الطلب من قائمة الأخطاء القديمة', 'Remove order from legacy errors')}</button><p>{text('صاحب الجاكيت / المقاس / النوع: ', 'Owner / size / type: ')}{[current.jacket_owner, current.jacket_size, current.jacket_type].filter(Boolean).join(' · ') || '—'}</p><button onClick={() => onOpenOrder(current.order)}>{text('فتح الطلب الأصلي', 'Open original order')}</button><h3>{text('الصور', 'Images')}</h3><div className="je-gallery">{photos(current).map((p, i) => <button key={i} onClick={() => setZoom(p)}><img src={p.url} alt={p.caption || text('صورة البلاغ', 'Report image')} /><span>{p.caption}</span></button>)}</div>{!photos(current).length && <p>{text('لا توجد صور', 'No images')}</p>}<h3>{text('ملاحظات الطلب السابقة', 'Previous order notes')}</h3>{array(current.order.errorNotes).map((n, i) => <div className="je-event" key={i}><p>{n.text}</p><small>{n.by} · {date(n.at)}</small>{user?.role === 'admin' && <button onClick={() => {
          setDetail(null);
          onEditNote(current.order, i);
        }}>{text('تعديل', 'Edit')}</button>}</div>)}{array(current.relatedReports).map(related=><section key={related.id}><h3>{text('ملاحظات البلاغ المرتبط #','Linked report notes #')}{related.id}</h3>{array(related.notes).filter(n=>n.text).map((n,i)=><div className="je-event" key={i}><p>{n.text}</p><small>{n.by} · {date(n.at)}</small></div>)}</section>)}<h3>{text('سجل المتابعة', 'Follow-up history')}</h3>{[...array(current.statusHistory || current.status_history).filter(h => !['state', 'note'].includes(h.type)).map(h => ({
        ...h,
        text: h.note || label(STAGES, {
          1: 'review',
          2: 'waiting',
          3: 'received',
          4: 'factory',
          5: 'modifying',
          6: 'modified',
          7: 'returned',
          8: 'ready',
          9: 'sent',
          10: 'sent',
          11: 'replacement'
        }[h.status])
      })), ...array(current.notes).filter(n => !['affected_jackets', 'original_date_unknown'].includes(n.type)).map(n => ({
        ...n,
        originalIndex: array(current.notes).indexOf(n),
        text: n.type==='contact'?`${text('رقم إضافي','Additional phone')}: ${n.phone}${n.label?' · '+n.label:''}`:n.type === 'workflow' ? `${label(TABS, n.state)} · ${label(STAGES, n.stage)}${n.reason ? ' · ' + n.reason : ''}${n.next ? ' · ' + n.next : ''}` : n.text
      }))].sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0)).map((n, i) => <div className="je-event" key={i}><p>{n.text}</p>{n.text && !['workflow','contact','merge'].includes(n.type) && user?.role === 'admin' && n.originalIndex >= 0 && <button onClick={() => {
          setDetail(null);
          onEditNote(current, n.originalIndex, true);
        }}>{text('تعديل', 'Edit')}</button>}<small>{n.by} · {date(n.at)}</small></div>)}</div>} close={() => setDetail(null)} busy={busy} imageBusy={imageBusy} error={error} text={text} />}
    {zoom && <div className="je-zoom" onKeyDown={event => {
      if (event.key === 'Escape') setZoom(null);
      if (event.key === 'Tab') event.preventDefault();
    }} role="dialog" aria-modal="true" aria-label={text('عرض الصورة', 'Image preview')}><button autoFocus onClick={() => setZoom(null)}>{text('إغلاق', 'Close')} ×</button><img src={zoom.url} alt={zoom.caption || ''} /><p>{zoom.caption}</p></div>}
  </div>;
}
