-- Migration : ajout des colonnes IBAN et BIC sur la table profiles
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS bic  TEXT;

-- Commentaires pour la documentation
COMMENT ON COLUMN public.profiles.iban IS 'IBAN du bailleur pour les paiements par virement bancaire';
COMMENT ON COLUMN public.profiles.bic  IS 'BIC/SWIFT du bailleur (optionnel)';
