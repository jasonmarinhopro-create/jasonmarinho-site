-- Publication des réseaux sociaux : un passage toutes les 10 minutes
-- (26/10/2026). Avant : 4 passages par jour (11 h 02, 17 h 02, 17 h 20,
-- 17 h 40 UTC, migration 161). Le carrousel du 26/10 a été publié sur Facebook
-- à 17 h 40, mais Instagram traitait encore le média au dernier passage : rien
-- n'a retenté avant le lendemain, et les stories (qui attendent le post) sont
-- restées bloquées. Un passage sans post dû ne fait qu'une lecture.
select cron.unschedule(jobname) from cron.job
 where jobname in ('social-dispatch-1102', 'social-dispatch-1702', 'social-dispatch-1720', 'social-dispatch-1740');
select cron.schedule('social-dispatch-10min', '*/10 * * * *', 'select public.social_dispatch_ping()');
