export default function DeliverySummary({summary, rtl, format, background, border, text, muted}) {
  return <section style={{marginBottom:20}} aria-label={rtl?"حسابات التوصيل":"Delivery accounts"}>
    <h3 style={{fontSize:15,margin:"0 0 10px"}}>{rtl?"حسابات التوصيل":"Delivery accounts"}</h3>
    <p style={{fontSize:12,color:muted,margin:"0 0 12px"}}>{rtl?"تشمل «التوصيل مدفوع» فقط. يُعتبر التوصيل مدفوعاً للشركة عند «جاري الشحن» أو «تم التسليم».":"Only orders with delivery paid are included. Shipping and delivered orders count as paid to the carrier."}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
      {[
        [rtl?"إجمالي تكلفة التوصيل":"Total delivery cost",summary.total,summary.count],
        [rtl?"المدفوع للتوصيل (حسب الحالة)":"Delivery paid (by status)",summary.paid,summary.paidCount],
        [rtl?"المتبقي دفعه للتوصيل":"Remaining delivery cost",summary.remaining,summary.remainingCount],
      ].map(([label,amount,count])=><div key={label} style={{background,border:"1px solid "+border,borderRadius:12,padding:18}}>
        <div style={{fontSize:12,color:muted,marginBottom:6}}>{label}</div>
        <strong style={{fontSize:23,color:text}}>{format(amount)}</strong>
        <div style={{fontSize:12,color:muted,marginTop:6}}>{count} {rtl?"طلب":"orders"}</div>
      </div>)}
    </div>
  </section>;
}
