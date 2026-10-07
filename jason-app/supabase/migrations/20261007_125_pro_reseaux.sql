-- Réseaux sociaux et fiche Google des pros (07/10/2026, demande de Jason) :
-- Facebook, LinkedIn, TikTok, YouTube, Pinterest et lien de la fiche Google,
-- facultatifs, saisis dans Ma fiche et affichés discrètement sur la fiche
-- publique. Liens vérifiés côté serveur (lib/pros/reseaux.ts) et revérifiés
-- au build du site (scripts/lib/pro-reseaux.mjs). Instagram garde
-- instagram_handle.

alter table public.photographers add column if not exists reseaux jsonb not null default '{}'::jsonb;
alter table public.cleaners add column if not exists reseaux jsonb not null default '{}'::jsonb;

-- Vues publiques lues par le build du site (même méthode que la migration
-- 065 : suppression puis recréation, droits remis explicitement).
drop view if exists public.public_photographers_view;
create view public.public_photographers_view
  with (security_invoker = true)
  as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite,
  tarif_min, tarif_max, portfolio_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at, logo_url, reseaux
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
  tier, views_count, contacts_count, created_at, logo_url, reseaux
from public.cleaners
where status = 'active'
  and is_public = true
  and slug is not null;

grant select on public.public_photographers_view to anon, authenticated, service_role;
grant select on public.public_cleaners_view to anon, authenticated, service_role;
