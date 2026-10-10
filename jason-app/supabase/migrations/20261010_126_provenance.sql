-- Provenance des inscriptions et liens suivis (10/10/2026, demande de Jason :
-- savoir d'où viennent les comptes créés et ce que rapporte chaque lien posté
-- dans un groupe Facebook).
--
-- 1. profiles.acquisition : provenance de la visite qui a mené à l'inscription
--    (source, support, campagne, site d'origine, page d'arrivée, lien suivi).
--    Pas le parcours sur le site, seulement le point d'entrée.
-- 2. tracked_links : liens courts jasonmarinho.com/l/<code> créés dans l'admin.
-- 3. tracked_link_clicks : une ligne par clic (robots exclus), sans IP ni navigateur.
-- Lecture et écriture par le serveur seulement (service role).

alter table public.profiles add column if not exists acquisition jsonb;

create table if not exists public.tracked_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  channel text not null default 'facebook_groupe',
  destination text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tracked_link_clicks (
  id bigint generated always as identity primary key,
  code text not null,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists tracked_link_clicks_code_idx on public.tracked_link_clicks (code, created_at);
create index if not exists profiles_acquisition_campaign_idx on public.profiles ((acquisition->>'campaign'));

alter table public.tracked_links enable row level security;
alter table public.tracked_link_clicks enable row level security;
revoke all on public.tracked_links from anon, authenticated;
revoke all on public.tracked_link_clicks from anon, authenticated;
