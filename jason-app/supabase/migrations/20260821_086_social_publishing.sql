-- Publication automatique multi-réseaux (v1 : Facebook + Instagram, extensible).
-- 3 tables : le compte connecté, le post écrit une fois, le résultat par
-- réseau (pour qu'un échec sur une plateforme n'affecte pas les autres).

CREATE TABLE IF NOT EXISTS social_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform              TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'pinterest', 'x', 'tiktok')),
  external_account_id   TEXT NOT NULL,
  display_name          TEXT,
  access_token          TEXT NOT NULL, -- chiffré (AES-256-GCM) avant écriture, cf. lib/security/crypto.ts
  refresh_token         TEXT,          -- idem, si la plateforme en fournit un
  token_expires_at      TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_account_id)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body          TEXT NOT NULL DEFAULT '',
  media_urls    TEXT[] NOT NULL DEFAULT '{}',
  platforms     TEXT[] NOT NULL DEFAULT '{}',
  scheduled_at  TIMESTAMPTZ,      -- NULL = publication immédiate
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'done', 'partial', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_post_targets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform           TEXT NOT NULL,
  account_id         UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  external_post_id   TEXT,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  error              TEXT,
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_due ON social_posts (scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_post_targets_post ON social_post_targets (post_id);

ALTER TABLE social_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_targets  ENABLE ROW LEVEL SECURITY;

-- Usage interne admin uniquement (comptes de l'entreprise, pas multi-hôte).
-- L'app lit/écrit via le client service-role (bypass RLS), ces policies
-- sont une protection defense-in-depth si jamais un accès client direct existait.
CREATE POLICY "admin_all_social_accounts" ON social_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_social_posts" ON social_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_social_post_targets" ON social_post_targets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
