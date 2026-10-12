-- Onglet « Groupes » de Provenance (12/10/2026) : un message de groupe Facebook
-- préparé = une ligne, avec le code mis dans les liens (utm_campaign). Le texte
-- du message n'est jamais gardé (données d'un tiers) : seulement ce que l'outil
-- en a compris, pour les chiffres (préparés, clics, inscriptions).
create table if not exists public.group_replies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  profile text,
  topics text[] not null default '{}',
  city text,
  resources int not null default 0,
  corrected boolean not null default false
);
create index if not exists group_replies_created_idx on public.group_replies (created_at desc);
alter table public.group_replies enable row level security;
-- Aucune politique : serveur (service role) seulement
