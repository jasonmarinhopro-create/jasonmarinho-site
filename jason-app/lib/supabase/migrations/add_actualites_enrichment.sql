-- Migration : enrichissement de la page Actualités
-- Ajoute : suivi des lectures, favoris, deadlines et épinglage
--
-- À exécuter dans Supabase SQL Editor

-- ─── 1) Suivi des articles lus par l'utilisateur ───────────────────────────
CREATE TABLE IF NOT EXISTS user_actualite_reads (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actualite_id  UUID         NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  read_at       TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, actualite_id)
);

CREATE INDEX IF NOT EXISTS idx_user_actu_reads_user ON user_actualite_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actu_reads_actu ON user_actualite_reads(actualite_id);

ALTER TABLE user_actualite_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_actu_reads_select_own" ON user_actualite_reads;
CREATE POLICY "user_actu_reads_select_own" ON user_actualite_reads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_actu_reads_insert_own" ON user_actualite_reads;
CREATE POLICY "user_actu_reads_insert_own" ON user_actualite_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_actu_reads_delete_own" ON user_actualite_reads;
CREATE POLICY "user_actu_reads_delete_own" ON user_actualite_reads
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 2) Favoris ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_actualite_favorites (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actualite_id  UUID         NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, actualite_id)
);

CREATE INDEX IF NOT EXISTS idx_user_actu_fav_user ON user_actualite_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actu_fav_actu ON user_actualite_favorites(actualite_id);

ALTER TABLE user_actualite_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_actu_fav_select_own" ON user_actualite_favorites;
CREATE POLICY "user_actu_fav_select_own" ON user_actualite_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_actu_fav_insert_own" ON user_actualite_favorites;
CREATE POLICY "user_actu_fav_insert_own" ON user_actualite_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_actu_fav_delete_own" ON user_actualite_favorites;
CREATE POLICY "user_actu_fav_delete_own" ON user_actualite_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 3) Champs deadline + épinglage sur actualites ─────────────────────────
ALTER TABLE actualites
  ADD COLUMN IF NOT EXISTS deadline_date  DATE     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_pinned      BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regions        TEXT[]   DEFAULT '{}'::TEXT[];

-- Index pour requêter rapidement les actus épinglées et celles avec deadline
CREATE INDEX IF NOT EXISTS idx_actualites_pinned ON actualites(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_actualites_deadline ON actualites(deadline_date) WHERE deadline_date IS NOT NULL;
