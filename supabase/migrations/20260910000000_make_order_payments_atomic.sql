alter table public.payments
  add column if not exists request_id text;

create unique index if not exists payments_request_id_key
  on public.payments (request_id);

create or replace function public.sync_order_paid_from_payment_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.orders
      set paid = coalesce(paid,0) + new.amount, updated = current_date
      where id = new.order_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.orders
      set paid = coalesce(paid,0) - old.amount, updated = current_date
      where id = old.order_id;
    return old;
  end if;

  if new.order_id = old.order_id then
    update public.orders
      set paid = coalesce(paid,0) + new.amount - old.amount, updated = current_date
      where id = new.order_id;
  else
    update public.orders
      set paid = coalesce(paid,0) - old.amount, updated = current_date
      where id = old.order_id;
    update public.orders
      set paid = coalesce(paid,0) + new.amount, updated = current_date
      where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_order_paid_after_payment_change on public.payments;
create trigger sync_order_paid_after_payment_change
after insert or update of amount,order_id or delete on public.payments
for each row execute function public.sync_order_paid_from_payment_change();
