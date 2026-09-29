-- Contrat de location plus complet (29/09/2026, retours d'hôtes) :
-- état descriptif des lieux (Code du tourisme L324-2), prix détaillé,
-- régime des sommes versées (arrhes ou acompte), délai de restitution de la
-- caution, clauses particulières rédigées par l'hôte.

-- Instantané figé à la création du contrat (voir lib/contracts/details.ts)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS details jsonb;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS clauses_particulieres text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS clauses_particulieres_pt text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS clauses_particulieres_en text;

-- Réglages du contrat propres à chaque logement, repris par l'assistant
ALTER TABLE public.logements ADD COLUMN IF NOT EXISTS contrat_options jsonb;
ALTER TABLE public.logements ADD COLUMN IF NOT EXISTS clauses_particulieres text;
ALTER TABLE public.logements ADD COLUMN IF NOT EXISTS clauses_particulieres_pt text;
ALTER TABLE public.logements ADD COLUMN IF NOT EXISTS clauses_particulieres_en text;
