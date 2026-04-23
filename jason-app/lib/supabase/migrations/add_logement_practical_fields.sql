-- Ajout des champs pratiques sur la fiche logement
-- Ces infos sont partagées avec les voyageurs (check-in/out, Wi-Fi, accès)

ALTER TABLE logements
  ADD COLUMN IF NOT EXISTS heure_arrivee   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS heure_depart    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS code_acces      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wifi_nom        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wifi_mdp        TEXT DEFAULT NULL;
