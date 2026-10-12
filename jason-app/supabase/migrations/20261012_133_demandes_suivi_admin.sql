-- Suivi des demandes d'hôtes dans le QG (12/10/2026, Jason : « avoir une fiche
-- dans l'admin pour analyser le travail et l'envoyer à des gens ») :
-- vue par l'admin, note interne, demande traitée. Serveur seulement (RLS de
-- la table sans politique, migration 132).

alter table public.demandes_hotes add column if not exists admin_seen_at timestamptz;
alter table public.demandes_hotes add column if not exists admin_note text;
alter table public.demandes_hotes add column if not exists admin_done_at timestamptz;
