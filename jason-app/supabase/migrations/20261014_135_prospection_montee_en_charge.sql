-- Montée en charge de la prospection (14/10/2026) : le plafond quotidien
-- monte tout seul si les envois se passent bien (peu de rebonds, aucun
-- refus), baisse sur de mauvais signaux. Décision une fois par jour d'envoi,
-- gardée dans un petit journal. Rejouable sans casse.
ALTER TABLE public.outreach_settings
  ADD COLUMN IF NOT EXISTS warmup_enabled      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS warmup_ceiling      integer NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS warmup_checked_on   date,
  ADD COLUMN IF NOT EXISTS warmup_last_change  date,
  ADD COLUMN IF NOT EXISTS warmup_last_cut     date,
  ADD COLUMN IF NOT EXISTS warmup_log          jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.outreach_settings
    ADD CONSTRAINT outreach_settings_warmup_ceiling_chk CHECK (warmup_ceiling BETWEEN 10 AND 90);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lectures de la fenêtre de 7 jours
CREATE INDEX IF NOT EXISTS outreach_suppressions_created_idx ON public.outreach_suppressions (created_at);
