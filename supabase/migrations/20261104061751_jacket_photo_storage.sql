-- Private, immutable photo objects. The application currently accesses report
-- data as anon (its staff login is not Supabase Auth). Match that existing
-- access model; do not grant object update/delete or expose a public bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('jacket-photos','jacket-photos',false,1048576,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Read jacket photos using existing report access"
on storage.objects for select to anon, authenticated
using (bucket_id = 'jacket-photos' and name ~ '^[a-f0-9]{64}\.(jpeg|png|webp)$');
create policy "Upload immutable jacket photos"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'jacket-photos' and name ~ '^[a-f0-9]{64}\.(jpeg|png|webp)$');
