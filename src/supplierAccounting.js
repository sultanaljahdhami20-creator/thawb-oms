// Opening balances share the existing account ledger. Reserved method values
// distinguish non-cash balances from payments without changing legacy records.
export const isSupplierDebt = entry => ['Opening Debt', 'Opening Credit'].includes(entry.method);
export function supplierEntryLabel(entry, rtl) {
  if(entry.method==='Opening Debt')return rtl?'دين سابق علينا للمورد':'Previous debt payable';
  if(entry.method==='Opening Credit')return rtl?'دين سابق لنا على المورد':'Previous debt receivable';
  if(entry.method==='Supplier Refund')return rtl?'مبلغ مستلم من المورد':'Supplier refund received';
  return entry.method||'--';
}
export function supplierAccountTotals(entries, supplier) {
  return entries.filter(p=>supplier===undefined||p.supplier===supplier).reduce((totals,p)=>{
    const amount=Number(p.amount)||0;
    if(isSupplierDebt(p))totals.debt+=p.method==='Opening Credit'?-amount:amount;
    else totals.paid+=p.method==='Supplier Refund'?-amount:amount;
    return totals;
  },{paid:0,debt:0});
}
