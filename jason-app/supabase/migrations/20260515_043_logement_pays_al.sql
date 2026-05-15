-- ─────────────────────────────────────────────────────────────────────
-- Migration : Pays du logement + numéro AL (Alojamento Local Portugal)
-- ─────────────────────────────────────────────────────────────────────
-- Permet de gérer des logements hors France (Portugal d'abord, autres
-- pays ensuite à la demande). Architecture extensible : la colonne pays
-- accepte n'importe quel code ISO-3166 alpha-2 valide.
--
-- Garanties de non-régression :
--   - Default 'FR' : tous les logements existants sont implicitement français
--   - Pas de NOT NULL : aucun risque d'échec sur les rows existantes
--   - Numero_al optionnel, valide uniquement quand pays='PT' (validation côté app)
--
-- Sources :
--   - Decreto-Lei n.º 128/2014 (régime AL au Portugal)
--   - Turismo de Portugal, Registo Nacional do Alojamento Local

alter table public.logements
  add column if not exists pays text default 'FR',
  add column if not exists numero_al text default null;

-- Contrainte : pays doit être un code ISO-3166 alpha-2 (2 lettres majuscules)
alter table public.logements
  drop constraint if exists logements_pays_check;
alter table public.logements
  add constraint logements_pays_check
    check (pays is null or pays ~ '^[A-Z]{2}$');

-- Index pour filtrer/grouper par pays (utile dès qu'on a 2 pays+)
create index if not exists logements_pays_idx
  on public.logements (user_id, pays);

comment on column public.logements.pays is
  'Code ISO-3166 alpha-2 du pays du bien (FR par défaut, PT, ES, IT, BE...).';
comment on column public.logements.numero_al is
  'Numéro AL (Alojamento Local) du Registo Nacional, requis au Portugal.';
