-- Runs once supabase/storage-api has applied its own schema migrations
-- (so storage.buckets.public and storage.objects exist). Idempotent.

insert into storage.buckets (id, name, public)
values ('case-photos', 'case-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "case_photos_insert_own" on storage.objects;
create policy "case_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'case-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "case_photos_select_all" on storage.objects;
create policy "case_photos_select_all"
  on storage.objects for select to authenticated
  using (bucket_id = 'case-photos');

drop policy if exists "case_photos_delete_own" on storage.objects;
create policy "case_photos_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'case-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
