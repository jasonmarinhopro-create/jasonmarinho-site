-- Migration v2 : événements multi-jours + intégrations iCal

-- 1. Colonne end_date pour les événements multi-jours
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Table des flux iCal importés
CREATE TABLE IF NOT EXISTS public.ical_feeds (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  url         TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#60a5fa',
  last_synced TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ical_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own ical feeds"
  ON public.ical_feeds FOR ALL USING (auth.uid() = user_id);

-- 3. Table des événements synchronisés depuis des flux iCal
CREATE TABLE IF NOT EXISTS public.ical_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id     UUID        NOT NULL REFERENCES public.ical_feeds(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uid         TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE,
  start_time  TIME,
  end_time    TIME,
  description TEXT,
  UNIQUE(feed_id, uid)
);
ALTER TABLE public.ical_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own ical events"
  ON public.ical_events FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ical_events_user_date
  ON public.ical_events(user_id, start_date);

-- 4. Token d'export iCal dans les profils
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ical_token UUID DEFAULT gen_random_uuid();
UPDATE public.profiles SET ical_token = gen_random_uuid() WHERE ical_token IS NULL;
