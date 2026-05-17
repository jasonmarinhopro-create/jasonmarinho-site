-- Colonne autres_revenus_pro sur profiles : revenus professionnels du foyer fiscal
-- hors LCD (salaires + BNC + autres BIC), saisis librement par l'utilisateur.
--
-- Utilisée pour détecter exactement LMNP vs LMP :
--   - LMP si CA LCD ≥ 23 000 € ET CA LCD > autres_revenus_pro
--   - LMNP sinon
--
-- Sans cette saisie, l'estimation reste conservative (LMNP par défaut).
-- Stocké en entier euros, NULL = non renseigné (cas par défaut).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS autres_revenus_pro integer;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_autres_revenus_pro_check
  CHECK (autres_revenus_pro IS NULL OR (autres_revenus_pro >= 0 AND autres_revenus_pro <= 10000000));

COMMENT ON COLUMN profiles.autres_revenus_pro IS
  'Revenus pro du foyer fiscal hors LCD (en €/an). Utilisé pour la détection LMNP vs LMP. NULL = non renseigné.';
