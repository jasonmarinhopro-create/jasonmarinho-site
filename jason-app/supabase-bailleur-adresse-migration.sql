-- Migration : ajout de la colonne adresse sur la table profiles
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS adresse TEXT;

COMMENT ON COLUMN public.profiles.adresse IS 'Adresse de correspondance légale du bailleur (domicile élu) — distincte de l''adresse du logement loué';
