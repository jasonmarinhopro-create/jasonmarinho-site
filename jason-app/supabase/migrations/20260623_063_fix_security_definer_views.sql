-- ════════════════════════════════════════════════════════════════════
-- Fix advisors Supabase : views avec SECURITY DEFINER → SECURITY INVOKER
-- ════════════════════════════════════════════════════════════════════
-- Par défaut, Postgres crée les views avec `security_invoker = false`
-- (équivalent SECURITY DEFINER) : les requêtes via la view utilisent les
-- permissions du créateur (postgres super-user) au lieu de l'utilisateur
-- qui interroge. Ça contourne RLS, ce qui est un risque de sécurité
-- même pour des données publiques (un changement futur de RLS sur la
-- table sous-jacente serait silencieusement contourné).
--
-- Solution : forcer `security_invoker = true` pour respecter les RLS.
-- Comme nos 3 views ne servent qu'à exposer des données déjà filtrées
-- (status='active' + is_public=true), elles restent fonctionnelles avec
-- security_invoker car aucune RLS n'empêche la lecture des rows
-- correspondants (les serverless functions utilisent service role,
-- bypass total).
-- ════════════════════════════════════════════════════════════════════

alter view public.public_signalements_view set (security_invoker = true);
alter view public.public_photographers_view set (security_invoker = true);
alter view public.public_cleaners_view set (security_invoker = true);

-- Note : aucun changement fonctionnel attendu. Les build scripts statiques
-- (build-signalements.mjs, build-photographers.mjs, build-cleaners.mjs)
-- continuent à utiliser SUPABASE_SERVICE_ROLE_KEY qui bypass RLS de
-- toute façon. Les advisors Supabase passent désormais au vert pour ces
-- 3 ERRORS.
