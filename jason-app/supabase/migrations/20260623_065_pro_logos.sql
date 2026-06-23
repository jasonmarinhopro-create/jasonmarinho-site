-- ════════════════════════════════════════════════════════════════════
-- Pros annuaire : ajout d'un logo optionnel par fiche
-- ════════════════════════════════════════════════════════════════════
-- Permet au pro (ou à l'admin) d'uploader un logo carré qui apparaîtra
-- sur la liste annuaire (rond 64-80px) et sur la fiche publique
-- (120-160px). Si absent, fallback aux initiales sur fond couleur.
--
-- Storage : bucket public `pro-logos`, path : `{pro_id}/avatar.webp`
-- Taille max : 500 KB applicatif (validation côté upload).
-- ════════════════════════════════════════════════════════════════════

alter table public.photographers
  add column if not exists logo_url text;

alter table public.cleaners
  add column if not exists logo_url text;

-- ── Bucket Storage public ────────────────────────────────────────
-- Si le bucket n'existe pas, on l'insère. Sinon on met juste à jour
-- sa visibilité pour s'assurer qu'il est public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pro-logos',
  'pro-logos',
  true,
  524288,  -- 500 KB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 524288,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ── RLS Storage policies ──────────────────────────────────────────
-- Pas de SELECT broad : bucket public, les URLs directes fonctionnent
-- sans policy (évite le LIST listing — cf. advisor public_bucket_allows_listing).
-- L'INSERT/UPDATE/DELETE est restreint au service_role (upload géré côté
-- server actions admin/dashboard). Pas besoin de policy.

-- ── Views publiques : exposer logo_url ────────────────────────────
drop view if exists public.public_photographers_view;
create view public.public_photographers_view
  with (security_invoker = true)
  as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite,
  tarif_min, tarif_max, portfolio_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at, logo_url
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
  tier, views_count, contacts_count, created_at, logo_url
from public.cleaners
where status = 'active'
  and is_public = true
  and slug is not null;
