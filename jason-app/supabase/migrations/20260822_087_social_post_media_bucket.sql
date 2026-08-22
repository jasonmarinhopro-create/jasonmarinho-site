-- Bucket Storage pour les visuels du composeur réseaux sociaux
-- (upload direct depuis /dashboard/admin/social, admin only en pratique
-- mais RLS scopée par utilisateur comme chez-nous-images).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-post-media',
  'social-post-media',
  true,
  8388608,                         -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "social_post_media_public_read" on storage.objects;
create policy "social_post_media_public_read"
  on storage.objects for select
  using (bucket_id = 'social-post-media');

drop policy if exists "social_post_media_insert_own" on storage.objects;
create policy "social_post_media_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'social-post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "social_post_media_delete_own" on storage.objects;
create policy "social_post_media_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'social-post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
