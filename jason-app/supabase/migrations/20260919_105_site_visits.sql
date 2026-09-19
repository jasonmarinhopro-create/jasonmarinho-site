-- Trafic en direct + canal d'acquisition sur le site statique
-- (jasonmarinho.com). Une ligne par vue de page, écrite depuis
-- api/track/visit.js (fonction serverless du site statique, service role)
-- via un beacon envoyé par nav.js sur chaque page. Lue côté jason-app
-- (Admin → vue d'ensemble) pour :
--   - le nombre de visiteurs "en direct" (sessions distinctes actives
--     dans les 5 dernières minutes)
--   - la répartition par canal (direct / recherche / réseaux sociaux /
--     autres sites), calculée à la volée depuis referrer + utm_source
--     sur une fenêtre glissante (24h par défaut).

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at desc);
create index if not exists site_visits_session_created_idx
  on public.site_visits (session_id, created_at desc);

comment on table public.site_visits is
  'Pings de pages vues sur le site statique (une ligne par navigation), utilisés pour le compteur "en direct" et la répartition par canal admin. Pas de PII : ni IP ni user-agent stockés.';

-- RLS activé, aucune policy : lecture/écriture uniquement via service_role
-- (fonction serverless d'écriture côté site statique, requêtes admin
-- côté jason-app), jamais depuis un client authentifié.
alter table public.site_visits enable row level security;
