-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : table actualites
-- Fil d'actualités LCD géré par l'admin, visible par tous les membres.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS actualites (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text        NOT NULL,
  summary      text        NOT NULL,
  source_url   text,
  category     text        NOT NULL DEFAULT 'general',
  is_published boolean     NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE actualites ENABLE ROW LEVEL SECURITY;

-- Membres authentifiés : lecture des articles publiés
CREATE POLICY "authenticated read published actualites"
  ON actualites FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admin : accès complet (lecture + écriture)
CREATE POLICY "admin full access actualites"
  ON actualites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
