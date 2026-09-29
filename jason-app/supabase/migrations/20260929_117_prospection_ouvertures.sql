-- Prospection : mesure des ouvertures conforme à la recommandation CNIL du
-- 12 mars 2026 sur les pixels de suivi (délibération 2026-042).
-- Sans consentement, seuls sont permis :
--   1. un taux d'ouverture global et anonyme (compteur par e-mail de séquence,
--      jamais rattaché à une personne) ;
--   2. pour la délivrabilité, la date (sans l'heure) de la dernière ouverture
--      d'un contact (repérer les adresses inactives).
-- Aucune ouverture n'est enregistrée par envoi ni par personne au-delà de ça.

CREATE TABLE IF NOT EXISTS public.outreach_open_stats (
  sequence_id    uuid NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  step_position  integer NOT NULL,
  opens          integer NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sequence_id, step_position)
);
ALTER TABLE public.outreach_open_stats ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS last_open_on date;

CREATE OR REPLACE FUNCTION public.outreach_count_open(p_sequence uuid, p_step integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.outreach_open_stats (sequence_id, step_position, opens, updated_at)
  VALUES (p_sequence, p_step, 1, now())
  ON CONFLICT (sequence_id, step_position)
  DO UPDATE SET opens = outreach_open_stats.opens + 1, updated_at = now();
$$;
REVOKE ALL ON FUNCTION public.outreach_count_open(uuid, integer) FROM PUBLIC, anon, authenticated;
