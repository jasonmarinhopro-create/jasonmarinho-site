-- Objectif de chiffre d'affaires annuel PAR LOGEMENT (refonte de « Mes
-- finances », sept. 2026 : chaque logement a ses propres chiffres).
-- L'ancien objectif global (revenus_objectifs) reste utilisé pour la vue
-- « Tous les logements » quand aucun logement n'a d'objectif.
-- Le code fonctionne sans cette colonne (objectif par logement indisponible).
ALTER TABLE public.logements
  ADD COLUMN IF NOT EXISTS objectif_ca_annuel NUMERIC(10,2) DEFAULT NULL;
