-- Migration : Notes de coaching admin sur les profils membres
-- Ces notes sont privées (visibles uniquement par l'admin)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT NULL;

-- Politique RLS : seul l'admin peut lire/écrire ces notes
-- (le service role contourne automatiquement les RLS, donc pas besoin de policy spécifique)
-- Mais on s'assure que les users normaux ne peuvent pas voir les admin_notes des autres
-- en utilisant le service role côté serveur pour toutes les opérations admin.

COMMENT ON COLUMN profiles.admin_notes IS 'Notes de coaching privées rédigées par l''admin (Jason)';
