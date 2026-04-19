-- Champs abonnement plateforme dans profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id          TEXT;

-- Plan 'standard' autorisé en plus de 'decouverte' et 'driing'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('decouverte', 'standard', 'driing'));
