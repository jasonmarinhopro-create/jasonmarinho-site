-- ─────────────────────────────────────────────────────────────────────
-- Migration : Pays sur les contrats (template juridique adapté)
-- ─────────────────────────────────────────────────────────────────────
-- Permet de générer un contrat Alojamento Local (PT) au lieu du
-- contrat français quand le logement est au Portugal.
--
-- Garanties de non-régression :
--   - Default 'FR' : tous les contrats existants restent français
--   - Pas de NOT NULL
--   - Pas de migration de données automatique : les contrats déjà signés
--     restent au format FR (cohérence légale)

alter table public.contracts
  add column if not exists pays text default 'FR';

alter table public.contracts
  drop constraint if exists contracts_pays_check;
alter table public.contracts
  add constraint contracts_pays_check
    check (pays is null or pays ~ '^[A-Z]{2}$');

comment on column public.contracts.pays is
  'Code ISO-2 du pays du logement au moment de la création du contrat. Détermine le template juridique utilisé sur /sign/[token].';
