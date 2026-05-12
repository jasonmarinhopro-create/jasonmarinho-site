-- SOS Hôte Phase 3, mécaniques communauté.
-- Table sos_feedback : signalements / témoignages / suggestions sur les scénarios SOS.
-- Modération admin obligatoire avant intégration éventuelle dans le contenu.

CREATE TABLE IF NOT EXISTS sos_feedback (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    TEXT,
  user_name     TEXT,

  scenario      TEXT         NOT NULL,
  channel       TEXT         NOT NULL CHECK (channel IN ('airbnb','booking','vrbo','direct')),
  feedback_type TEXT         NOT NULL CHECK (feedback_type IN ('error','testimony','suggestion')),
  message       TEXT         NOT NULL,

  status        TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','rejected','done')),
  admin_note    TEXT,

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sos_feedback_status_idx
  ON sos_feedback(status, created_at DESC);

CREATE INDEX IF NOT EXISTS sos_feedback_scenario_idx
  ON sos_feedback(scenario, channel);

ALTER TABLE sos_feedback ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut créer un feedback s'il est authentifié.
DROP POLICY IF EXISTS "sos_feedback_authenticated_insert" ON sos_feedback;
CREATE POLICY "sos_feedback_authenticated_insert" ON sos_feedback
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- L'utilisateur peut lire ses propres feedbacks.
DROP POLICY IF EXISTS "sos_feedback_owner_read" ON sos_feedback;
CREATE POLICY "sos_feedback_owner_read" ON sos_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Les admins peuvent tout lire et modifier.
DROP POLICY IF EXISTS "sos_feedback_admin_all" ON sos_feedback;
CREATE POLICY "sos_feedback_admin_all" ON sos_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
