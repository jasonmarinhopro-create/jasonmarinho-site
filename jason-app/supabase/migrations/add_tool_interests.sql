-- Table pour les votes "M'intéresse" sur les outils du catalogue Écosystème LCD
-- Permet à Jason de voir quels outils intéressent le plus la communauté pour orienter les négociations de partenariats.

CREATE TABLE IF NOT EXISTS tool_interests (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug   TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, tool_slug)
);

CREATE INDEX IF NOT EXISTS idx_tool_interests_slug ON tool_interests(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_interests_user ON tool_interests(user_id);

ALTER TABLE tool_interests ENABLE ROW LEVEL SECURITY;

-- SELECT : tout utilisateur authentifié peut lire les votes
-- (nécessaire pour afficher les compteurs publics)
DROP POLICY IF EXISTS "tool_interests_select_all" ON tool_interests;
CREATE POLICY "tool_interests_select_all" ON tool_interests
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT : un utilisateur peut voter pour lui-même uniquement
DROP POLICY IF EXISTS "tool_interests_insert_own" ON tool_interests;
CREATE POLICY "tool_interests_insert_own" ON tool_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE : un utilisateur peut retirer son vote uniquement
DROP POLICY IF EXISTS "tool_interests_delete_own" ON tool_interests;
CREATE POLICY "tool_interests_delete_own" ON tool_interests
  FOR DELETE USING (auth.uid() = user_id);
