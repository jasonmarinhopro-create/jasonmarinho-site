-- Hôtels, conciergeries haut de gamme, gîtes (24/10/2026, Jason : « être présent
-- aussi sur les requêtes photographe hôtel, conciergerie haut de gamme »).
-- 1. Demandes « Trouver un pro » : type d'hébergement (logement Airbnb / Booking,
--    hôtel ou résidence, conciergerie, gîte ou chambre d'hôtes). Vide = demande
--    d'avant (logement d'un hôte).
-- 2. Fiches des pros : clientèles pour lesquelles ils travaillent (mêmes clés),
--    filtre de l'annuaire et priorité dans l'envoi des demandes.
-- Liste : jason-app/lib/pros/clienteles.ts (= scripts/lib/pro-clienteles.mjs).

alter table public.demandes_hotes add column if not exists etablissement text;
alter table public.photographers add column if not exists clienteles text[] not null default '{}';
alter table public.cleaners add column if not exists clienteles text[] not null default '{}';

-- Vues publiques : mêmes colonnes qu'à la migration 153, clienteles ajoutée à la fin
create or replace view public.public_photographers_view with (security_invoker = true) as
 select id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite, tarif_min, tarif_max, portfolio_url,
    instagram_handle,
    case when telephone_public then telephone end as telephone,
    tier, views_count, contacts_count, created_at, logo_url, reseaux, portfolio_photos, formules, villes_couvertes,
    deroule, metier, options, video_url, clienteles
   from public.photographers
  where status = 'active' and is_public = true and slug is not null;

create or replace view public.public_cleaners_view with (security_invoker = true) as
 select id, slug, full_name, pseudo, ville, zone_couverte, bio, tarif_forfait_min, tarif_forfait_max, tarif_heure,
    prestations, equipe_type, logements_geres, delai_reservation, langues, assurance_rc_pro, siret, site_url,
    instagram_handle,
    case when telephone_public then telephone end as telephone,
    tier, views_count, contacts_count, created_at, logo_url, reseaux, portfolio_photos, formules, villes_couvertes, deroule,
    clienteles
   from public.cleaners
  where status = 'active' and is_public = true and slug is not null;

grant select on public.public_photographers_view to anon, authenticated, service_role;
grant select on public.public_cleaners_view to anon, authenticated, service_role;
