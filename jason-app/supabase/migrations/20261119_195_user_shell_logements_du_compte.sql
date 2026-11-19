-- user_shell : logements retrouvés par nom limités au compte (19/11/2026).
--
-- Avant : la clé « matched » cherchait les logements de TOUS les comptes dont
-- le nom correspondait à un nom de séjour ou de contrat de l'hôte ; le nom et
-- l'identifiant d'un logement d'un autre hôte pouvaient alors apparaître dans
-- son sélecteur de logement (0 cas en base le 19/11/2026).
-- Maintenant : seulement les logements du compte (même format de réponse).
-- Rejouable (create or replace).

create or replace function public.user_shell(p_user uuid)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
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
    from unmatched u join logements l on l.user_id = p_user and lower(btrim(l.nom)) = lower(u.n)
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
$function$;
