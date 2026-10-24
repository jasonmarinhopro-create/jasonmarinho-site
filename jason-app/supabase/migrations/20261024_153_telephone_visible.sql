-- Téléphone affiché sur la fiche publique, au choix du pro (24/10/2026, Jason :
-- « ajoute la partie numéro de téléphone visible sur le formulaire de la fiche »).
-- Avant : le numéro saisi à l'inscription n'était jamais montré aux hôtes sur
-- les fiches photographes, mais l'était (dans les données structurées de la
-- page) sur les fiches ménage, sans que le pro l'ait choisi. Maintenant, les
-- vues publiques ne le donnent que si le pro a coché « Afficher mon numéro ».
-- Par défaut : non affiché (y compris pour les fiches existantes).

alter table public.photographers add column if not exists telephone_public boolean not null default false;
alter table public.cleaners add column if not exists telephone_public boolean not null default false;

-- Mêmes colonnes et même ordre qu'avant (create or replace view), seule
-- l'expression du téléphone change. security_invoker et droits conservés.
create or replace view public.public_photographers_view with (security_invoker = true) as
 select id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite, tarif_min, tarif_max, portfolio_url,
    instagram_handle,
    case when telephone_public then telephone end as telephone,
    tier, views_count, contacts_count, created_at, logo_url, reseaux, portfolio_photos, formules, villes_couvertes,
    deroule, metier, options, video_url
   from public.photographers
  where status = 'active' and is_public = true and slug is not null;

create or replace view public.public_cleaners_view with (security_invoker = true) as
 select id, slug, full_name, pseudo, ville, zone_couverte, bio, tarif_forfait_min, tarif_forfait_max, tarif_heure,
    prestations, equipe_type, logements_geres, delai_reservation, langues, assurance_rc_pro, siret, site_url,
    instagram_handle,
    case when telephone_public then telephone end as telephone,
    tier, views_count, contacts_count, created_at, logo_url, reseaux, portfolio_photos, formules, villes_couvertes, deroule
   from public.cleaners
  where status = 'active' and is_public = true and slug is not null;

grant select on public.public_photographers_view to anon, authenticated, service_role;
grant select on public.public_cleaners_view to anon, authenticated, service_role;
