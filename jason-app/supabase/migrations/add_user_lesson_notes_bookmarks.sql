-- Phase 2 + 3, Notes personnelles & favoris/bookmarks par leçon
-- Permet aux apprenants de prendre des notes sur chaque leçon et de bookmarker leurs leçons clés.

-- Notes : 1 note par (user, formation, lesson), upsert
CREATE TABLE IF NOT EXISTS user_lesson_notes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id    UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  lesson_id       INTEGER      NOT NULL,
  module_id       INTEGER      NOT NULL,
  content         TEXT         DEFAULT '',
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, formation_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_lesson_notes_user_formation_idx
  ON user_lesson_notes(user_id, formation_id);

ALTER TABLE user_lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lesson_notes_owner_all" ON user_lesson_notes;
CREATE POLICY "user_lesson_notes_owner_all" ON user_lesson_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Favoris : 1 ligne par (user, formation, lesson) bookmarkée
CREATE TABLE IF NOT EXISTS user_lesson_bookmarks (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id    UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  lesson_id       INTEGER      NOT NULL,
  module_id       INTEGER      NOT NULL,
  lesson_title    TEXT         NOT NULL,
  formation_slug  TEXT         NOT NULL,
  formation_title TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, formation_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_lesson_bookmarks_user_idx
  ON user_lesson_bookmarks(user_id, created_at DESC);

ALTER TABLE user_lesson_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lesson_bookmarks_owner_all" ON user_lesson_bookmarks;
CREATE POLICY "user_lesson_bookmarks_owner_all" ON user_lesson_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
