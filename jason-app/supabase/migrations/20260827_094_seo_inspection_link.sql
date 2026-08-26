-- Lien d'inspection Search Console renvoyé par l'API elle-même
-- (inspectionResultLink) pour chaque page vérifiée — contrairement au lien
-- construit à la main (id est un jeton opaque émis par Google, pas une URL
-- encodée : impossible à reconstruire soi-même), celui-ci est garanti
-- valide puisque Google le génère pour cette inspection précise.

alter table seo_indexation_status
  add column if not exists inspection_link text default null;
