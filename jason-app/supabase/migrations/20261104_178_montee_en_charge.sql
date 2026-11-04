-- Montée en charge (04/11/2026, objectif de Jason : plus de 1 000 pros dans
-- les annuaires et beaucoup d'hôtes qui synchronisent Airbnb, Booking…).
--
-- 1. Index manquants (colonne user_id sans index, lectures par compte).
create index if not exists ical_feeds_user_idx on public.ical_feeds (user_id);
create index if not exists revenus_entries_user_date_idx on public.revenus_entries (user_id, date_paiement desc);
create index if not exists suggestions_user_idx on public.suggestions (user_id);
create index if not exists user_facebook_posts_user_idx on public.user_facebook_posts (user_id);

-- 2. Reconstructions du site regroupées : une fiche mise en ligne pendant
-- qu'une reconstruction vient de partir est notée ici (requested_at) et
-- partira au passage suivant de la tâche des 10 minutes (lib/pros/site-rebuild.ts).
create table if not exists public.site_rebuild_state (
  id int primary key default 1 check (id = 1),
  requested_at timestamptz,
  triggered_at timestamptz
);
alter table public.site_rebuild_state enable row level security;
insert into public.site_rebuild_state (id) values (1) on conflict (id) do nothing;

-- 3. Une seule tâche toutes les 10 minutes qui n'appelle l'app que s'il y a
-- du travail : publications des réseaux (comme avant), reconstruction du site
-- en attente, calendriers iCal pas synchronisés depuis une heure (ceux en
-- échec répété attendent 6 h). Rien d'appelé = rien de consommé chez Vercel.
create or replace function public.app_jobs_ping()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  s text;
  flags text := '';
begin
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
$$;

-- Même nom de tâche : cron.schedule met à jour la commande existante
select cron.schedule('social-dispatch-10min', '*/10 * * * *', 'select public.app_jobs_ping()');
