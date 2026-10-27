-- Atelier de Ma fiche (27/10/2026, Jason : « une expérience de remplissage
-- moderne », étape 1). Les photographes et les équipes de ménage ne cliquent
-- plus sur « Enregistrer » : chaque changement est gardé ici, en brouillon, et
-- la fiche publique ne change qu'au clic « Mettre en ligne » (une seule
-- reconstruction du site au lieu d'une par clic, Vercel Hobby : 100 par jour).
-- Le brouillon n'est lu que par son pro (RLS « own row ») et n'est dans aucune
-- vue publique. Forme : lib/pros/fiche-draft.ts.
alter table public.photographers add column if not exists fiche_draft jsonb;
alter table public.cleaners add column if not exists fiche_draft jsonb;
