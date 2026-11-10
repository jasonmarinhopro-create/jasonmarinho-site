-- Page Admin → Provenance (et carte de la Vue d'ensemble) en un seul appel
-- (10/11/2026). Avant : profils, fiches photographes et ménage, liens suivis,
-- clics, puis les visites par pages de 1 000 (7 appels pour 100 jours), et une
-- lecture différente pour chaque période choisie. Les visites partent en
-- tableaux compacts (sans noms de champs, ~40 % plus légers).
-- Lecture seule, réservée au service role (appelée après vérification admin).
create or replace function public.acquisition_base(p_since timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'full_name', full_name, 'email', email, 'created_at', created_at,
        'role', role, 'is_investor', is_investor, 'plan', plan, 'acquisition', acquisition
      ) order by created_at)
      from profiles
    ), '[]'::jsonb),
    'photographers', coalesce((select jsonb_agg(jsonb_build_array(user_id, stripe_subscription_status)) from photographers where user_id is not null), '[]'::jsonb),
    'cleaners', coalesce((select jsonb_agg(jsonb_build_array(user_id, stripe_subscription_status)) from cleaners where user_id is not null), '[]'::jsonb),
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'code', code, 'label', label, 'channel', channel, 'destination', destination, 'archived', archived, 'created_at', created_at) order by created_at desc)
      from tracked_links
    ), '[]'::jsonb),
    'clicks', coalesce((select jsonb_agg(jsonb_build_array(code, created_at) order by id) from tracked_link_clicks), '[]'::jsonb),
    'visits', coalesce((
      select jsonb_agg(jsonb_build_array(session_id, path, referrer, utm_source, utm_medium, utm_campaign, created_at) order by created_at)
      from site_visits where created_at >= p_since
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.acquisition_base(timestamptz) from public, anon, authenticated;
grant execute on function public.acquisition_base(timestamptz) to service_role;
