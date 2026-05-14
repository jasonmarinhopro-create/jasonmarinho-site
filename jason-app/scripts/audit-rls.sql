-- ═══════════════════════════════════════════════════════════════════════
-- AUDIT RLS — à exécuter dans le SQL Editor Supabase
-- ═══════════════════════════════════════════════════════════════════════
-- Vérifie que toutes les tables du schéma 'public' ont RLS activée.
-- Retourne uniquement celles SANS RLS → à corriger ou à confirmer comme
-- intentionnel (ex: tables de seed publiques en lecture seule).

select
  relname as table_name,
  case
    when relrowsecurity then 'RLS_ON'
    else 'RLS_OFF ⚠️'
  end as rls_status
from pg_class
where relkind = 'r'
  and relnamespace = 'public'::regnamespace
  and relname not like 'pg_%'
order by relrowsecurity asc, relname;

-- ═══════════════════════════════════════════════════════════════════════
-- Variante : ne montrer QUE les tables sans RLS
-- ═══════════════════════════════════════════════════════════════════════
-- select relname from pg_class
-- where relkind = 'r'
--   and relnamespace = 'public'::regnamespace
--   and not relrowsecurity
-- order by relname;

-- ═══════════════════════════════════════════════════════════════════════
-- Bonus : compter les policies par table (pour repérer les tables
-- avec RLS activée mais aucune policy → tout est bloqué)
-- ═══════════════════════════════════════════════════════════════════════
-- select
--   schemaname,
--   tablename,
--   count(*) as nb_policies
-- from pg_policies
-- where schemaname = 'public'
-- group by 1, 2
-- order by 3 desc;
