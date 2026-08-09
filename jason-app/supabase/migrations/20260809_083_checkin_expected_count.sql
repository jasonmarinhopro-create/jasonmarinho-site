-- Nombre de voyageurs attendus pour le check-in en ligne : l'hôte le
-- renseigne avant d'envoyer le lien (ex : réservation Airbnb à 9 voyageurs).
-- Le formulaire public /checkin/[token] pré-remplit alors le bon nombre de
-- fiches accompagnant à compléter, pour que le voyageur principal comprenne
-- dès l'ouverture du lien qu'il doit déclarer tout le groupe et pas
-- seulement lui-même.

alter table voyageurs
  add column if not exists checkin_expected_count integer default null;
