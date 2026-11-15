-- app_jobs_ping() n'est appelée que par pg_cron (rôle postgres), toutes les
-- 10 minutes. Elle restait appelable par n'importe qui via l'API
-- (/rest/v1/rpc/app_jobs_ping, signalé par Supabase le 15/11/2026) : un
-- inconnu pouvait déclencher à volonté l'appel de /api/cron/jobs. Même règle
-- que social_dispatch_ping() (migration 169). Rejouable.

revoke all on function public.app_jobs_ping() from public, anon, authenticated;
