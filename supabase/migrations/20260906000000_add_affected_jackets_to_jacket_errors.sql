alter table public.jacket_errors
  add column if not exists affected_jackets integer not null default 1;

alter table public.jacket_errors
  drop constraint if exists jacket_errors_affected_jackets_positive;

alter table public.jacket_errors
  add constraint jacket_errors_affected_jackets_positive
  check (affected_jackets > 0);

comment on column public.jacket_errors.affected_jackets is
  'Number of jackets affected by this error report. Must not exceed the order total.';
