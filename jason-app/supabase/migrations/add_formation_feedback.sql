-- Phase 7 — Notation par leçon (👍/👎) + avis par formation
-- Permet aux apprenants de donner un retour rapide par leçon et un avis détaillé par formation.

-- Feedback par leçon (utile / pas utile)
CREATE TABLE IF NOT EXISTS lesson_feedback (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id  UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  lesson_id     INTEGER      NOT NULL,
  vote          SMALLINT     NOT NULL,  -- 1 = utile, -1 = pas utile
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, formation_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS lesson_feedback_formation_idx
  ON lesson_feedback(formation_id, lesson_id);

ALTER TABLE lesson_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_feedback_owner_write" ON lesson_feedback;
CREATE POLICY "lesson_feedback_owner_write" ON lesson_feedback
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lesson_feedback_authenticated_read" ON lesson_feedback;
CREATE POLICY "lesson_feedback_authenticated_read" ON lesson_feedback
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Avis publics par formation (affichés sur la page formation)
CREATE TABLE IF NOT EXISTS formation_reviews (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id    UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  rating          SMALLINT     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT         DEFAULT NULL,
  display_name    TEXT         DEFAULT NULL, -- prénom affiché publiquement (optionnel)
  is_public       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, formation_id)
);

CREATE INDEX IF NOT EXISTS formation_reviews_formation_idx
  ON formation_reviews(formation_id, created_at DESC);

ALTER TABLE formation_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formation_reviews_owner_write" ON formation_reviews;
CREATE POLICY "formation_reviews_owner_write" ON formation_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "formation_reviews_public_read" ON formation_reviews;
CREATE POLICY "formation_reviews_public_read" ON formation_reviews
  FOR SELECT USING (is_public = TRUE);
