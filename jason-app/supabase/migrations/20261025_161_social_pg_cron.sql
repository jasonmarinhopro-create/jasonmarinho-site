-- Publication des posts et stories à l'heure (25/10/2026). Les passages
-- programmés de GitHub arrivent avec 2 à 5 h de retard et les crons Vercel
-- Hobby ne sont garantis qu'à l'heure près : le 24 et le 25/10, le carrousel,
-- la première série de stories et le post du dimanche ont dû partir à la main.
-- pg_cron (dans la base, à la minute) appelle la route de publication de
-- l'app avec le secret SOCIAL_CRON_SECRET, recopié dans social_settings
-- (clé cron_secret) par le workflow « Réseaux sociaux » ; sans lui, rien ne
-- part (la fonction ne fait rien).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.social_dispatch_ping()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s text;
begin
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

-- Stories des jours sans post (11 h UTC), posts (17 h UTC), puis deux reprises :
-- Instagram finit de traiter un Reel, et les stories d'un post partent une
-- fois le post en ligne. cron.schedule met à jour un job du même nom.
select cron.schedule('social-dispatch-1102', '2 11 * * *', 'select public.social_dispatch_ping()');
select cron.schedule('social-dispatch-1702', '2 17 * * *', 'select public.social_dispatch_ping()');
select cron.schedule('social-dispatch-1720', '20 17 * * *', 'select public.social_dispatch_ping()');
select cron.schedule('social-dispatch-1740', '40 17 * * *', 'select public.social_dispatch_ping()');
