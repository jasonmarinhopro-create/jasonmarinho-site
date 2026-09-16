-- Incident ponctuel : un séjour a été supprimé par erreur depuis la fiche
-- voyageur (deleteSejour), ce qui a automatiquement annulé le contrat lié
-- (comportement voulu depuis la migration 103 pour les vrais orphelins) —
-- mais dans ce cas précis le séjour supprimé était le bon séjour d'un
-- contrat actif, pas un doublon. Restaure le contrat et recrée le séjour
-- supprimé à l'identique (même id, pour que contracts.sejour_id reste
-- valide), à partir du snapshot encore présent sur le contrat lui-même.
-- Scopé au seul contrat concerné (son token) pour ne toucher à rien d'autre.

-- 1. Restaure le contrat en statut signé.
update public.contracts
set statut = 'signe'
where token = '527c4118-cf02-41e5-b723-8fcbe9a8437b'
  and statut = 'annule';

-- 2. Recrée le séjour supprimé (même id que contracts.sejour_id), uniquement
-- s'il n'existe vraiment plus.
insert into public.sejours (
  id, user_id, voyageur_id, logement, date_arrivee, date_depart, montant,
  contrat_statut, contrat_date_signature, contrat_lien
)
select
  c.sejour_id,
  c.user_id,
  c.voyageur_id,
  c.logement_nom,
  c.date_arrivee,
  c.date_depart,
  c.montant_loyer,
  'signe',
  c.signature_date::date,
  'https://app.jasonmarinho.com/sign/' || c.token
from public.contracts c
where c.token = '527c4118-cf02-41e5-b723-8fcbe9a8437b'
  and c.sejour_id is not null
  and not exists (select 1 from public.sejours s where s.id = c.sejour_id);
