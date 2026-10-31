import { memo } from "react";
import { Badge } from "./UIControls";

// Keep unchanged rows out of dialog, search-field and individual selection updates.
export default memo(function OrderRow({o,i,selected,bc,tm,t,rtl,label,badgeColor,badgeBackground,deliveryLabel,navyLight,greenLight,fmt,canPay,canEdit,canDelete,onView,onPay,onUrgent,onDelete,onSelectionChange}) {
  return (<tr key={o.id} style={{borderTop:"1px solid "+bc,background:selected?"#EEF2FF":o.isUrgent?"#FFF7ED":i%2===0?"transparent":"rgba(0,0,0,0.01)"}}>
                      <td style={{padding:"12px 14px"}}><input type="checkbox" checked={selected} onChange={e=>onSelectionChange(p=>e.target.checked?[...p,o.id]:p.filter(x=>x!==o.id))} style={{width:16,height:16,cursor:"pointer"}}/></td>
                      <td style={{padding:"12px 14px",fontWeight:700,color:"#E05E5C"}}>{o.isUrgent&&<span style={{marginLeft:4,marginRight:4}}>⚡</span>}{o.id}</td>
                      <td style={{padding:"12px 14px",fontWeight:600}}>{o.customer||"--"}</td>
                      <td style={{padding:"12px 14px",color:tm}}>{o.phone}</td>
                      <td style={{padding:"12px 14px",color:tm}}>{o.date}</td>
                      <td style={{padding:"12px 14px"}}>{o.jackets}</td>
                      <td style={{padding:"12px 14px",color:tm}}>{o.extras||0}</td>
                      <td style={{padding:"12px 14px",fontWeight:600}}>{fmt(o.total)}</td>
                      <td style={{padding:"12px 14px",color:"#2D7A4F",fontWeight:600}}>{fmt(o.paid)}</td>
                      <td style={{padding:"12px 14px",color:o.total-o.paid>0?"#E05E5C":"#2D7A4F",fontWeight:700}}>{fmt(o.total-o.paid)}</td>
                      <td style={{padding:"12px 14px"}}><Badge label={label} color={badgeColor} background={badgeBackground}/></td>
                      <td style={{padding:"12px 14px",color:tm,fontSize:12}}>{o.supplier||"--"}</td>
                      <td style={{padding:"12px 14px",color:tm,fontSize:12}}>{o.deliveryArea||"--"}</td>
                      <td style={{padding:"12px 14px",fontSize:12,fontWeight:700,color:o.deliveryPaid===false?"#B45309":"#2D7A4F",whiteSpace:"nowrap"}}>{deliveryLabel}</td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <button onClick={()=>onView(o)} style={{background:navyLight,color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>{t.view}</button>
                          {canPay&&<button onClick={()=>onPay(o)} style={{background:greenLight,color:"#2D7A4F",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>{t.pay}</button>}
                          {canEdit&&<button onClick={()=>onUrgent(o)} style={{background:o.isUrgent?"#FFF7ED":"transparent",border:"1px solid "+(o.isUrgent?"#F97316":bc),borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:12,fontWeight:700,color:o.isUrgent?"#F97316":tm}} title={o.isUrgent?(rtl?"إلغاء المستعجل":"Remove urgent"):(rtl?"تعليم مستعجل":"Mark urgent")}>⚡</button>}
                          {canDelete&&<button onClick={()=>onDelete(o)} style={{background:"#FEF2F2",color:"#E05E5C",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>🗑</button>}
                        </div>
                      </td>
                    </tr>);
});
