-- ============================================================
-- MIGRATION : Colonne plan sur les profils
-- À exécuter dans Supabase → SQL Editor → New query
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text
    CHECK (plan IN ('decouverte', 'hote', 'pro', 'agence'))
    DEFAULT 'decouverte' NOT NULL;

-- Politique UPDATE déjà couverte par "Update own or admin"
-- Aucune politique supplémentaire nécessaire.
