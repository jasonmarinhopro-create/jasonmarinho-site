-- Ménage de la base chaque nuit (10/11/2026, étape 4 des fondations Supabase,
-- docs/claude/technique.md). S'ajoute à la remise à zéro de pg_stat_statements
-- et à la purge du journal de pg_cron (migration 169).
--   - app_errors de plus de 30 jours (avant : purge au hasard, 1 requête sur 100
--     du point d'envoi des erreurs, pendant que l'utilisateur attendait) ;
--   - site_visits de plus de 400 jours (Visibilité lit 2 × 3 mois, Provenance
--     100 jours, groupes Facebook 400 jours ; durée sous la limite de 25 mois
--     recommandée par la CNIL pour la mesure d'audience).
-- Une fois par nuit, en petites quantités : aucune charge en journée.

create or replace function public.jm_maintenance_nuit()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
begin
  perform extensions.pg_stat_statements_reset();
  delete from cron.job_run_details where start_time < now() - interval '3 days';
  delete from public.app_errors where created_at < now() - interval '30 days';
  delete from public.site_visits where created_at < now() - interval '400 days';
end;
$$;

revoke all on function public.jm_maintenance_nuit() from public, anon, authenticated;
