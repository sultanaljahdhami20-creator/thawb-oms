import { memo } from 'react';

// Stable component types keep existing table DOM when unrelated dialogs update.
export const Badge = memo(function Badge({label,color,background}) {
  return <span className="ui-badge" style={{background,color,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{label}</span>;
});

export function Btn(props) {
  return <button {...props} style={{border:'none',borderRadius:8,padding:'9px 18px',fontWeight:700,cursor:'pointer',fontSize:13,...props.style}}/>;
}
