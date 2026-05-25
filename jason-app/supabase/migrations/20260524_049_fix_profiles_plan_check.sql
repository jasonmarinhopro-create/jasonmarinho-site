-- ════════════════════════════════════════════════════════════════════
-- FIX CRITIQUE : contrainte profiles_plan_check bloque les abonnements
-- ════════════════════════════════════════════════════════════════════
-- Symptôme : premier client payant Standard → erreur
--   "new row for relation profiles violates check constraint
--    profiles_plan_check"
--
-- Cause : la contrainte en production n'autorisait que 'decouverte' et
-- 'driing' (la migration 20260419 qui ajoutait 'standard' n'avait jamais
-- été appliquée à la DB live). Le webhook Stripe + l'admin ne pouvaient
-- donc PAS passer un membre en 'standard'.
--
-- Cette migration est IDEMPOTENTE et SÛRE : DROP IF EXISTS + recréation
-- avec les 3 valeurs valides. À appliquer d'urgence.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('decouverte', 'standard', 'driing'));

-- Vérification : aucune ligne existante ne doit violer la nouvelle contrainte
-- (toutes les valeurs actuelles sont forcément dans l'ancien set plus petit,
--  donc compatibles avec le set élargi — aucun risque de rejet).

-- Distribution des plans pour contrôle visuel après application :
-- SELECT plan, COUNT(*) FROM public.profiles GROUP BY plan ORDER BY plan;
