// Workflow events live alongside legacy notes so installations with the original
// schema keep working. Each event is an immutable snapshot; the latest explicit
// snapshot wins over legacy order/report statuses. Images belong to note events.
// original_date_unknown distinguishes completing an old order-only case from
// registering a genuinely new report (created_at itself is NOT NULL in legacy DBs).
export const TABS = [['new', 'جديدة', 'New'], ['active', 'قيد المتابعة', 'Following up'], ['paused', 'معلّقة', 'On hold'], ['resolved', 'تم الحل', 'Resolved'], ['rejected', 'مرفوضة', 'Rejected'], ['refund', 'استرجاع المبلغ', 'Refund'], ['all', 'الكل', 'All']];
export const TYPES = [['size', 'مقاس', 'Size'], ['embroidery', 'تطريز / اسم', 'Embroidery / name'], ['color', 'لون', 'Color'], ['wrong', 'جاكيت مختلف', 'Wrong jacket'], ['defect', 'عيب تصنيع', 'Manufacturing defect'], ['other', 'أخرى', 'Other']];
export const STAGES = [['review', 'مراجعة البلاغ', 'Reviewing report'], ['waiting', 'بانتظار استلامه من العميل', 'Waiting for customer'], ['received', 'تم استلامه من العميل', 'Received from customer'], ['factory', 'تم إرساله للمصنع', 'Sent to factory'], ['modifying', 'عند المصنع — قيد التعديل', 'At factory — being modified'], ['modified', 'انتهى التعديل', 'Modification finished'], ['returned', 'تم استلامه من المصنع', 'Received from factory'], ['ready', 'جاهز للتسليم', 'Ready for delivery'], ['sent', 'أُرسل للعميل', 'Sent to customer'], ['replacement', 'يحتاج استبدال', 'Needs replacement']];
export function array(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : [];
  } catch {
    return [];
  }
}
export function reportArrays(report) {
  const read = value => {
    if (value === undefined) return [];
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item !== 'object' || Array.isArray(item))) throw new Error('Unrecognized stored report data');
    return parsed;
  };
  try {
    return {
      notes: read(Object.hasOwn(report, 'storedNotes') ? report.storedNotes : report.notes),
      history: read(Object.hasOwn(report, 'storedHistory') ? report.storedHistory : report.status_history ?? report.statusHistory)
    };
  } catch {
    throw new Error('تعذر قراءة سجل البلاغ بأمان؛ لم يتم تعديل البيانات. تواصل مع المسؤول / Report data could not be read safely; nothing was changed');
  }
}
export function normalizeReport(data) {
  const result = {
    ...data,
    storedNotes: data.notes,
    storedHistory: data.status_history,
    notes: array(data.notes),
    statusHistory: array(data.status_history)
  };
  try {
    reportArrays(result);
  } catch {
    result.dataWarning = true;
  }
  return result;
}
export function workflow(report, order = {}) {
  const notes = array(report.notes),
    saved = [...notes].reverse().find(n => n.type === 'workflow');
  if (saved) return {
    ...saved,
    conflict: false
  };
  const status = Number(report.status),
    sub = Number(order.errorSubStatus);
  const reportState = [9, 10].includes(status) ? 'resolved' : status > 1 ? 'active' : 'new';
  const orderState = sub === 9 ? 'rejected' : sub === 10 ? 'refund' : sub > 0 ? 'active' : 'new';
  const conflict = reportState !== 'new' && orderState !== 'new' && reportState !== orderState;
  const map = {
    2: 'waiting',
    3: 'received',
    4: 'factory',
    5: 'modifying',
    6: 'modified',
    7: 'returned',
    8: 'ready',
    9: 'sent',
    11: 'replacement'
  };
  const subMap = {
    1: 'received',
    2: 'received',
    3: 'factory',
    4: 'modifying',
    5: 'modified',
    6: 'ready',
    7: 'returned',
    8: 'sent'
  };
  return {
    state: conflict ? 'active' : reportState === 'new' ? orderState : reportState,
    stage: map[status] || subMap[sub] || 'review',
    conflict,
    kind: '',
    reason: '',
    next: '',
    refundDone: false
  };
}
export function mergedTarget(report) {
  const link=[...array(report.notes)].reverse().find(n=>n.type==='duplicate_link');
  const target=Number(link?.target_id);
  return Number.isInteger(target)&&target>0&&target<Number(report.id)?target:null;
}
export function reportRows(orders, reports, {includeMerged=false}={}) {
  const byId=new Map(reports.map(r=>[Number(r.id),r]));
  const rootId=report=>{let root=report;while(mergedTarget(root)&&byId.has(mergedTarget(root)))root=byId.get(mergedTarget(root));return Number(root.id);};
  const rows = reports.filter(r=>includeMerged||rootId(r)===Number(r.id)).map(r => {
    const order = orders.find(o => o.id === r.order_id) || {
      id: r.order_id,
      customer: r.customer_name,
      phone: r.customer_phone
    };
    const notes = array(r.notes);
    const related=reports.filter(other=>other.id!==r.id&&rootId(other)===Number(r.id));
    const lastFollowUp=[r.updated_at,...related.map(other=>other.updated_at)].filter(value=>Number.isFinite(Date.parse(value))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
    return {
      ...r,
      lastFollowUp,
      merged_into:rootId(r)!==Number(r.id)?rootId(r):null,
      relatedReports:related,
      created_at: notes.some(n => n.type === 'original_date_unknown') ? null : r.created_at,
      affectedJackets: Number(notes.find(n => n.type === 'affected_jackets')?.value) || Number(r.affected_jackets) || r.affectedJackets || 1,
      order,
      wf: workflow(r, order)
    };
  });
  for (const o of orders) if (!reports.some(r => r.order_id === o.id) && (Number(o.status) === 13 || Number(o.errorSubStatus) > 0)) {
    const r = {
      id: `order:${o.id}`,
      order_id: o.id,
      synthetic: true,
      notes: o.errorNotes || [],
      status: 1,
      created_at: null
    };
    rows.push({
      ...r,
      order: o,
      wf: workflow(r, o)
    });
  }
  return rows;
}
export function filterRows(rows, {
  tab = 'active',
  search = '',
  from = '',
  to = '',
  sort = 'oldest'
}) {
  const time = v => Number.isFinite(Date.parse(v)) ? Date.parse(v) : null;
  return rows.filter(r => (tab === 'all' || r.wf.state === tab) && (!search || [r.order_id, r.order.customer, r.order.phone, r.error_description, r.wf.kind, ...[...array(r.notes),...array(r.relatedReports).flatMap(related=>array(related.notes))].map(n => [n.text,n.phone,n.label].filter(Boolean).join(' '))].join(' ').toLowerCase().includes(search.toLowerCase())) && (!from || time(r.created_at) !== null && time(r.created_at) >= time(from + 'T00:00:00')) && (!to || time(r.created_at) !== null && time(r.created_at) <= time(to + 'T23:59:59.999'))).sort((a, b) => {
    const av = time(sort === 'updated' ? a.lastFollowUp||a.updated_at : a.created_at),
      bv = time(sort === 'updated' ? b.lastFollowUp||b.updated_at : b.created_at);
    if (av === null) return bv === null ? String(a.id).localeCompare(String(b.id)) : 1;
    if (bv === null) return -1;
    return (sort === 'oldest' ? av - bv : bv - av) || String(a.id).localeCompare(String(b.id));
  });
}
export function photos(report) {
  return [...array(report.relatedReports).flatMap(photos),...(report.error_image_url ? [{
    url: report.error_image_url,
    caption: ''
  }] : []), ...array(report.notes).flatMap(n => array(n.photos))].filter(p => /^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(p.url || ''));
}
export async function persistReport(client, report, patch) {
  reportArrays(report);
  if(report.merged_into||mergedTarget(report))throw new Error('البلاغ مدمج؛ افتح البلاغ الأساسي / Report merged; open the main report');
  if (report.id === undefined || report.id === null) throw new Error('Report ID missing');
  let query = client.from('jacket_errors').update(patch).eq('id', report.id);
  if (report.updated_at) query = query.eq('updated_at', report.updated_at);
  // Keep filters bounded even when notes contain several megabytes of images.
  // The DB-generated fingerprint catches edits from older clients too.
  if (report.content_fingerprint) query = query.eq('content_fingerprint', report.content_fingerprint);else if (Object.hasOwn(report, 'storedNotes')) throw new Error('حدّث الصفحة بعد تحديث قاعدة البيانات / Reload after the database upgrade');
  const {
    data,
    error
  } = await query.select().single();
  if (error?.code === 'PGRST116') throw new Error('تغير البلاغ لدى مستخدم آخر. حدّث الصفحة ثم حاول مجدداً / Report changed. Refresh and retry');
  if (error) throw error;
  if (!data) throw new Error('لم يتم الحفظ / Changes were not saved');
  return normalizeReport(data);
}
export async function insertReport(client,payload,request) {
  if(!request?.key||!request?.signature)throw new Error('Submission identity missing');
  const entry={...payload,submission_key:request.key};
  let result=await client.from('jacket_errors').insert(entry).select().single();
  if(result.error&&['PGRST204','42703'].includes(result.error.code)&&String(result.error.message).includes('affected_jackets')){
    const legacy={...entry};delete legacy.affected_jackets;
    legacy.notes=JSON.stringify([...array(payload.notes),{type:'affected_jackets',value:payload.affected_jackets}]);
    result=await client.from('jacket_errors').insert(legacy).select().single();
  }
  if(result.error){
    // A failed HTTP response can follow a committed insert. Read by the same
    // unique request key; never upsert/overwrite the already-saved report.
    try{
      const recovered=await client.from('jacket_errors').select('*').eq('submission_key',request.key).single();
      if(!recovered.error&&recovered.data?.id)return {...normalizeReport(recovered.data),submissionExisting:true};
    }catch{/* Preserve the original error and the draft for retry. */}
    throw result.error;
  }
  if(!result.data?.id)throw new Error('No saved report');
  return {...normalizeReport(result.data),submissionExisting:false};
}
