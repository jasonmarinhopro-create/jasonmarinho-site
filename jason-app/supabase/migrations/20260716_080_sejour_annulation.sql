-- Annulation de séjour SANS suppression : on garde l'historique (compta,
-- litiges, fiche voyageur) mais le séjour sort de tous les décomptes
-- opérationnels (CA, calendrier, flux iCal, notifications, déclarations).

alter table sejours
  add column if not exists annule_at timestamptz default null;

comment on column sejours.annule_at is
  'Séjour annulé (non supprimé) : exclu des stats/CA/calendrier/déclarations. NULL = actif.';

-- Les listes filtrent systématiquement sur annule_at IS NULL
create index if not exists sejours_actifs_idx
  on sejours(user_id, date_arrivee)
  where annule_at is null;
