-- Signature électronique du check-in en ligne (comme Partee).
-- Le voyageur signe sa fiche au doigt/souris : preuve de l'exactitude des
-- informations déclarées, conservée sur la fiche voyageur (data URL PNG,
-- même format que contracts.signature_image).

alter table voyageurs
  add column if not exists checkin_signature text default null;

comment on column voyageurs.checkin_signature is
  'Signature électronique du check-in en ligne (data URL PNG). Horodatage : checkin_completed_at.';
