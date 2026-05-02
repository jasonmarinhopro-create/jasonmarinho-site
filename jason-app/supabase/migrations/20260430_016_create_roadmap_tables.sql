-- ================================================================
-- MIGRATION : Tables Roadmap (items, comments, votes)
-- ================================================================
-- À exécuter dans Supabase → SQL Editor
-- Idempotent : CREATE TABLE IF NOT EXISTS
-- ================================================================

-- 1. Items de roadmap
CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  status      text        NOT NULL DEFAULT 'suggestion'
              CHECK (status IN ('suggestion', 'planned', 'in_progress', 'done')),
  author_id   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Commentaires par item
CREATE TABLE IF NOT EXISTS public.roadmap_comments (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id     uuid        NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  author_id   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Votes (un vote par utilisateur par item)
CREATE TABLE IF NOT EXISTS public.roadmap_votes (
  user_id    uuid        NOT NULL,
  item_id    uuid        NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- 4. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_item_id ON public.roadmap_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item_id    ON public.roadmap_votes(item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_user_id    ON public.roadmap_votes(user_id);

-- 5. RLS
ALTER TABLE public.roadmap_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_votes    ENABLE ROW LEVEL SECURITY;

-- roadmap_items : tous les authentifiés peuvent lire et insérer
-- l'autorisation admin est gérée côté serveur (server actions)
DROP POLICY IF EXISTS "roadmap_items_select" ON public.roadmap_items;
DROP POLICY IF EXISTS "roadmap_items_insert" ON public.roadmap_items;
DROP POLICY IF EXISTS "roadmap_items_update" ON public.roadmap_items;
DROP POLICY IF EXISTS "roadmap_items_delete" ON public.roadmap_items;

CREATE POLICY "roadmap_items_select" ON public.roadmap_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "roadmap_items_insert" ON public.roadmap_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "roadmap_items_update" ON public.roadmap_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roadmap_items_delete" ON public.roadmap_items
  FOR DELETE TO authenticated USING (true);

-- roadmap_comments
DROP POLICY IF EXISTS "roadmap_comments_select" ON public.roadmap_comments;
DROP POLICY IF EXISTS "roadmap_comments_insert" ON public.roadmap_comments;
DROP POLICY IF EXISTS "roadmap_comments_delete" ON public.roadmap_comments;

CREATE POLICY "roadmap_comments_select" ON public.roadmap_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "roadmap_comments_insert" ON public.roadmap_comments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "roadmap_comments_delete" ON public.roadmap_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- roadmap_votes
DROP POLICY IF EXISTS "roadmap_votes_select" ON public.roadmap_votes;
DROP POLICY IF EXISTS "roadmap_votes_insert" ON public.roadmap_votes;
DROP POLICY IF EXISTS "roadmap_votes_delete" ON public.roadmap_votes;

CREATE POLICY "roadmap_votes_select" ON public.roadmap_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "roadmap_votes_insert" ON public.roadmap_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "roadmap_votes_delete" ON public.roadmap_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Vérification
SELECT
  table_name,
  COUNT(*) AS nb_rows
FROM (
  SELECT 'roadmap_items'    AS table_name FROM public.roadmap_items
  UNION ALL
  SELECT 'roadmap_comments' FROM public.roadmap_comments
  UNION ALL
  SELECT 'roadmap_votes'    FROM public.roadmap_votes
) t
GROUP BY table_name;
