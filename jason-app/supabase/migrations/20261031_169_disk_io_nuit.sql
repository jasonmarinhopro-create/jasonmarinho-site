-- Disk IO de la base (31/10/2026, demande de Jason : « le disk IO est presque
-- toujours saturé »). Mesure : la base écrivait environ 7 Mo de fichiers
-- temporaires par minute (10 Go par jour) sans aucune requête de notre part.
-- Source : pg_stat_statements gardait 4 800 requêtes ; le relevé de Supabase
-- (postgres_exporter, chaque minute) les trie et déborde sur le disque
-- (work_mem 4 Mo). Après remise à zéro : 0 fichier temporaire en 5 minutes.
--
-- 1. Remise à zéro chaque nuit (2 h 23 UTC) + purge du journal de pg_cron
--    (une ligne par passage, 144 par jour).
-- 2. Le passage de publication toutes les 10 minutes n'appelle l'app (pg_net,
--    une requête et une réponse écrites en base) que si un post est dû.

create or replace function public.jm_maintenance_nuit()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
begin
  perform extensions.pg_stat_statements_reset();
  delete from cron.job_run_details where start_time < now() - interval '3 days';
end;
$$;

revoke all on function public.jm_maintenance_nuit() from public, anon, authenticated;

select cron.schedule('maintenance-nuit', '23 2 * * *', 'select public.jm_maintenance_nuit()');

create or replace function public.social_dispatch_ping()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  s text;
begin
  -- Même condition que dispatchDuePosts (lib/social/dispatch.ts)
  if not exists (
    select 1 from public.social_posts
     where scheduled_at <= now()
       and (status = 'scheduled' or (status = 'publishing' and updated_at < now() - interval '15 minutes'))
  ) then
    return;
  end if;
  select value into s from public.social_settings where key = 'cron_secret';
  if s is null or s = '' then
    return;
  end if;
  perform net.http_get(
    url := 'https://app.jasonmarinho.com/api/cron/social-dispatch?pg=1',
    headers := jsonb_build_object('Authorization', 'Bearer ' || s),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function public.social_dispatch_ping() from public, anon, authenticated;
