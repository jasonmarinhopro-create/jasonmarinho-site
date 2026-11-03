-- Photos retirées d'une fiche pro (03/11/2026) : la fiche publique est un
-- site statique reconstruit à la mise en ligne. Effacer le fichier dès la
-- suppression cassait la photo sur la fiche publique jusqu'à la mise en
-- ligne suivante (bloc gris). Le fichier est maintenant gardé un jour, noté
-- ici ({ path, at }), puis effacé à la prochaine action sur les photos.
alter table public.photographers add column if not exists portfolio_retired jsonb not null default '[]'::jsonb;
alter table public.cleaners add column if not exists portfolio_retired jsonb not null default '[]'::jsonb;
alter table public.depannage_pros add column if not exists portfolio_retired jsonb not null default '[]'::jsonb;
