alter table public.orders
  add column if not exists error_dismissed_at timestamptz;

comment on column public.orders.error_dismissed_at is
  'Reports created at or before this time are retained but excluded from the errors list. A new report or Has Issue status reopens the order.';
