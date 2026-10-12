-- Fiches des pros façon site vitrine (12/10/2026, demande de Jason) :
--  1. Photos sur la fiche, photographes ET équipes de ménage (6 au plus,
--     compressées dans le navigateur : grande image + vignette).
--  2. Formules (3 au plus), villes couvertes, déroulé en 3 étapes.
--  3. Garde-fou des offres gratuites : storage_usage() donne la place prise
--     par bucket (lu par l'app avant chaque envoi de photo et par la page
--     État de santé), et le bucket refuse tout fichier de plus de 600 Ko.

-- ── 1 et 2. Colonnes ─────────────────────────────────────────────────
alter table public.photographers add column if not exists portfolio_photos text[] not null default '{}';
alter table public.cleaners      add column if not exists portfolio_photos text[] not null default '{}';

alter table public.photographers add column if not exists formules jsonb not null default '[]'::jsonb;
alter table public.cleaners      add column if not exists formules jsonb not null default '[]'::jsonb;
alter table public.photographers add column if not exists villes_couvertes text[] not null default '{}';
alter table public.cleaners      add column if not exists villes_couvertes text[] not null default '{}';
alter table public.photographers add column if not exists deroule jsonb not null default '[]'::jsonb;
alter table public.cleaners      add column if not exists deroule jsonb not null default '[]'::jsonb;

-- Vues publiques lues par le build du site (même méthode que la migration
-- 125 : suppression puis recréation, droits remis explicitement).
drop view if exists public.public_photographers_view;
create view public.public_photographers_view
  with (security_invoker = true)
  as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite,
  tarif_min, tarif_max, portfolio_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at, logo_url, reseaux,
  portfolio_photos, formules, villes_couvertes, deroule
from public.photographers
where status = 'active'
  and is_public = true
  and slug is not null;

drop view if exists public.public_cleaners_view;
create view public.public_cleaners_view
  with (security_invoker = true)
  as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio,
  tarif_forfait_min, tarif_forfait_max, tarif_heure,
  prestations, equipe_type, logements_geres, delai_reservation, langues,
  assurance_rc_pro, siret,
  site_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at, logo_url, reseaux,
  portfolio_photos, formules, villes_couvertes, deroule
from public.cleaners
where status = 'active'
  and is_public = true
  and slug is not null;

grant select on public.public_photographers_view to anon, authenticated, service_role;
grant select on public.public_cleaners_view to anon, authenticated, service_role;

-- ── 3. Garde-fous de stockage ────────────────────────────────────────
-- Bucket public des photos de fiches (créé par la migration 110) : JPEG
-- seulement, 600 Ko au plus par fichier (vérifié par Supabase, même pour
-- les envois par URL signée).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pro-portfolio', 'pro-portfolio', true, 614400, array['image/jpeg'])
on conflict (id) do update set
  public = true,
  file_size_limit = 614400,
  allowed_mime_types = array['image/jpeg'];

-- Place prise par bucket (octets et nombre de fichiers), serveur seulement.
create or replace function public.storage_usage()
returns table (bucket_id text, objects bigint, bytes bigint)
language sql
stable
security definer
set search_path = public, storage
as $$
  select o.bucket_id::text,
         count(*)::bigint,
         coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint
  from storage.objects o
  group by o.bucket_id
$$;
revoke all on function public.storage_usage() from public;
revoke all on function public.storage_usage() from anon;
revoke all on function public.storage_usage() from authenticated;
grant execute on function public.storage_usage() to service_role;
