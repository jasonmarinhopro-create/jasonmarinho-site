-- Permet d'épingler 1 gabarit "principal" par phase (avant/pendant/après) par utilisateur.
-- Utilisé par la page /dashboard/gabarits pour le mode "Mes 3 messages".
CREATE TABLE IF NOT EXISTS public.user_pinned_templates (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timing_bucket  TEXT NOT NULL CHECK (timing_bucket IN ('avant-arrivee', 'pendant-sejour', 'apres-depart')),
  template_id    uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, timing_bucket)
);

ALTER TABLE public.user_pinned_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pinned templates"
  ON public.user_pinned_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pinned templates"
  ON public.user_pinned_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pinned templates"
  ON public.user_pinned_templates FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned templates"
  ON public.user_pinned_templates FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_pinned_templates_user_id
  ON public.user_pinned_templates(user_id);
