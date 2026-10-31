-- Retry identity only: no changes to existing reports, endpoints, grants or policies.
alter table public.jacket_errors add column if not exists submission_key uuid;
create unique index if not exists jacket_errors_submission_key_unique
  on public.jacket_errors(submission_key) where submission_key is not null;
notify pgrst,'reload schema';
