-- Signature électronique des accompagnants qui s'ajoutent EUX-MÊMES via le
-- lien partagé (mode « je m'ajoute au groupe »). Elle apparaît sur LEUR page
-- de fiche individuelle de police, à la place du cadre vide à signer à
-- l'arrivée. Les accompagnants saisis par le voyageur principal restent sans
-- signature (une seule personne tient le téléphone) — cadre vide sur le PDF.

alter table checkin_companions
  add column if not exists checkin_signature text default null,
  add column if not exists signed_at timestamptz default null;
