-- Vérification planifiée toutes les 15 minutes au lieu de 10 (18/11/2026,
-- audit des appels, accord de Jason). app_jobs_ping() n'appelle l'app que
-- s'il y a une publication réseaux sociaux due, une reconstruction du site
-- demandée ou un calendrier pas synchronisé depuis 1 h ; chaque passage écrit
-- 5 lignes de suivi dans cron.job_run_details. 144 passages par jour → 96.
-- Contrepartie : une publication programmée part au plus 15 min après l'heure.
-- Même nom de tâche (cron.schedule remplace la tâche du même nom) : rejouable.
select cron.schedule('social-dispatch-10min', '*/15 * * * *', 'select public.app_jobs_ping()');
