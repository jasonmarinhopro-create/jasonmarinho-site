-- Cadence récurrente, texte personnalisé par réseau, stats d'engagement.

-- Cadence : une seule config partagée (jours de la semaine + heure), pas
-- une ligne par jour — plus simple à éditer et à afficher ("Lun · Mer ·
-- Ven à 18:00"). weekdays en ISO : 1 = lundi ... 7 = dimanche.
CREATE TABLE IF NOT EXISTS social_cadence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekdays    INT[] NOT NULL DEFAULT '{1,3,5}',
  time_of_day TEXT NOT NULL DEFAULT '18:00', -- HH:MM, heure locale Europe/Paris
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE social_cadence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_social_cadence" ON social_cadence;
CREATE POLICY "admin_all_social_cadence" ON social_cadence FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Texte personnalisé par réseau — NULL = utilise social_posts.body partagé.
ALTER TABLE social_post_targets
  ADD COLUMN IF NOT EXISTS body_override TEXT;

-- Stats d'engagement, rafraîchies à la demande depuis l'API Meta.
ALTER TABLE social_post_targets
  ADD COLUMN IF NOT EXISTS like_count        INT,
  ADD COLUMN IF NOT EXISTS comment_count     INT,
  ADD COLUMN IF NOT EXISTS stats_updated_at  TIMESTAMPTZ;
