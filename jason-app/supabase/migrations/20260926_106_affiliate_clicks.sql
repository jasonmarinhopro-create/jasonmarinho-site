-- Clics sortants sur les liens affiliés/partenaires du site statique
-- (jasonmarinho.com). Une ligne par clic sur un lien rel="sponsored",
-- écrite par api/track/click.js (fonction serverless du site statique,
-- service role) via un beacon envoyé par nav.js. Lue côté jason-app
-- (Admin → Vue d'ensemble) pour savoir quelles pages envoient des clics
-- vers quels partenaires. Aucune IP ni user-agent stockés.

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  url text not null,
  partner text not null,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_created_at_idx
  on public.affiliate_clicks (created_at desc);

comment on table public.affiliate_clicks is
  'Clics sortants sur les liens affiliés (rel=sponsored) du site statique. Pas de PII : ni IP ni user-agent.';

-- RLS activé sans policy : lecture/écriture uniquement via service_role.
alter table public.affiliate_clicks enable row level security;
