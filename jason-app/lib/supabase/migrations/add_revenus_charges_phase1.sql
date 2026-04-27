-- Phase 1 — Module charges & dépenses pour Revenus
-- Permet de tracker toutes les charges déductibles ou non d'un hôte LCD
-- (ménage, énergie, plateformes, taxe foncière, assurance, travaux, etc.)
-- Indispensable pour calculer le bénéfice net et choisir entre micro-BIC et réel.

CREATE TABLE IF NOT EXISTS revenus_charges (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Référence au logement (texte libre + id pour cohérence)
  logement_nom  TEXT         NOT NULL,
  logement_id   UUID         DEFAULT NULL REFERENCES logements(id) ON DELETE SET NULL,

  -- Charge
  montant       NUMERIC(10,2) NOT NULL CHECK (montant > 0),
  date_charge   DATE          NOT NULL,
  categorie     TEXT          NOT NULL,
  description   TEXT          DEFAULT NULL,
  deductible    BOOLEAN       DEFAULT TRUE,

  -- Récurrence (préparation Phase 4b — pas implémenté tout de suite)
  recurrente    BOOLEAN       DEFAULT FALSE,

  -- Audit
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- Catégories autorisées (alignées avec la pratique LCD)
ALTER TABLE revenus_charges
  DROP CONSTRAINT IF EXISTS revenus_charges_categorie_check,
  ADD CONSTRAINT revenus_charges_categorie_check
    CHECK (categorie IN (
      'menage',
      'energie',
      'commissions_plateforme',
      'taxe_fonciere',
      'taxe_sejour',
      'assurance',
      'travaux',
      'equipement',
      'abonnement',
      'comptabilite',
      'banque',
      'amortissement',
      'autre'
    ));

-- Index pour les requêtes par user / mois / catégorie
CREATE INDEX IF NOT EXISTS revenus_charges_user_date_idx
  ON revenus_charges(user_id, date_charge DESC);
CREATE INDEX IF NOT EXISTS revenus_charges_logement_idx
  ON revenus_charges(user_id, logement_nom);
CREATE INDEX IF NOT EXISTS revenus_charges_categorie_idx
  ON revenus_charges(user_id, categorie);

-- RLS
ALTER TABLE revenus_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revenus_charges_select_own" ON revenus_charges;
CREATE POLICY "revenus_charges_select_own" ON revenus_charges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "revenus_charges_insert_own" ON revenus_charges;
CREATE POLICY "revenus_charges_insert_own" ON revenus_charges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "revenus_charges_update_own" ON revenus_charges;
CREATE POLICY "revenus_charges_update_own" ON revenus_charges
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "revenus_charges_delete_own" ON revenus_charges;
CREATE POLICY "revenus_charges_delete_own" ON revenus_charges
  FOR DELETE USING (auth.uid() = user_id);

-- Optionnel : objectifs annuels (pour Phase 8)
CREATE TABLE IF NOT EXISTS revenus_objectifs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  objectif_ca_annuel NUMERIC(10,2) DEFAULT NULL,
  annee         SMALLINT      DEFAULT NULL,
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE revenus_objectifs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revenus_objectifs_select_own" ON revenus_objectifs;
CREATE POLICY "revenus_objectifs_select_own" ON revenus_objectifs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "revenus_objectifs_upsert_own" ON revenus_objectifs;
CREATE POLICY "revenus_objectifs_upsert_own" ON revenus_objectifs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
