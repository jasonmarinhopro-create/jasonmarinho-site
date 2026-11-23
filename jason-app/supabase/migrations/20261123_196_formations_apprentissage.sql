-- Formations : questions, actions planifiées, bilan de départ (23/11/2026,
-- refonte de l'apprentissage validée par Jason, docs/claude/formations.md).
-- Rejouable (if not exists, create or replace, drop policy if exists).

-- 1. Réponses aux questions des leçons. La 1re réponse compte (score de la
--    formation) ; review_* = révision 7 jours plus tard (carte de l'Accueil).
create table if not exists public.formation_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  formation_id uuid not null references public.formations(id) on delete cascade,
  lesson_id int not null,
  question int not null,
  correct boolean not null,
  answered_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_correct boolean,
  primary key (user_id, formation_id, lesson_id, question)
);
create index if not exists formation_answers_review_idx
  on public.formation_answers (user_id, answered_at) where reviewed_at is null;
alter table public.formation_answers enable row level security;
grant select, insert, update, delete on table public.formation_answers to authenticated, service_role;
drop policy if exists "formation_answers_own" on public.formation_answers;
create policy "formation_answers_own" on public.formation_answers
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 2. Actions de fin de module (« Passe à l'action ») : faite tout de suite
--    (done_at) ou prévue à un moment choisi (due_at) avec rappel dans la cloche.
create table if not exists public.formation_action_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  formation_id uuid not null references public.formations(id) on delete cascade,
  module_id int not null,
  title text not null,
  href text,
  due_at timestamptz,
  done_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, formation_id, module_id)
);
create index if not exists formation_action_plans_due_idx
  on public.formation_action_plans (due_at) where notified_at is null and done_at is null;
alter table public.formation_action_plans enable row level security;
grant select, insert, update, delete on table public.formation_action_plans to authenticated, service_role;
drop policy if exists "formation_action_plans_own" on public.formation_action_plans;
create policy "formation_action_plans_own" on public.formation_action_plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 3. Bilan de départ : ce que le membre veut réussir, et son niveau.
alter table public.user_formations add column if not exists objectif text;
alter table public.user_formations add column if not exists bilan jsonb;

-- 4. Rappels des actions prévues : une notification dans la cloche à l'heure
--    choisie, posée par la vérification planifiée (toutes les 15 min), en SQL
--    seul (aucun appel à l'app).
create or replace function public.jm_formation_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
begin
  with due as (
    select p.user_id, p.formation_id, p.module_id, p.title, p.href, f.slug
      from formation_action_plans p
      join formations f on f.id = p.formation_id
     where p.due_at <= now() and p.notified_at is null and p.done_at is null
     limit 200
  ), ins as (
    insert into notifications (recipient_id, category, type, title, body, cta_label, cta_href, severity, dedup_key, expires_at)
    select user_id, 'guide', 'formation_action',
           'C''est le moment : ' || left(title, 120),
           'Tu avais prévu de passer à l''action maintenant.',
           'Y aller',
           coalesce(nullif(href, ''), '/dashboard/formations/' || slug),
           'info',
           'formation_action:' || formation_id || ':' || module_id,
           now() + interval '14 days'
      from due
    on conflict do nothing
    returning 1
  )
  select count(*) into n from ins;

  update formation_action_plans p
     set notified_at = now()
   where p.due_at <= now() and p.notified_at is null and p.done_at is null;
  return n;
end;
$$;
revoke all on function public.jm_formation_reminders() from public, anon, authenticated;

-- 5. app_jobs_ping : même corps qu'avant (migration 188), plus les rappels en tête.
create or replace function public.app_jobs_ping()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  s text;
  flags text := '';
begin
  begin
    perform public.jm_formation_reminders();
  exception when others then
    null; -- un rappel en échec ne bloque jamais les autres travaux
  end;

  perform public.social_dispatch_ping();

  if exists (
    select 1 from public.site_rebuild_state
     where requested_at is not null
       and (triggered_at is null or triggered_at < now() - interval '4 minutes')
  ) then
    flags := flags || '&site=1';
  end if;

  if exists (
    select 1 from public.ical_feeds
     where coalesce(url, '') <> ''
       and (last_synced is null or last_synced < now() - interval '60 minutes')
       and (coalesce(consecutive_failures, 0) < 3 or last_sync_error_at is null or last_sync_error_at < now() - interval '6 hours')
  ) then
    flags := flags || '&ical=1';
  end if;

  if flags = '' then
    return;
  end if;
  select value into s from public.social_settings where key = 'cron_secret';
  if s is null or s = '' then
    return;
  end if;
  perform net.http_get(
    url := 'https://app.jasonmarinho.com/api/cron/jobs?pg=1' || flags,
    headers := jsonb_build_object('Authorization', 'Bearer ' || s),
    timeout_milliseconds := 60000
  );
end;
$function$;
