// These checks control app features; database authorization must be enforced separately.
// Existing users retain their basic access; new advanced privileges are opt-in.
export const PERMISSIONS = [
  {key:'orders',group:'basic',ar:'إدارة الطلبات',en:'Manage orders'},
  {key:'payments',group:'basic',ar:'تسجيل مدفوعات العملاء',en:'Record customer payments'},
  {key:'reports',group:'basic',ar:'عرض التقارير',en:'View reports'},
  {key:'suppliers',group:'basic',ar:'إسناد الطلبات للموردين',en:'Assign supplier orders'},
  {key:'errors',group:'advanced',ar:'إدارة حالات الأخطاء',en:'Manage error cases',legacy:'orders'},
  {key:'refunds',group:'advanced',ar:'طلبات التعويض والتعليقات',en:'Refund requests and comments',legacy:'orders'},
  {key:'refundReview',group:'advanced',ar:'مراجعة واعتماد التعويضات وتأكيد دفعها',en:'Review, approve and mark refunds paid',requires:'refunds'},
  {key:'deleteOrders',group:'advanced',ar:'حذف الطلبات',en:'Delete orders',requires:'orders'},
  {key:'renumberOrders',group:'advanced',ar:'تعديل أرقام الطلبات',en:'Renumber orders',requires:'orders'},
  {key:'editPayments',group:'advanced',ar:'تعديل وحذف مدفوعات العملاء',en:'Edit and delete customer payments',requires:'payments'},
  {key:'manageSuppliers',group:'advanced',ar:'إضافة وتعديل وحذف الموردين',en:'Add, edit and delete suppliers',requires:'suppliers'},
  {key:'financialSummary',group:'advanced',ar:'عرض الملخص المالي في الرئيسية',en:'Dashboard financial summary'},
  {key:'expenses',group:'advanced',ar:'إدارة المصاريف',en:'Manage expenses'},
  {key:'accounts',group:'advanced',ar:'الحسابات ودفعات الموردين والأسعار والتقارير المالية',en:'Accounts, supplier payments, rates and financial reports'},
  {key:'settings',group:'advanced',ar:'إعدادات النظام والترقيم ورمز الحماية',en:'System settings, numbering and security PIN'},
  {key:'users',group:'advanced',ar:'إدارة الموظفين ضمن صلاحياتك',en:'Manage staff within your own permissions'},
];
export function hasPermission(user,key) {
  if(!user)return false;
  if(key==='dashboard')return user.role==='admin'||user.dashboard!==false;
  const definition=PERMISSIONS.find(p=>p.key===key);
  if(!definition)return false;
  if(user.role==='admin')return true;
  const allowed=user.perms?.[key] ?? (definition.legacy ? user.perms?.[definition.legacy] : false);
  return allowed===true && (!definition.requires || hasPermission(user,definition.requires));
}
export function setPermission(user,key,value) {
  const perms={...user.perms,[key]:value};
  const parent=PERMISSIONS.find(p=>p.key===key)?.requires;
  if(value&&parent)perms[parent]=true;
  if(!value)for(const p of PERMISSIONS)if(p.requires===key)perms[p.key]=false;
  return perms;
}
export function canManageUser(actor,target) {
  if(!hasPermission(actor,'users'))return false;
  if(actor.role==='admin')return true;
  return !target||(target.role!=='admin'&&target.id!==actor.id&&withinPermissions(actor,target));
}
function withinPermissions(actor,user) {
  return ['dashboard',...PERMISSIONS.map(p=>p.key)].every(key=>(!hasPermission(user,key)&&user.perms?.[key]!==true)||hasPermission(actor,key));
}
export function canSaveUser(actor,target,next) {
  if(!canManageUser(actor,target))return false;
  if(actor.role==='admin')return true;
  if(next.role==='admin')return false;
  return withinPermissions(actor,next);
}
export function initialPage(user) {
  return ['dashboard','orders','errors','refunds','suppliers','reports','expenses','accounts','settings','users'].find(key=>hasPermission(user,key))||'orders';
}
export async function persistUser(client,id,payload,isNew=false) {
  const table=client.from('users');
  const query=isNew?table.insert({id,...payload}):table.update(payload).eq('id',id);
  const {data,error}=await query.select().single();
  if(error)throw error;
  if(!data)throw new Error('User was not saved');
  return data;
}
