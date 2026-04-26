-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous Phase 5b — Images dans les posts
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

-- Stockage : tableau d'URLs par post (max 3 par post côté app)
alter table public.chez_nous_posts
  add column if not exists images jsonb not null default '[]'::jsonb;

-- Index GIN pour requêtes futures éventuelles
create index if not exists chez_nous_posts_images_idx
  on public.chez_nous_posts using gin (images);

-- ─── Storage bucket ───
-- Important : exécuter aussi via la console Supabase si la commande
-- échoue (selon la version de Postgres). Le bucket doit être public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chez-nous-images',
  'chez-nous-images',
  true,
  5242880,                         -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ─── RLS Storage (policies sur storage.objects) ───
-- Lecture publique : tout le monde peut voir les images du bucket
drop policy if exists "chez_nous_images_public_read" on storage.objects;
create policy "chez_nous_images_public_read"
  on storage.objects for select
  using (bucket_id = 'chez-nous-images');

-- Upload : user authentifié peut uploader dans son propre dossier (user_id en préfixe)
drop policy if exists "chez_nous_images_insert_own" on storage.objects;
create policy "chez_nous_images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'chez-nous-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression : user peut supprimer ses propres images
drop policy if exists "chez_nous_images_delete_own" on storage.objects;
create policy "chez_nous_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'chez-nous-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
