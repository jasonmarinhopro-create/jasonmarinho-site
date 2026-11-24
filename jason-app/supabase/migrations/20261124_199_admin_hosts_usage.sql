-- Admin, page Hôtes en fiches carrées (24/11/2026, maquette validée par Jason) :
-- l'avancement de chaque hôte (7 étapes de lib/admin/host-journey.ts) en une
-- requête pour toute la liste. Avant : la fiche membre seule le calculait,
-- avec une quinzaine de lectures par hôte. Nombres et dates seulement : aucun
-- montant, aucun nom, aucun contenu. Réservée au serveur (service role, après
-- vérification du rôle admin par la page).
create or replace function public.admin_hosts_usage(p_user_ids uuid[] default null)
returns table (user_id uuid, kind text, n bigint, last timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select x.user_id, x.kind, count(*) as n, max(x.at) as last from (
    select user_id, 'logement' as kind, created_at as at from logements
    union all select user_id, 'calendrier', created_at from ical_feeds
    union all select user_id, 'calendrier_erreur', null::timestamptz from ical_feeds where consecutive_failures > 0
    union all select user_id, 'importee', null::timestamptz from ical_events
    union all select user_id, 'sejour', created_at from sejours where annule_at is null
    union all select user_id, 'voyageur', created_at from voyageurs
    union all select user_id, 'contrat', created_at from contracts where statut is distinct from 'annule'
    union all select user_id, 'contrat_signe', null::timestamptz from contracts where statut = 'signe'
    union all select user_id, 'revenu', created_at from revenus_entries
    union all select user_id, 'charge', created_at from revenus_charges
  ) x
  where x.user_id is not null
    and (p_user_ids is null or x.user_id = any(p_user_ids))
  group by x.user_id, x.kind
$$;

revoke all on function public.admin_hosts_usage(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_hosts_usage(uuid[]) to service_role;
