-- ───────────────────────────────────────────────────────────────────────
-- AUDIT RLS : activation pour tables legacy qui avaient des policies
-- mais sans 'enable row level security'
-- ───────────────────────────────────────────────────────────────────────
-- Contexte : dans supabase/schema.sql, partners / templates / community_groups
-- avaient une policy "Public read" mais sans `alter table enable row level
-- security`. Sans cet enable, Postgres ignore les policies et les tables
-- sont écrivables par n'importe quel user authentifié via l'anon key.
--
-- Cette migration corrige ça : RLS activée + policy de lecture publique
-- conservée (lecture seule pour anon/authenticated). Les writes admin
-- continuent à passer par la service_role qui bypass RLS.

-- ─── partners ───────────────────────────────────────────────────────────
alter table public.partners enable row level security;

-- (la policy existante "Public read partners" est préservée)
-- Sécurité supplémentaire : pas d'INSERT/UPDATE/DELETE pour anon/auth.
-- (par défaut, sans policy permissive, l'opération est refusée)

-- ─── templates ──────────────────────────────────────────────────────────
alter table public.templates enable row level security;

-- ─── community_groups ──────────────────────────────────────────────────
alter table public.community_groups enable row level security;
