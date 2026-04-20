-- Table roadmap_items
CREATE TABLE IF NOT EXISTS roadmap_items (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'suggestion'
                          CHECK (status IN ('suggestion', 'planned', 'in_progress', 'done')),
  author_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  upvotes     INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire
CREATE POLICY "read_roadmap" ON roadmap_items
  FOR SELECT USING (true);

-- Seuls les contributeurs peuvent suggérer
CREATE POLICY "contributors_insert" ON roadmap_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND is_contributor = true
    )
  );

-- Admin peut tout modifier (statut, votes, etc.)
CREATE POLICY "admin_update_roadmap" ON roadmap_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND email = 'djason.marinho@gmail.com'
    )
  );

CREATE POLICY "admin_delete_roadmap" ON roadmap_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND email = 'djason.marinho@gmail.com'
    )
  );
