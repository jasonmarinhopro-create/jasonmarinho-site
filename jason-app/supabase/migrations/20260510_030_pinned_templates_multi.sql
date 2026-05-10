-- Évolution : permettre plusieurs gabarits épinglés par phase, avec ordre.
-- Ex : pour "Avant l'arrivée" → 1) confirmation, 2) check-in J-2, 3) bienvenue J-1.
ALTER TABLE public.user_pinned_templates
  DROP CONSTRAINT IF EXISTS user_pinned_templates_pkey;

ALTER TABLE public.user_pinned_templates
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.user_pinned_templates
  ADD PRIMARY KEY (user_id, timing_bucket, template_id);

CREATE INDEX IF NOT EXISTS idx_user_pinned_templates_user_bucket_position
  ON public.user_pinned_templates(user_id, timing_bucket, position);
