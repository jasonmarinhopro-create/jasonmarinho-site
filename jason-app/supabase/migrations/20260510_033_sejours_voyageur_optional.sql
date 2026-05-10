-- Permettre de créer un séjour sans voyageur du carnet (cas "famille / personnel")
-- Le voyageur reste recommandé pour suivre les avis et la conformité, mais
-- pour un séjour de proche (frère, ami), on n'a pas envie d'ajouter une fiche complète.

ALTER TABLE public.sejours
  ALTER COLUMN voyageur_id DROP NOT NULL;
