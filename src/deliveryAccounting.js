export const DEFAULT_DELIVERY_RATE = 2;
export const roundOMR = value => Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;

export function deliverySummary(orders, rate = DEFAULT_DELIVERY_RATE) {
  if (!Number.isFinite(rate) || rate < 0) throw new Error('Invalid delivery rate');
  const included = orders.filter(order => order.deliveryPaid !== false);
  // Status 13 is "Has Issue", not a later shipping stage.
  const paidCount = included.filter(order => [11, 12].includes(Number(order.status))).length;
  const remainingCount = included.length - paidCount;
  return {
    count: included.length, paidCount, remainingCount,
    total: roundOMR(included.length * rate),
    paid: roundOMR(paidCount * rate),
    remaining: roundOMR(remainingCount * rate),
  };
}

export function expectedNetProfit({sales, supplierCost, expenses, refunds, deliveryCost}) {
  return roundOMR(sales - supplierCost - expenses - refunds - deliveryCost);
}
