import { memo } from 'react';

// Stable component types keep existing table DOM when unrelated dialogs update.
export const Badge = memo(function Badge({label,color,background}) {
  return <span className="ui-badge" style={{background,color,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{label}</span>;
});

export function Btn(props) {
  return <button {...props} style={{border:'none',borderRadius:8,padding:'9px 18px',fontWeight:700,cursor:'pointer',fontSize:13,...props.style}}/>;
}

export function MultiFilter({label, allLabel, selected, onChange, options, style}) {
  const selectedLabel = options.find(option => option.value === selected[0])?.label;
  const closeOnBlur = event => {
    if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  };
  const closeOnEscape = event => {
    if (event.key !== 'Escape' || !event.currentTarget.open) return;
    event.preventDefault();
    event.currentTarget.querySelector('summary').focus();
    event.currentTarget.open = false;
  };

  return (
    <details style={{position:'relative'}} onBlur={closeOnBlur} onKeyDown={closeOnEscape}>
      <summary style={{...style,cursor:'pointer'}}>
        {selected.length > 1 ? `${label} (${selected.length})` : selectedLabel ?? allLabel}
      </summary>
      <div role="group" aria-label={label} style={{
        ...style, position:'absolute', insetInlineStart:0, marginTop:4, zIndex:5,
        minWidth:'100%', width:'max-content', maxWidth:'min(250px, 70vw)',
        maxHeight:240, overflowY:'auto', boxShadow:'0 6px 20px #0002',
      }}>
        <button type="button" onClick={()=>onChange([])} style={{
          display:'block', width:'100%', textAlign:'start', padding:'6px 0',
          background:'transparent', border:0, color:'inherit', font:'inherit', cursor:'pointer',
          fontWeight:selected.length ? 400 : 700,
        }}>{allLabel}</button>
        {options.map(({value,label:optionLabel})=>(
          <label key={value} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',cursor:'pointer'}}>
            <input type="checkbox" checked={selected.includes(value)} onChange={event=>{
              onChange(event.target.checked ? [...selected,value] : selected.filter(item=>item!==value));
            }} />
            {optionLabel}
          </label>
        ))}
      </div>
    </details>
  );
}
