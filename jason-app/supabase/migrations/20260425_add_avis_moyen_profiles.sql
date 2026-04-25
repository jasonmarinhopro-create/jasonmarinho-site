ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avis_moyen numeric(3,2)
  CHECK (avis_moyen IS NULL OR (avis_moyen >= 1 AND avis_moyen <= 5));
