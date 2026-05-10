-- Checklist standalone par séjour (sans contrat Jason requis).
-- Les cases cochées sont stockées ici quand aucun contrat n'est associé.
ALTER TABLE public.sejours
  ADD COLUMN IF NOT EXISTS checklist_status JSONB DEFAULT NULL;
