-- Réponse automatique en message privé quand un commentaire Facebook/
-- Instagram contient un mot-clé donné ("commente GUIDE pour recevoir le
-- lien"). Meta ne donne jamais l'email d'un commentateur (confidentialité) :
-- la seule voie automatisée est la réponse privée (DM) au commentaire, via
-- l'endpoint /{comment-id}/private_replies, avec le token de Page déjà
-- stocké dans social_accounts.

CREATE TABLE IF NOT EXISTS social_comment_triggers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'both')),
  keyword       TEXT NOT NULL,
  reply_message TEXT NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journal des réponses envoyées — sert aussi de verrou d'idempotence
-- (Meta redélivre parfois le même événement webhook) via la contrainte
-- unique (platform, comment_id).
CREATE TABLE IF NOT EXISTS social_comment_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id      UUID REFERENCES social_comment_triggers(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL,
  comment_id      TEXT NOT NULL,
  post_id         TEXT,
  commenter_name  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_social_comment_triggers_active ON social_comment_triggers (active) WHERE active;
CREATE INDEX IF NOT EXISTS idx_social_comment_replies_created ON social_comment_replies (created_at DESC);

ALTER TABLE social_comment_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comment_replies  ENABLE ROW LEVEL SECURITY;

-- Usage interne admin uniquement, même raisonnement que social_accounts :
-- l'app lit/écrit via le client service-role, ces policies sont une
-- protection defense-in-depth.
CREATE POLICY "admin_all_social_comment_triggers" ON social_comment_triggers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_social_comment_replies" ON social_comment_replies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
