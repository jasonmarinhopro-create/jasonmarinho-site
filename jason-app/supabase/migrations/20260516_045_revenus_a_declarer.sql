-- ─────────────────────────────────────────────────────────────────────
-- Migration : flag 'a_declarer' sur revenus_entries et sejours
-- ─────────────────────────────────────────────────────────────────────
-- Permet de marquer certaines entrées comme NON imposables pour ne pas
-- biaiser l'estimation fiscale annuelle (cadeau famille, remboursement,
-- usage perso, séjour ami à prix symbolique, etc.).
--
-- Par défaut TRUE : toutes les entrées existantes restent considérées
-- comme du revenu LCD imposable (zéro régression).
--
-- ⚠ Ce flag n'EXONÈRE PAS de la déclaration légale. L'utilisateur reste
-- seul responsable de sa déclaration aux impôts. Le flag sert uniquement
-- à clarifier le calcul d'estimation indicatif affiché dans l'app.

alter table public.revenus_entries
  add column if not exists a_declarer boolean not null default true;

alter table public.sejours
  add column if not exists a_declarer boolean not null default true;

comment on column public.revenus_entries.a_declarer is
  'Si false, exclu de l''estimation fiscale (cadeau, remboursement, usage perso). Default true.';
comment on column public.sejours.a_declarer is
  'Si false, exclu de l''estimation fiscale (séjour ami, blocage perso valorisé). Default true.';

-- Index partiel pour accélérer le filtrage côté estimation (cas exclus
-- restent rares, table revenus_entries reste petite).
create index if not exists revenus_entries_a_declarer_idx
  on public.revenus_entries (user_id) where a_declarer = false;
create index if not exists sejours_a_declarer_idx
  on public.sejours (user_id) where a_declarer = false;
