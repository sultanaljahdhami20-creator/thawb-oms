// Status IDs can arrive as numbers or strings in older/imported records.
export function filterOrders(orders, {search = '', statuses = [], suppliers = [], urgentOnly = false, from = '', to = '', type = 'all'} = {}) {
  const query = String(search).trim().toLowerCase();
  const statusIds = new Set(statuses.map(Number));
  const supplierNames = new Set(suppliers);
  return orders.filter(order => {
    if (query && ![order.id, order.customer, order.phone].some(value => String(value ?? '').toLowerCase().includes(query))) return false;
    if (statusIds.size && !statusIds.has(Number(order.status))) return false;
    if (supplierNames.size && !supplierNames.has(order.supplier)) return false;
    if (urgentOnly && !order.isUrgent) return false;
    if ((from || to) && !order.date) return false;
    if (from && order.date < from) return false;
    if (to && order.date > to) return false;
    if (type === 'outstanding' && Number(order.total) - Number(order.paid) <= 0) return false;
    if (type === 'delivered' && Number(order.status) !== 12) return false;
    return true;
  });
}

export function resultPage(rows, requestedPage, pageSize = 50) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(1, Math.min(requestedPage, pages));
  return {page, pages, rows: rows.slice((page - 1) * pageSize, page * pageSize)};
}

// Bound even a transport that never settles; abort releases the network request too.
export async function loadQuery(query, timeoutMs = 20000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(query.abortSignal(controller.signal)),
      new Promise((_, reject) => { timer = setTimeout(() => {
        reject(new Error('Data request timed out. Please retry.'));
        controller.abort();
      }, timeoutMs); }),
    ]);
  } catch (error) {
    return {data: null, error};
  } finally {
    clearTimeout(timer);
  }
}
