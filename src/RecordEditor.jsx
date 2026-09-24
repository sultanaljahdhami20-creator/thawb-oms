import {useRef,useState} from 'react';

// A shared, labelled editor for corrections to existing records.
export default function RecordEditor({title,fields,values,onSave,onClose,rtl}) {
  const [form,setForm]=useState(values);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const lock=useRef(false);
  const submit=async event=>{
    event.preventDefault();
    if(lock.current)return;
    lock.current=true;setSaving(true);setError('');
    try {
      const payload=Object.fromEntries(fields.map(f=>[f.key,f.type==='number'?Number(form[f.key]):form[f.key]??'']));
      await onSave(payload);onClose();
    } catch(e) {setError(e.message||String(e));}
    finally {lock.current=false;setSaving(false);}
  };
  const input={width:'100%',boxSizing:'border-box',padding:10,border:'1px solid #CBD5E1',borderRadius:8,background:'#fff',color:'#172033',font:'inherit'};
  return <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(15,23,42,.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="record-editor-title" dir={rtl?'rtl':'ltr'} style={{background:'#fff',color:'#172033',padding:24,borderRadius:16,width:540,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto',boxSizing:'border-box'}}>
      <h2 id="record-editor-title" style={{marginTop:0}}>{title}</h2>
      <fieldset disabled={saving} style={{border:0,padding:0,margin:0}}>
        {fields.map(f=><div key={f.key} style={{marginBottom:14,fontSize:13,fontWeight:700}}><label htmlFor={`record-edit-${f.key}`} style={{display:"block",marginBottom:5}}>{rtl?f.ar:f.en}</label>
          {f.options?<select id={`record-edit-${f.key}`} value={form[f.key]??''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required={f.required} style={input}>{f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:f.type==='textarea'?<textarea id={`record-edit-${f.key}`} value={form[f.key]??''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required={f.required} rows={3} style={input}/>:<input id={`record-edit-${f.key}`} autoFocus={f===fields[0]} type={f.type||'text'} value={form[f.key]??''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required={f.required} min={f.min} max={f.max} step={f.step??(f.type==='number'?'any':undefined)} style={input}/>}
        </div>)}
      </fieldset>
      {error&&<p role="alert" style={{color:'#B91C1C'}}>{error}</p>}
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button type="button" disabled={saving} onClick={onClose} style={{...input,width:'auto'}}>{rtl?'إلغاء':'Cancel'}</button><button disabled={saving} style={{...input,width:'auto',background:'#202F4D',color:'#fff'}}>{saving?(rtl?'جارٍ الحفظ…':'Saving…'):(rtl?'حفظ التعديلات':'Save changes')}</button></div>
    </form>
  </div>;
}
