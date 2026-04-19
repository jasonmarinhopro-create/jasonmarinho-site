-- Update category CHECK constraint on calendar_events to include renamed categories
-- 'menage' replaces 'entretien', 'tache' replaces 'admin'
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.calendar_events'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%category%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.calendar_events DROP CONSTRAINT ' || quote_ident(v_constraint);
  END IF;
END $$;

ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_category_check
  CHECK (category IN ('arrivee','depart','menage','entretien','rdv','tache','admin','note'));

-- Migrate existing rows to new category names
UPDATE public.calendar_events SET category = 'menage' WHERE category = 'entretien';
UPDATE public.calendar_events SET category = 'tache'  WHERE category = 'admin';
