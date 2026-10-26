-- Suggestions des membres : « Traitée » au lieu de seulement « Supprimer »
-- (26/10/2026, Jason : « je ne peux que la supprimer, ça ne sert à rien de
-- mettre traité ? »). Une suggestion traitée reste dans l'historique et sort
-- du compteur « à traiter » du QG.
alter table public.suggestions add column if not exists treated_at timestamptz;

-- Vue d'ensemble : le compteur ne garde que les suggestions à traiter
create or replace function public.admin_overview(p_month_start timestamptz, p_twelve_months timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'total_users', (select count(*) from profiles),
    'driing_members', (select count(*) from profiles where plan = 'driing'),
    'standard_members', (select count(*) from profiles where plan = 'standard'),
    'standard_price_ids', coalesce((select jsonb_agg(stripe_price_id) from (select stripe_price_id from profiles where plan = 'standard' limit 1000) s), '[]'::jsonb),
    'new_this_month', (select count(*) from profiles where created_at >= p_month_start),
    'templates', (select count(*) from templates),
    'formations', (select count(*) from formations where is_published = true),
    'groups', (select count(*) from community_groups),
    'voyageurs', (select count(*) from voyageurs),
    'sejours', (select count(*) from sejours),
    'completed_formations', (select count(*) from user_formations where progress = 100),
    'pending_driing', (select count(*) from profiles where driing_status = 'pending'),
    'pending_reports', (select count(*) from reported_guests where is_validated = false),
    'suggestions', (select count(*) from suggestions where treated_at is null),
    'formation_enrollments', coalesce((select jsonb_agg(jsonb_build_object('formation_id', uf.formation_id,
        'formations', (select jsonb_build_object('title', f.title) from formations f where f.id = uf.formation_id)))
      from user_formations uf), '[]'::jsonb),
    'recent_signups', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from (
      select id, email, full_name, plan, created_at from profiles where role <> 'admin' order by created_at desc limit 8) r), '[]'::jsonb),
    'monthly_signups', coalesce((select jsonb_agg(jsonb_build_object('created_at', created_at, 'plan', plan))
      from profiles where created_at >= p_twelve_months and role <> 'admin'), '[]'::jsonb),
    'photographers', coalesce((select jsonb_agg(jsonb_build_object('user_id', user_id, 'tier', tier, 'status', status, 'stripe_subscription_status', stripe_subscription_status)) from photographers), '[]'::jsonb),
    'cleaners', coalesce((select jsonb_agg(jsonb_build_object('user_id', user_id, 'tier', tier, 'status', status, 'stripe_subscription_status', stripe_subscription_status)) from cleaners), '[]'::jsonb),
    'admin_ids', coalesce((select jsonb_agg(id) from profiles where role = 'admin'), '[]'::jsonb)
  )
$$;

revoke all on function public.admin_overview(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_overview(timestamptz, timestamptz) to service_role;
