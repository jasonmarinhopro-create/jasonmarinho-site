-- ================================================================
-- MIGRATION CRITIQUE : colonnes plan / role / driing sur profiles
-- ================================================================
-- À exécuter dans Supabase → SQL Editor
-- Sécurisé : ADD COLUMN IF NOT EXISTS ne plante pas si déjà présent
-- ================================================================

-- 1. Ajouter toutes les colonnes manquantes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role            text    NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS plan            text    NOT NULL DEFAULT 'decouverte',
  ADD COLUMN IF NOT EXISTS driing_status   text    NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS is_contributor  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id         text,
  ADD COLUMN IF NOT EXISTS admin_notes     text;

-- 2. S'assurer que les lignes existantes ont les bonnes valeurs par défaut
--    (UPDATE sur colonnes qui viennent d'être ajoutées avec DEFAULT → déjà OK,
--     mais on force au cas où DEFAULT n'a pas été appliqué rétroactivement)
UPDATE public.profiles
  SET role           = COALESCE(NULLIF(role, ''), 'user')
  WHERE role IS NULL OR role = '';

UPDATE public.profiles
  SET plan           = COALESCE(NULLIF(plan, ''), 'decouverte')
  WHERE plan IS NULL OR plan = '';

UPDATE public.profiles
  SET driing_status  = COALESCE(NULLIF(driing_status, ''), 'none')
  WHERE driing_status IS NULL OR driing_status = '';

UPDATE public.profiles
  SET is_contributor = false
  WHERE is_contributor IS NULL;

-- 3. Recréer le trigger d'inscription pour inclure les nouvelles colonnes
--    (les nouveaux inscrits auront automatiquement les bons défauts)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan, driing_status, is_contributor)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user',
    'decouverte',
    'none',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Vérification finale : affiche la distribution des plans
SELECT
  plan,
  driing_status,
  COUNT(*) AS nb_membres
FROM public.profiles
GROUP BY plan, driing_status
ORDER BY plan, driing_status;
