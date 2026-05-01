-- Favoris au niveau FORMATION (différent du bookmark de leçon)
-- Permet de mettre en favori une formation entière depuis sa card.

CREATE TABLE IF NOT EXISTS user_formation_favorites (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id    UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  formation_slug  TEXT         NOT NULL,
  formation_title TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, formation_id)
);

CREATE INDEX IF NOT EXISTS user_formation_favorites_user_idx
  ON user_formation_favorites(user_id, created_at DESC);

ALTER TABLE user_formation_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_formation_favorites_owner_all" ON user_formation_favorites;
CREATE POLICY "user_formation_favorites_owner_all" ON user_formation_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
