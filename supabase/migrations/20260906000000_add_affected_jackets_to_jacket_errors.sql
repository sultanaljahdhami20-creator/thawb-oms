alter table public.jacket_errors
  add column if not exists affected_jackets integer not null default 1;

alter table public.jacket_errors
  drop constraint if exists jacket_errors_affected_jackets_positive;

alter table public.jacket_errors
  add constraint jacket_errors_affected_jackets_positive
  check (affected_jackets > 0);

comment on column public.jacket_errors.affected_jackets is
  'Number of jackets affected by this error report. Must not exceed the order total.';

create or replace function public.validate_jacket_error_affected_count()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  order_jackets integer;
begin
  select greatest(1, coalesce(o.jackets, 1)::integer)
    into order_jackets
    from public.orders as o
   where o.id = new.order_id;

  if order_jackets is null then
    raise exception 'Order % does not exist', new.order_id;
  end if;

  if new.affected_jackets > order_jackets then
    raise exception 'Affected jackets (%) cannot exceed order jackets (%)',
      new.affected_jackets, order_jackets;
  end if;

  return new;
end;
$$;

drop trigger if exists jacket_errors_validate_affected_count on public.jacket_errors;

create trigger jacket_errors_validate_affected_count
before insert or update of affected_jackets, order_id
on public.jacket_errors
for each row
execute function public.validate_jacket_error_affected_count();
