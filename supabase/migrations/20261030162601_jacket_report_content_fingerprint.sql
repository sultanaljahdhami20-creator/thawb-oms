-- Additive concurrency token. Existing report content and access policies stay intact.
-- A generated token also detects edits from older clients that did not stamp updated_at.
-- MD5 detects accidental stale writes; this value is not an authentication credential.
alter table public.jacket_errors
  add column if not exists content_fingerprint text
  generated always as (
    md5(coalesce(notes::text, 'null') || chr(10) || coalesce(status_history::text, 'null'))
  ) stored;

comment on column public.jacket_errors.content_fingerprint is
  'Read-only content comparison token for optimistic concurrency without image data in URLs.';

notify pgrst, 'reload schema';
