-- Sécurité voyageur : un signalement garde TOUS les identifiants saisis.
-- Avant : seul le premier (e-mail, sinon téléphone, sinon nom) était gardé.
-- Un signalement fait avec e-mail + téléphone était donc introuvable par une
-- recherche au téléphone. Les autres identifiants (forme normalisée, ex.
-- +33612345678) vont dans extra_identifiers.

alter table public.reported_guests
  add column if not exists extra_identifiers text[] not null default '{}';

create index if not exists reported_guests_extra_identifiers_idx
  on public.reported_guests using gin (extra_identifiers);

comment on column public.reported_guests.extra_identifiers is
  'Identifiants secondaires normalisés (téléphone quand l''identifiant principal est l''e-mail). Cherchés par la page Sécurité voyageur et le croisement avec Mes voyageurs.';
