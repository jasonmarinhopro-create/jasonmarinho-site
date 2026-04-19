-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  category TEXT DEFAULT 'general',
  cover_image_url TEXT,
  reading_time INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read published posts
CREATE POLICY "members_read_published_blog" ON blog_posts
  FOR SELECT TO authenticated
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "admin_all_blog" ON blog_posts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

-- Sample post
INSERT INTO blog_posts (title, slug, summary, content, category, reading_time, is_published, published_at)
VALUES (
  'Bienvenue sur le blog Jason Marinho',
  'bienvenue-blog',
  'Le blog est en ligne. Retrouve ici mes conseils, retours d''expérience et analyses du marché de la location courte durée.',
  'Bienvenue sur le blog de la plateforme Jason Marinho.

Ici, je partage mes conseils, mes retours d''expérience et mes analyses du marché LCD.

Que tu sois débutant ou hôte confirmé, tu trouveras des articles pour t''aider à développer ton activité sereinement.

À très vite.',
  'general',
  2,
  true,
  NOW()
);
