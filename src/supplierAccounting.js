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

// All supplier costs use AED. Missing settings preserve the general type rates.
export function supplierOrderCost(order, supplier, typeCosts = {}) {
  const settings = supplier?.accountingSettings || {};
  const generalRate = Number(typeCosts[order.orderType]) > 0 ? Number(typeCosts[order.orderType]) : Number(typeCosts._default) || 0;
  const unitRate = settings.useSupplierRate ? Number(supplier.unitPrice) || 0 : generalRate;
  const extraRate = settings.chargeExtras ? Number(settings.extraLogoRate) || 0 : 0;
  const baseCost = Math.round((Number(order.jackets) || 0) * unitRate * 100) / 100;
  const extrasCost = Math.round((Number(order.extras) || 0) * extraRate * 100) / 100;
  return {unitRate, extraRate, baseCost, extrasCost, total: Math.round((baseCost + extrasCost) * 100) / 100};
}
