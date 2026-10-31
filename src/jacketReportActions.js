import {array,normalizeReport,mergedTarget,reportArrays,persistReport} from './jacketWorkflow.js';
export function normalizePhone(value='') {
  return String(value).replace(/[٠-٩۰-۹]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)>=0?'٠١٢٣٤٥٦٧٨٩'.indexOf(c):'۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).trim();
}
export function validContactPhone(value) {
  const phone=normalizePhone(value);
  return /^\+?[\d\s()-]+$/.test(phone)&&phone.replace(/\D/g,'').length>=7&&phone.replace(/\D/g,'').length<=15;
}
export function additionalContacts(report) {
  const seen=new Set();
  return [...array(report.notes),...array(report.relatedReports).flatMap(r=>array(r.notes))].filter(n=>{
    if(n.type!=='contact'||!n.phone)return false;
    const key=normalizePhone(n.phone).replace(/\D/g,'');if(seen.has(key))return false;seen.add(key);return true;
  });
}
export function matchingReports(reports,orderId,description,count) {
  const text=String(description||'').trim().toLowerCase();
  return reports.filter(r=>!mergedTarget(r)&&r.order_id===orderId&&String(r.error_description||'').trim().toLowerCase()===text&&Number(r.affectedJackets??r.affected_jackets??array(r.notes).find(n=>n.type==='affected_jackets')?.value??1)===Number(count));
}
export async function submissionSignature(payload) {
  const notes=array(payload.notes);
  const fields=[payload.order_id,payload.jacket_owner||'',payload.jacket_type||'',payload.jacket_size||'',String(payload.error_description||'').trim(),Number(payload.affected_jackets),notes.find(n=>n.type==='workflow')?.kind||'',...notes.filter(n=>n.type==='contact').map(n=>normalizePhone(n.phone)),...notes.flatMap(n=>array(n.photos)).map(p=>[p.url,p.caption])];
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(fields)));
  return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function submissionRequest(signature,forceNew=false,storage) {
  try{storage??=globalThis.sessionStorage;}catch{/* Storage is optional. */}
  const cacheKey='thawb-jacket-submission:'+signature+(forceNew?':independent':'');
  let saved;try{saved=JSON.parse(storage?.getItem(cacheKey)||'null');}catch{/* Private browser storage may be unavailable. */}
  if(saved?.key&&Date.now()-saved.at<86400000)return {...saved,signature,forceNew,cacheKey};
  const request={key:crypto.randomUUID(),at:Date.now(),signature,forceNew,cacheKey};
  try{storage?.setItem(cacheKey,JSON.stringify(request));}catch{/* The in-memory request still protects retries. */}
  return request;
}
export async function mergeReports(client,source,target,by) {
  if(!source||!target||Number(source.id)<=Number(target.id)||source.order_id!==target.order_id||mergedTarget(target))throw new Error('اختر البلاغ الأقدم المطابق / Choose the matching older report');
  const {data:current,error}=await client.from('jacket_errors').select('*').eq('id',target.id).single();
  if(error)throw error;
  if(!current||current.content_fingerprint!==target.content_fingerprint||mergedTarget(current))throw new Error('تغير البلاغ الأساسي؛ حدّث الصفحة / Main report changed; refresh');
  const stored=reportArrays(source),now=new Date().toISOString();
  const entry={type:'duplicate_link',target_id:target.id,by,at:now};
  const saved=await persistReport(client,source,{notes:JSON.stringify([...stored.notes,entry]),status_history:JSON.stringify([...stored.history,{...entry,note:'ربط بلاغ مكرر / Duplicate report linked'}]),updated_at:now});
  return {source:saved,target:normalizeReport(current)};
}
