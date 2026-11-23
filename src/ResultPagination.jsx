export default function ResultPagination({page, pages, onChange, rtl}) {
  if (pages <= 1) return null;
  return <nav aria-label={rtl?'صفحات النتائج':'Result pages'} style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12,padding:14}}>
    <button type="button" disabled={page===1} onClick={()=>onChange(page-1)}>{rtl?'السابق':'Previous'}</button>
    <span>{page} / {pages}</span>
    <button type="button" disabled={page===pages} onClick={()=>onChange(page+1)}>{rtl?'التالي':'Next'}</button>
  </nav>;
}
