-- Admin, Membres : fiche membre et activité en une requête (24/10/2026, plan de
-- performance). Avant : la fiche membre faisait une trentaine de requêtes (16
-- lectures, 11 sources d'activité, dernière visite), la liste des membres lisait
-- jusqu'à 5 000 lignes par source pour n'en garder que la plus récente.
--
-- Réservées au serveur (service role, après vérification du rôle admin par la
-- page) : aucun droit pour les comptes connectés ni les visiteurs.

-- Dernière action de chaque membre (une ligne par membre et par source)
create or replace function public.admin_members_activity(p_user_ids uuid[] default null)
returns table (user_id uuid, kind text, at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select x.user_id, x.kind, max(x.at) as at from (
    select user_id, 'logement' as kind, created_at as at from logements
    union all select user_id, 'calendrier', created_at from ical_feeds
    union all select user_id, 'sejour', created_at from sejours
    union all select user_id, 'voyageur', created_at from voyageurs
    union all select user_id, 'contrat', created_at from contracts
    union all select user_id, 'revenu', created_at from revenus_entries
    union all select user_id, 'evenement', created_at from calendar_events
    union all select author_id, 'question', created_at from chez_nous_posts
    union all select author_id, 'reponse', created_at from chez_nous_replies
    union all select user_id, 'formation', enrolled_at from user_formations
    union all select user_id, 'audit', started_at from audit_gbp_sessions
  ) x
  where x.at is not null and x.user_id is not null
    and (p_user_ids is null or x.user_id = any(p_user_ids))
  group by x.user_id, x.kind
$$;

-- Fiche membre : mêmes colonnes que les anciennes lectures
create or replace function public.admin_member_detail(p_member uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select case when not exists (select 1 from profiles where id = p_member) then null else jsonb_build_object(
    'profile', (select to_jsonb(p) from (select id, email, full_name, role, driing_status, plan, is_investor, created_at, admin_notes, last_seen_at
                  from profiles where id = p_member) p),
    'formations', coalesce((select jsonb_agg(jsonb_build_object('id', uf.id, 'progress', uf.progress, 'enrolled_at', uf.enrolled_at,
        'completed_at', uf.completed_at,
        'formation', (select jsonb_build_object('id', f.id, 'title', f.title, 'slug', f.slug, 'duration', f.duration, 'level', f.level)
                        from formations f where f.id = uf.formation_id)) order by uf.enrolled_at desc)
      from user_formations uf where uf.user_id = p_member), '[]'::jsonb),
    'counts', jsonb_build_object(
      'voyageurs', (select count(*) from voyageurs where user_id = p_member),
      'favorites', (select count(*) from user_template_favorites where user_id = p_member),
      'customizations', (select count(*) from user_template_customizations where user_id = p_member),
      'signalements', (select count(*) from reported_guests where reporter_id = p_member),
      'suggestions', (select count(*) from suggestions where user_id = p_member),
      'sejours', (select count(*) from sejours where user_id = p_member),
      'logements', (select count(*) from logements where user_id = p_member),
      'contrats', (select count(*) from contracts where user_id = p_member)),
    'joined_groups', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'member_count', coalesce(g.members_count, 0)))
      from community_groups g where g.id in (select group_id from user_community_memberships where user_id = p_member and status = 'joined')), '[]'::jsonb),
    'audits', coalesce((select jsonb_agg(to_jsonb(a) order by a.started_at desc) from (
      select id, business_name, started_at, completed_at, score_global from audit_gbp_sessions
       where user_id = p_member order by started_at desc limit 5) a), '[]'::jsonb),
    'investor_projects', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from (
      select id, nom, ville, pays, type_logement, prix_achat, mensualite, created_at from investor_projects where user_id = p_member) i), '[]'::jsonb),
    'photographers', coalesce((select jsonb_agg(to_jsonb(r)) from (
      select id, full_name, ville, status, tier, slug, is_public, stripe_subscription_status, views_count, contacts_count, created_at
        from photographers where user_id = p_member) r), '[]'::jsonb),
    'cleaners', coalesce((select jsonb_agg(to_jsonb(r)) from (
      select id, full_name, pseudo, ville, status, tier, slug, is_public, stripe_subscription_status, views_count, contacts_count, created_at
        from cleaners where user_id = p_member) r), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(jsonb_build_object('kind', a.kind, 'at', a.at)) from public.admin_members_activity(array[p_member]) a), '[]'::jsonb)
  ) end
$$;

-- Vue d'ensemble de l'admin : les compteurs en une requête (avant : 18 lectures)
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
    'suggestions', (select count(*) from suggestions),
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

revoke all on function public.admin_members_activity(uuid[]) from public, anon, authenticated;
revoke all on function public.admin_member_detail(uuid) from public, anon, authenticated;
grant execute on function public.admin_members_activity(uuid[]) to service_role;
grant execute on function public.admin_member_detail(uuid) to service_role;
revoke all on function public.admin_overview(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_overview(timestamptz, timestamptz) to service_role;
