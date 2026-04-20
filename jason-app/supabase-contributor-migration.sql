-- Ajout de la colonne is_contributor à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_contributor BOOLEAN DEFAULT FALSE;

-- Commentaire pour clarté
COMMENT ON COLUMN profiles.is_contributor IS 'True si l utilisateur a contribué librement à la plateforme (géré manuellement par l admin)';
