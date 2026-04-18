-- Migration: stocker les IDs de leçons complétées dans user_formations
-- Permet de restaurer fidèlement la progression après actualisation de page
ALTER TABLE public.user_formations
  ADD COLUMN IF NOT EXISTS completed_lessons JSONB DEFAULT '[]'::jsonb;
