-- Migration: Ajout de l'état 'nouveau' pour les séjours
-- Remplace l'état par défaut 'non_requis' par 'nouveau' pour les séjours fraîchement créés

-- 1. Mettre à jour la contrainte CHECK pour autoriser 'nouveau'
ALTER TABLE public.sejours
  DROP CONSTRAINT IF EXISTS sejours_contrat_statut_check;

ALTER TABLE public.sejours
  ADD CONSTRAINT sejours_contrat_statut_check
  CHECK (contrat_statut IN ('signe', 'en_attente', 'non_requis', 'nouveau'));

-- 2. Mettre à jour la valeur par défaut de la colonne
ALTER TABLE public.sejours
  ALTER COLUMN contrat_statut SET DEFAULT 'nouveau';
