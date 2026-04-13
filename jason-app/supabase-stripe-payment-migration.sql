-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : Stripe Reservation Payment (loyer en ligne)
-- Ajout des colonnes nécessaires au paiement du loyer via Stripe Checkout
-- ─────────────────────────────────────────────────────────────────────────────

-- Activer le paiement en ligne pour un contrat (décidé lors de la création)
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS stripe_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Statut du paiement de la réservation
-- pending  : lien envoyé, pas encore payé
-- paid     : paiement réussi (PaymentIntent captured automatiquement)
-- refunded : remboursé par le bailleur
-- failed   : échec du paiement
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS stripe_payment_status TEXT
    CHECK (stripe_payment_status IN ('pending', 'paid', 'refunded', 'failed'))
    DEFAULT NULL;

-- Identifiants Stripe pour le suivi
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS stripe_payment_checkout_id TEXT DEFAULT NULL;

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT DEFAULT NULL;

-- Index pour les lookups webhooks
CREATE INDEX IF NOT EXISTS idx_contracts_stripe_payment_checkout
  ON contracts (stripe_payment_checkout_id)
  WHERE stripe_payment_checkout_id IS NOT NULL;
