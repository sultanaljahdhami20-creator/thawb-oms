-- Matches the applied cloud migration; legacy suppliers retain general rates.
alter table public.suppliers add column if not exists accounting_settings jsonb not null default '{}'::jsonb;
