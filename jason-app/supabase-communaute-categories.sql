-- ============================================================
-- Migration : catégories libres + intégration des 7 groupes constants
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Ajout des colonnes manquantes
alter table public.community_groups
  add column if not exists category   text default 'Général',
  add column if not exists sort_order int  default 0,
  add column if not exists tag        text;  -- étiquette affichée sur la carte (ex: "Hôtes LCD")

-- 2. Index pour le tri et filtrage par catégorie
create index if not exists community_groups_category_idx  on public.community_groups(category);
create index if not exists community_groups_sort_order_idx on public.community_groups(sort_order);

-- 3. Insertion des 7 groupes hardcodés (si pas déjà présents par URL)
insert into public.community_groups (name, description, platform, url, members_count, category, sort_order, tag)
values
  -- Groupes Jason & Driing (catégorie spéciale → section mise en avant)
  (
    'Groupe d''entraide entre hôtes',
    'Le groupe principal géré par Jason et Driing. Entraide, conseils et partage d''expériences entre hôtes en location directe.',
    'facebook', 'https://www.facebook.com/groups/locationdirect/', 0,
    'Groupes Jason & Driing', 10, 'Hôtes LCD'
  ),
  (
    'Partager sa location en direct',
    'Publiez vos annonces de location sans commission pour toucher des voyageurs directement, sans passer par les plateformes.',
    'facebook', 'https://www.facebook.com/groups/locationssanscommission/', 0,
    'Groupes Jason & Driing', 11, 'Voyageurs'
  ),
  (
    'Trouver une conciergerie',
    'Groupe dédié aux conciergeries et hôtes qui cherchent à déléguer la gestion de leur bien. Mises en relation directes.',
    'facebook', 'https://www.facebook.com/groups/trouverconciergerie/', 0,
    'Groupes Jason & Driing', 12, 'Conciergeries'
  ),
  (
    'Locations Ski',
    'Spécial montagne et stations de ski. Partagez vos chalets et appartements directement avec les skieurs.',
    'facebook', 'https://www.facebook.com/groups/locationski/', 0,
    'Groupes Jason & Driing', 13, 'Ski'
  ),
  -- Groupes communautaires supplémentaires
  (
    'Gîtes et Chambres d''hôtes',
    'Grand groupe de partage pour gîtes et chambres d''hôtes. Idéal pour toucher des voyageurs cherchant des logements authentiques.',
    'facebook', 'https://www.facebook.com/groups/GitesChambres/', 0,
    'Partager vos locations', 20, null
  ),
  (
    'Location de vacances France',
    'Groupe communautaire pour partager vos locations de vacances et rentrer en contact avec des voyageurs en France.',
    'facebook', 'https://www.facebook.com/groups/1621576811388429/', 0,
    'Partager vos locations', 21, null
  ),
  (
    'Locations Bretagne & Normandie',
    'Groupe régional dédié aux locations saisonnières en Bretagne et Normandie. Partagez vos biens et échangez avec d''autres hôtes de la région.',
    'facebook', 'https://www.facebook.com/groups/581616559233686/', 0,
    'Groupes régionaux', 30, null
  )
on conflict (url) do nothing;

-- Note : si la contrainte unique sur url n'existe pas, ajouter :
-- alter table public.community_groups add constraint community_groups_url_unique unique (url);
-- Puis relancer ce script.

-- ============================================================
-- Usage des tags (champ `tag`) — IMPORTANT pour le filtrage
-- ============================================================
-- Le champ `tag` supporte désormais des valeurs séparées par virgule.
-- Cela permet à un seul groupe de couvrir plusieurs secteurs/régions
-- sans avoir à créer un groupe par ville.
--
-- Exemples :
--   tag = 'Bretagne, Normandie'         → filtre "Bretagne" OU "Normandie"
--   tag = 'Ski, Montagne, Alpes'        → filtre par thème montagne
--   tag = 'Paris, Île-de-France'        → filtre région parisienne
--   tag = 'Hôtes LCD'                   → badge simple (rétro-compatible)
--
-- La barre de recherche utilisateur cherche aussi dans ces tags,
-- donc taper "Bretagne" remonte tous les groupes ayant ce mot
-- dans leur nom, description, catégorie ou tags.
-- ============================================================
