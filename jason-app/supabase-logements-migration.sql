-- ─── Migration : table logements (fiches logements des hôtes) ────────────────
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Création de la table logements
CREATE TABLE IF NOT EXISTS logements (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom                  TEXT        NOT NULL,
  adresse              TEXT        NOT NULL,
  description          TEXT,
  capacite_max         INTEGER     NOT NULL DEFAULT 1,
  reglement_interieur  TEXT,
  conditions_annulation TEXT,
  animaux_acceptes     BOOLEAN     NOT NULL DEFAULT FALSE,
  fumeur_accepte       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS : chaque hôte gère uniquement ses propres logements
ALTER TABLE logements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own logements"
  ON logements FOR ALL
  USING (auth.uid() = user_id);

-- 3. Ajout des colonnes sur contracts
--    logement_nom : nom du logement au moment de la création du contrat (dénormalisé)
--    logement_id  : référence optionnelle vers la fiche logement source
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS logement_nom TEXT,
  ADD COLUMN IF NOT EXISTS logement_id  UUID REFERENCES logements(id) ON DELETE SET NULL;
