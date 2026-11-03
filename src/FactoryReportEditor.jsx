import { useState } from 'react';
import { factoryReport, newFactoryIssue, openFactoryPrint } from './factoryReport';

export default function FactoryReportEditor({ row, text, readImages, onSave, busy, onImageBusy }) {
  const [draft, setDraft] = useState(() => factoryReport(row) || { issues: [newFactoryIssue()], jacketType: row.jacket_type || '', formPhoto: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  function change(fn) { setDraft(fn); setDirty(true); }
  function update(id, key, value) { change(prev => ({ ...prev, issues: prev.issues.map(issue => issue.id === id ? { ...issue, [key]: value } : issue) })); }
  async function upload(file, assign) {
    if (!file) return;
    setLoading(true); onImageBusy(true); setError('');
    try { const [photo] = await readImages([file]); assign(photo); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); onImageBusy(false); }
  }
  function photoField(photo, assign, title) {
    return <div className="je-factory-photo"><strong>{title}</strong>{photo && <><img src={photo.url} alt={title} /><button type="button" onClick={() => assign(null)}>{text('إزالة الصورة', 'Remove image')}</button></>}<label className="je-upload">{text('إرفاق صورة', 'Upload image')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { upload(e.target.files?.[0], assign); e.target.value = ''; }} /></label><label className="je-upload">{text('التقاط صورة', 'Take photo')}<input type="file" capture="environment" accept="image/jpeg,image/png,image/webp" onChange={e => { upload(e.target.files?.[0], assign); e.target.value = ''; }} /></label></div>;
  }
  async function save() {
    if (draft.issues.some(i => !i.received || !i.expected || !i.problem.trim() || !i.correction.trim())) { setError(text('أرفق صورة الوصول وصورة المطلوب، واكتب وصف الخطأ والتعديل لكل خطأ.', 'Each issue needs received and expected images, a problem description and correction.')); return; }
    setError('');
    try { await onSave(draft); setDirty(false); }
    catch (e) { setError(e.message); }
  }
  return <div className="je-form"><p>{text('نسخة المصنع تخفي اسم العميل ورقمه. تأكد أن الصور والفورم لا تحتوي بيانات العميل.', 'The factory copy excludes customer details. Check that photos and the form contain no customer information.')}</p><p>{row.order_id} · {text('عدد الجاكيتات:', 'Jackets:')} {row.order?.jackets ?? '—'}</p><fieldset disabled={busy || loading} className="je-factory-fields"><label>{text('نوع الجاكيت', 'Jacket type')}<input value={draft.jacketType} onChange={e => change(p => ({ ...p, jacketType: e.target.value }))} /></label>{draft.issues.map((issue, index) => <section className="je-factory-issue" key={issue.id}><div className="je-rowhead"><h3>{text('الخطأ', 'Issue')} {index + 1}</h3><button type="button" disabled={draft.issues.length === 1} onClick={() => change(p => ({ ...p, issues: p.issues.filter(i => i.id !== issue.id) }))}>{text('حذف الخطأ', 'Remove issue')}</button></div><div className="je-factory-photos">{[['received', text('كيف وصل / الخطأ *', 'As received / Error *')], ['expected', text('كيف المفروض يكون *', 'Expected result *')], ['extra', text('مرجع إضافي — اختياري', 'Extra reference — optional')]].map(([key, title]) => <div key={key}>{photoField(issue[key], p => update(issue.id, key, p), title)}</div>)}</div><label>{text('شرح الخطأ بالإنجليزي *', 'What went wrong (English) *')}<textarea dir="auto" lang="en" value={issue.problem} onChange={e => update(issue.id, 'problem', e.target.value)} /></label><label>{text('كيف المفروض يكون وكيف يتعدل — بالإنجليزي *', 'Expected result and required correction (English) *')}<textarea dir="auto" lang="en" value={issue.correction} onChange={e => update(issue.id, 'correction', e.target.value)} /></label></section>)}<button type="button" onClick={() => change(p => ({ ...p, issues: [...p.issues, newFactoryIssue()] }))}>＋ {text('إضافة خطأ آخر', 'Add another issue')}</button><details><summary>{text('صورة الفورم — اختيارية، تظهر في صفحة مستقلة عند إرفاقها', 'Optional form photo — prints on a separate page when attached')}</summary>{photoField(draft.formPhoto, photo => change(p => ({ ...p, formPhoto: photo })), text('صورة الفورم', 'Form photo'))}</details></fieldset>{loading && <p role="status">{text('جارٍ تجهيز الصورة…', 'Preparing image…')}</p>}{error && <p role="alert" className="je-error">{error}</p>}<div className="je-actions"><button className="je-primary" disabled={busy || loading} onClick={save}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ التقرير', 'Save report')}</button><button disabled={busy || loading || dirty || !factoryReport(row)} onClick={() => { if (!openFactoryPrint(row, draft)) setError(text('اسمح بالنوافذ المنبثقة ثم حاول مجددًا', 'Allow pop-ups and retry')); }}>{text('طباعة / حفظ PDF', 'Print / Save PDF')}</button></div>{dirty && <small>{text('احفظ التعديلات لتفعيل الطباعة.', 'Save changes to enable printing.')}</small>}</div>;
}
