// The payments trigger owns the paid total; never seed it with the deposit too.
export async function createOrderWithPayment(client, order, by, note = 'Initial') {
  const amount = Number(order.paid ?? 0);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid paid amount');
  const savedOrder = {...order, paid: 0, payments: []};
  const {error} = await client.from('orders').insert({...order, paid: 0});
  if (error) throw error;
  if (amount === 0) return {order: savedOrder, paymentError: null};

  // If this step fails, keep the created order visible and report the failure.
  // Do not invite retrying order creation or display a payment that was not saved.
  try {
    const {data, error: paymentError} = await client.from('payments').insert({
      order_id: order.id, amount, by, ref: '', note, date: order.date,
    }).select().single();
    if (paymentError) throw paymentError;
    savedOrder.payments = [{...data, amount: Number(data.amount)}];
    savedOrder.paid = Number(data.amount);
    return {order: savedOrder, paymentError: null};
  } catch (paymentError) {
    return {order: savedOrder, paymentError};
  }
}
