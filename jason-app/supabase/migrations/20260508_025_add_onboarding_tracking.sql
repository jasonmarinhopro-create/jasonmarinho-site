-- Onboarding tracking pour les nouveaux utilisateurs
-- Ajoute 3 colonnes à profiles + indice partiel pour requêtes "à terminer"

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed boolean NOT NULL DEFAULT false;

-- Garde-fou : step 0 à 5 uniquement
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_step_range;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_onboarding_step_range
  CHECK (onboarding_step BETWEEN 0 AND 5);

-- Indice partiel : utile pour les jobs admin "qui n'a pas terminé l'onboarding"
CREATE INDEX IF NOT EXISTS profiles_onboarding_pending_idx
  ON profiles (created_at DESC)
  WHERE onboarding_completed_at IS NULL AND onboarding_dismissed = false;

COMMENT ON COLUMN profiles.onboarding_step IS
  'Étape onboarding atteinte (0=pas commencé, 5=terminé). Voir lib/onboarding/steps.ts pour la définition.';
COMMENT ON COLUMN profiles.onboarding_completed_at IS
  'Timestamp quand l''utilisateur a terminé les 5 étapes.';
COMMENT ON COLUMN profiles.onboarding_dismissed IS
  'L''utilisateur a explicitement masqué la checklist (peut la rouvrir depuis l''aide).';
