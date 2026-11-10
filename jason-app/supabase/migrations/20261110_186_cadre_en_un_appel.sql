-- Cadre du dashboard (menu, sélecteur d'espace, sélecteur de logement) en un
-- seul appel (10/11/2026, fondations Supabase étape 2 côté hôtes). Avant, à
-- chaque expiration du cache (5 min) : 6 lectures pour les espaces (nombre de
-- logements, fiches photographe / ménage / dépannage, investisseur, projets)
-- et 3 + une par nom de logement pour la liste des logements.
-- Appelée par le service role avec l'identifiant du compte connecté
-- (lib/queries/user-shell.ts), jamais par le navigateur.
create or replace function public.user_shell(p_user uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with owned as (
    select id, nom, created_at from logements where user_id = p_user
  ),
  names as (
    select distinct btrim(logement) n from sejours where user_id = p_user and logement is not null and btrim(logement) <> ''
    union
    select distinct btrim(logement_nom) from contracts where user_id = p_user and logement_nom is not null and btrim(logement_nom) <> ''
  ),
  unmatched as (
    select n from names where lower(n) not in (select lower(btrim(nom)) from owned where nom is not null)
  ),
  matched as (
    select distinct on (lower(u.n)) l.id, l.nom
    from unmatched u join logements l on lower(btrim(l.nom)) = lower(u.n)
    order by lower(u.n), l.created_at
  )
  select jsonb_build_object(
    'logements_count', (select count(*) from owned),
    'ph', (select jsonb_build_object('full_name', full_name, 'pseudo', pseudo, 'slug', slug, 'status', status) from photographers where user_id = p_user limit 1),
    'cl', (select jsonb_build_object('full_name', full_name, 'pseudo', pseudo, 'slug', slug, 'status', status) from cleaners where user_id = p_user limit 1),
    'dp', (select jsonb_build_object('full_name', full_name, 'pseudo', pseudo, 'slug', slug, 'status', status) from depannage_pros where user_id = p_user limit 1),
    'is_investor', coalesce((select is_investor from profiles where id = p_user), false),
    'projects_count', (select count(*) from investor_projects where user_id = p_user),
    'owned', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', nom) order by created_at) from owned), '[]'::jsonb),
    'names', coalesce((select jsonb_agg(n order by n) from names), '[]'::jsonb),
    'matched', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'nom', nom)) from matched), '[]'::jsonb)
  )
$$;

revoke all on function public.user_shell(uuid) from public, anon, authenticated;
grant execute on function public.user_shell(uuid) to service_role;
