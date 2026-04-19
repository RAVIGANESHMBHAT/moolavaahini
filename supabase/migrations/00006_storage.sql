-- ============================================================
-- 00006_storage.sql  –  Supabase Storage for post images
-- ============================================================
-- NOTE: Run this manually in the Supabase SQL editor.
-- The `storage` schema is managed by Supabase and cannot be
-- applied via local migration tooling.
-- ============================================================

-- 1. Create the bucket (alternatively, create it via the Storage UI)
insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict do nothing;

-- 2. Public read – anyone can view uploaded images
create policy "post_images_select_public"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- 3. Authenticated users can upload to their own sub-folder only
--    Path format: {user_id}/{uuid}.{ext}
create policy "post_images_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Users can delete their own uploads
create policy "post_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
