-- ──────────────────────────────────────────────────────────────────────────────
-- Migration : Stripe Connect + Cautions (dépôts de garantie)
-- Stripe Express Connect — pré-autorisation (capture manuelle)
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. Ajouter les colonnes Stripe au profil bailleur ────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id         TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.stripe_account_id IS
  'Identifiant du compte Stripe Connect Express du bailleur (acct_xxx).';

COMMENT ON COLUMN public.profiles.stripe_onboarding_complete IS
  'TRUE quand le bailleur a terminé l''onboarding Stripe (KYC + coordonnées bancaires).';

-- ── 2. Ajouter les colonnes caution aux contrats ──────────────────────────────
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS stripe_deposit_checkout_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_deposit_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_deposit_status            TEXT
    CHECK (stripe_deposit_status IN ('pending', 'held', 'captured', 'released', 'failed'));

COMMENT ON COLUMN public.contracts.stripe_deposit_checkout_id IS
  'Identifiant de la Stripe Checkout Session pour la caution.';

COMMENT ON COLUMN public.contracts.stripe_deposit_payment_intent_id IS
  'PaymentIntent Stripe de la caution (capture_method=manual).';

COMMENT ON COLUMN public.contracts.stripe_deposit_status IS
  'Statut de la caution : pending → held → captured | released.';

-- ── 3. Index ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS contracts_deposit_status_idx
  ON public.contracts(stripe_deposit_status);

CREATE INDEX IF NOT EXISTS profiles_stripe_account_idx
  ON public.profiles(stripe_account_id);
