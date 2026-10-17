-- Photographes ET vidéastes (17/10/2026, retours de pros relayés par Jason).
--  metier    : photo, video ou photo_video (filtre de l'annuaire)
--  options   : vues aériennes (drone), visite 3D, vidéos courtes, crépuscule,
--              mise en scène (filtre de l'annuaire, liste : lib/pros/visuel.ts)
--  video_url : lien vers les vidéos du pro (YouTube, Vimeo, Instagram…),
--              affiché en haut de sa fiche.
-- Rejouable : colonnes « if not exists », vue recréée.

alter table public.photographers add column if not exists metier text not null default 'photo';
alter table public.photographers add column if not exists options text[] not null default '{}';
alter table public.photographers add column if not exists video_url text;

do $$ begin
  alter table public.photographers add constraint photographers_metier_check
    check (metier in ('photo', 'video', 'photo_video'));
exception when duplicate_object then null; end $$;

-- Les fiches existantes : la spécialité choisie à l'inscription dit déjà
-- s'il y a de la vidéo ou du drone (une seule fois : options encore vides).
update public.photographers
   set metier = 'photo_video'
 where metier = 'photo' and options = '{}' and specialite ilike '%vid%o%';
update public.photographers
   set options = array_remove(array[
     case when specialite ilike '%drone%' then 'drone' end,
     case when specialite ilike '%reels%' then 'reels' end,
     case when specialite ilike '%3d%' or specialite ilike '%matterport%' then 'visite_3d' end,
     case when specialite ilike '%mise en sc%' then 'mise_en_scene' end
   ], null)
 where options = '{}' and specialite is not null;

drop view if exists public.public_photographers_view;
create view public.public_photographers_view
  with (security_invoker = true)
  as
select
  id, slug, full_name, pseudo, ville, zone_couverte, bio, specialite,
  tarif_min, tarif_max, portfolio_url, instagram_handle, telephone,
  tier, views_count, contacts_count, created_at, logo_url, reseaux,
  portfolio_photos, formules, villes_couvertes, deroule,
  metier, options, video_url
from public.photographers
where status = 'active'
  and is_public = true
  and slug is not null;

grant select on public.public_photographers_view to anon, authenticated, service_role;
