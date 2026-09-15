-- deleteSejour() (app/dashboard/voyageurs/actions.ts) supprimait un séjour
-- sans annuler le(s) contrat(s) lié(s) via contracts.sejour_id. Le contrat
-- restait "en attente" et continuait d'apparaître dans le journal Encaissements
-- (/dashboard/revenus) et la liste des impayés, en doublon avec le séjour
-- recréé. On annule ici tous les contrats déjà orphelins (sejour_id pointant
-- vers un séjour qui n'existe plus), avec le même statut que cancelContract()
-- utilise normalement (exclu de tous les décomptes).

update public.contracts c
set statut = 'annule'
where c.statut <> 'annule'
  and c.sejour_id is not null
  and not exists (
    select 1 from public.sejours s where s.id = c.sejour_id
  );
