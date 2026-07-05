-- ═══════════════════════════════════════════════════════════════════
-- Tracking clics sortants sur les fiches pros publiques.
--
-- Les vues (views_count + RPC increment_photographer_views /
-- increment_cleaner_views) existaient déjà mais RIEN ne les appelait :
-- pas de beacon sur les fiches statiques, pas d'endpoint. Les endpoints
-- /api/photographer/track et /api/cleaner/track (service role) sont
-- créés en parallèle de cette migration ; ici on ajoute les compteurs
-- de clics sortants + leurs RPC.
--
-- Clics trackés :
--   photographes : portfolio (le chiffre en or), instagram
--   ménage       : site web, instagram
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Compteurs de clics ────────────────────────────────────────────
alter table public.photographers
  add column if not exists portfolio_clicks_count integer not null default 0,
  add column if not exists instagram_clicks_count integer not null default 0;

alter table public.cleaners
  add column if not exists site_clicks_count integer not null default 0,
  add column if not exists instagram_clicks_count integer not null default 0;

-- ── 2. RPC increment clics (service role uniquement, comme les vues) ─
create or replace function public.increment_photographer_click(p_id uuid, p_kind text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.photographers
     set portfolio_clicks_count = portfolio_clicks_count + (case when p_kind = 'portfolio' then 1 else 0 end),
         instagram_clicks_count = instagram_clicks_count + (case when p_kind = 'instagram' then 1 else 0 end)
   where id = p_id
     and p_kind in ('portfolio', 'instagram');
$$;

revoke all on function public.increment_photographer_click(uuid, text) from public;
revoke all on function public.increment_photographer_click(uuid, text) from anon;
revoke all on function public.increment_photographer_click(uuid, text) from authenticated;

create or replace function public.increment_cleaner_click(p_id uuid, p_kind text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.cleaners
     set site_clicks_count = site_clicks_count + (case when p_kind = 'site' then 1 else 0 end),
         instagram_clicks_count = instagram_clicks_count + (case when p_kind = 'instagram' then 1 else 0 end)
   where id = p_id
     and p_kind in ('site', 'instagram');
$$;

revoke all on function public.increment_cleaner_click(uuid, text) from public;
revoke all on function public.increment_cleaner_click(uuid, text) from anon;
revoke all on function public.increment_cleaner_click(uuid, text) from authenticated;
