-- Ajoute le lien d'annonce Driing par logement.
-- Utilisé pour pré-remplir [LIEN_ANNONCE_DRIING] dans les gabarits Facebook
-- (page Communauté + Gabarits filtrés "Posts & annonces").
ALTER TABLE logements
  ADD COLUMN IF NOT EXISTS lien_driing TEXT DEFAULT NULL;

COMMENT ON COLUMN logements.lien_driing IS 'URL publique de l''annonce Driing du logement (ex: https://driing.co/casa-do-peidreiro)';
