import {PERMISSIONS,hasPermission,setPermission} from './permissions';

export default function PermissionEditor({value,onChange,actor,rtl,border,text,muted}) {
  const admin=value.role==='admin';
  const renderOption=p=>{
    const checked=hasPermission(value,p.key);
    const disabled=admin||!hasPermission(actor,p.key);
    return <label key={p.key} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px',border:'1px solid '+border,borderRadius:8,color:disabled?muted:text,cursor:disabled?'default':'pointer',fontSize:13}}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e=>onChange({...value,...(p.key==='dashboard'?{dashboard:e.target.checked}:{perms:setPermission(value,p.key,e.target.checked)})})}/>
      {rtl?p.ar:p.en}
    </label>;
  };
  return <div style={{marginBottom:20}}>
    {admin&&<p style={{fontSize:13,color:muted}}>{rtl?'المدير يملك جميع الصلاحيات تلقائياً. اختر دوراً آخر لتخصيص الصلاحيات.':'Admins have all permissions. Choose another role to customize access.'}</p>}
    <h3 style={{fontSize:14}}>{rtl?'الصلاحيات الأساسية':'Basic permissions'}</h3>
    <div style={{display:'grid',gap:7}}>{renderOption({key:'dashboard',ar:'عرض الرئيسية',en:'View dashboard'})}{PERMISSIONS.filter(p=>p.group==='basic').map(renderOption)}</div>
    <details style={{marginTop:14,border:'1px solid '+border,borderRadius:10,padding:12}}>
      <summary style={{cursor:'pointer',fontWeight:700,fontSize:14}}>{rtl?'إعدادات الصلاحيات المتقدمة':'Advanced permission settings'} · {PERMISSIONS.filter(p=>p.group==='advanced'&&hasPermission(value,p.key)).length}/{PERMISSIONS.filter(p=>p.group==='advanced').length}</summary>
      <p style={{fontSize:12,color:muted,lineHeight:1.7}}>{rtl?'فعّل الميزات التي يحتاجها المستخدم. الصلاحيات المرتبطة تُفعّل تلقائياً. إدارة الموظفين تسمح بمنح صلاحيات يملكها المستخدم فقط، وحسابات المديرين يديرها المدير.':'Enable the features this user needs. Required permissions are enabled automatically. Staff managers can only grant their own permissions; only admins can manage admin accounts.'}</p>
      <div style={{display:'grid',gap:7}}>{PERMISSIONS.filter(p=>p.group==='advanced').map(renderOption)}</div>
    </details>
  </div>;
}
