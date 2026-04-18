-- Migration: ajouter methodes_paiement à la table logements
-- Valeurs possibles : 'virement' | 'stripe' | 'les_deux'
ALTER TABLE public.logements
  ADD COLUMN IF NOT EXISTS methodes_paiement TEXT DEFAULT 'virement';
