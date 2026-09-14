alter table public.orders add column delivery_paid boolean not null default true;

comment on column public.orders.delivery_paid is 'Whether delivery has been paid, independently of the order balance. Defaults to paid for existing and new orders.';
