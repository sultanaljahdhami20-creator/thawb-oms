alter table public.financial_settings
  add column delivery_rate_omr numeric(12,3) not null default 2
  check (delivery_rate_omr >= 0);

-- Nullable snapshots keep pre-feature reports unchanged, rather than inventing historical costs.
alter table public.financial_reports
  add column delivery_summary jsonb,
  add column profit_summary jsonb;
