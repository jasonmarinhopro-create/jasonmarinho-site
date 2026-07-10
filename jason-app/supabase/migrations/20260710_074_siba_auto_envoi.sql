-- Envoi SIBA automatique après check-in en ligne.
-- Quand le voyageur complète son check-in et que le logement PT a sa config
-- SIBA, le boletim part tout seul au Web Service (comme Partee). L'hôte peut
-- désactiver ce comportement par logement.

alter table logements
  add column if not exists siba_auto_envoi boolean not null default true;

comment on column logements.siba_auto_envoi is
  'Envoi automatique du boletim SIBA dès que le check-in en ligne du voyageur est complété (logements PT avec config SIBA).';
