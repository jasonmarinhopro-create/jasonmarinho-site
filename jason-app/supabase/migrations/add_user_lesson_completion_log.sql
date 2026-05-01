-- Phase 6, Log temporel des complétions de leçons
-- Permet de calculer le streak (jours consécutifs d'apprentissage) et l'historique d'activité.
--
-- 1 ligne = 1 leçon marquée terminée à un instant T.
-- Si l'utilisateur "décoche" et "recoche", on log à nouveau (historique d'activité).

CREATE TABLE IF NOT EXISTS user_lesson_completion_log (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id    UUID         NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  lesson_id       INTEGER      NOT NULL,
  completed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_lesson_completion_log_user_date_idx
  ON user_lesson_completion_log(user_id, completed_at DESC);

ALTER TABLE user_lesson_completion_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lesson_completion_log_owner_all" ON user_lesson_completion_log;
CREATE POLICY "user_lesson_completion_log_owner_all" ON user_lesson_completion_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
