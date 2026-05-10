-- Add contrat_plateforme to sejours
-- Tracks which platform signed the contract (booking, airbnb, abritel, vrbo,
-- gites_de_france, driing, direct, autre) or null when signed via Jason.
ALTER TABLE sejours
  ADD COLUMN IF NOT EXISTS contrat_plateforme TEXT DEFAULT NULL;
