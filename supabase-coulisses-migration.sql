-- Les Coulisses de Jason: private journal for contributors
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS coulisses_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1200),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coulisses_posts ENABLE ROW LEVEL SECURITY;

-- Contributors can read (API also enforces this)
CREATE POLICY "contributors_read_coulisses"
  ON coulisses_posts FOR SELECT
  TO authenticated
  USING (
    (
      SELECT is_contributor FROM profiles
      WHERE profiles.id = auth.uid()
    ) = true
    OR
    (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) = 'djason.marinho@gmail.com'
  );

-- Only admin can insert
CREATE POLICY "admin_insert_coulisses"
  ON coulisses_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'djason.marinho@gmail.com'
  );

-- Only admin can delete
CREATE POLICY "admin_delete_coulisses"
  ON coulisses_posts FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'djason.marinho@gmail.com'
  );
