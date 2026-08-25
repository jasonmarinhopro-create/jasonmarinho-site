-- Durée d'amortissement (en années) d'une charge de catégorie
-- "amortissement" (mobilier, travaux d'amélioration, bien immobilier…).
-- Permet de calculer automatiquement la dotation annuelle et le tableau
-- d'amortissement dans /dashboard/revenus, plutôt que de déduire la charge
-- en une seule fois l'année de l'achat (ce qui serait fiscalement incorrect
-- en régime réel LMNP).

alter table revenus_charges
  add column if not exists duree_amortissement_annees integer default null;
