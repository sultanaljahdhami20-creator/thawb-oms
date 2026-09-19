// Keep historical reports, but exclude reports dismissed by the user.
export function isErrorOrder(order, reports) {
  if (Number(order.status) === 13 || Number(order.errorSubStatus) > 0) return true;
  return reports.some(report => report.order_id === order.id && (
    !order.error_dismissed_at || new Date(report.created_at) > new Date(order.error_dismissed_at)
  ));
}

export async function dismissOrderError(client, order, status) {
  if (!Number.isInteger(status) || status < 1 || status > 12) {
    throw new Error('Select a valid order status');
  }
  const now = new Date().toISOString();
  const {data, error} = await client.from('orders').update({
    status,
    error_sub_status: 0,
    error_dismissed_at: now,
    updated: now.slice(0, 10),
  }).eq('id', order.id).select('id,status,error_sub_status,error_dismissed_at,updated').single();
  if (error) throw error;
  if (!data) throw new Error('Order was not updated');
  return {...data, errorSubStatus: data.error_sub_status};
}
