-- Lieu de naissance du voyageur : champ exigé par la fiche individuelle de
-- police française (arrêté du 1er octobre 2015, art. R.813-2 CESEDA).
-- Collecté par le check-in en ligne, utilisé par le PDF de la fiche.

alter table voyageurs
  add column if not exists lieu_naissance text default null;
