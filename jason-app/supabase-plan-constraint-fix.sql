-- ============================================================
-- FIX : Mise à jour de la contrainte plan sur profiles
-- À exécuter dans Supabase → SQL Editor → New query
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('decouverte', 'driing'));

-- Remettre les valeurs hors contrainte à 'decouverte' par sécurité
UPDATE public.profiles
  SET plan = 'decouverte'
  WHERE plan NOT IN ('decouverte', 'driing');
