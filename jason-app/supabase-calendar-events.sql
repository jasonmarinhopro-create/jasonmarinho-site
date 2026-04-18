-- Migration: calendrier personnel avec événements personnalisés
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  start_time  TIME,
  end_time    TIME,
  description TEXT,
  category    TEXT        NOT NULL DEFAULT 'note'
              CHECK (category IN ('arrivee', 'depart', 'entretien', 'admin', 'rdv', 'note')),
  logement_id UUID        REFERENCES public.logements(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar events"
  ON public.calendar_events
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date
  ON public.calendar_events(user_id, date);
