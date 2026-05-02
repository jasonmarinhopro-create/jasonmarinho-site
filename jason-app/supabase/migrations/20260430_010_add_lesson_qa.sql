-- Phase 8, Q&A et commentaires par leçon
-- Permet aux apprenants de poser des questions ou commenter une leçon.
-- Réponses possibles (notamment de Jason via author_role).

CREATE TABLE IF NOT EXISTS lesson_comments (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id    UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  lesson_id       INTEGER      NOT NULL,
  parent_id       UUID         DEFAULT NULL REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content         TEXT         NOT NULL CHECK (char_length(content) <= 4000),
  display_name    TEXT         DEFAULT NULL,
  author_role     TEXT         DEFAULT 'student', -- 'student', 'author' (Jason), 'admin'
  is_visible      BOOLEAN      DEFAULT TRUE,      -- modération admin
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_comments_lesson_idx
  ON lesson_comments(formation_id, lesson_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lesson_comments_parent_idx
  ON lesson_comments(parent_id) WHERE parent_id IS NOT NULL;

ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

-- Tous les utilisateurs authentifiés peuvent lire les commentaires visibles
DROP POLICY IF EXISTS "lesson_comments_authenticated_read" ON lesson_comments;
CREATE POLICY "lesson_comments_authenticated_read" ON lesson_comments
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_visible = TRUE);

-- Insertion : owner only
DROP POLICY IF EXISTS "lesson_comments_owner_insert" ON lesson_comments;
CREATE POLICY "lesson_comments_owner_insert" ON lesson_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update / delete : owner only (modération admin via service role)
DROP POLICY IF EXISTS "lesson_comments_owner_update" ON lesson_comments;
CREATE POLICY "lesson_comments_owner_update" ON lesson_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_comments_owner_delete" ON lesson_comments;
CREATE POLICY "lesson_comments_owner_delete" ON lesson_comments
  FOR DELETE USING (auth.uid() = user_id);
