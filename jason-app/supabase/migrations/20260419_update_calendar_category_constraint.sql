-- Update category CHECK constraint on calendar_events to include renamed categories
-- 'menage' replaces 'entretien', 'tache' replaces 'admin'

-- Drop old constraint if it exists (name may vary)
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_category_check;
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_category_key;

-- Add updated constraint with all allowed values (old + new)
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_category_check
  CHECK (category IN ('arrivee','depart','menage','entretien','rdv','tache','admin','note'));

-- Migrate existing rows to new category names
UPDATE public.calendar_events SET category = 'menage' WHERE category = 'entretien';
UPDATE public.calendar_events SET category = 'tache'  WHERE category = 'admin';
