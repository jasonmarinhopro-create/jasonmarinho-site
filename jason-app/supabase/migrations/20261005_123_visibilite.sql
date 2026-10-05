-- Visibilité (05/10/2026) : statistiques des fiches pros façon Driing et
-- page « Visibilité » de l'admin.
--
-- 1. site_visits : pays, région, ville (déduits par Vercel de l'adresse IP,
--    l'IP elle-même n'est jamais stockée), type d'écran (déduit du
--    navigateur, le navigateur n'est pas stocké) et temps passé sur la page.
--    Toujours aucune donnée qui identifie une personne.
-- 2. Clics des fiches pros par jour (portfolio, site, Instagram), pour les
--    voir sur une période et pas seulement en cumul.
--
-- Le code tolère l'absence de cette migration (anciennes colonnes seules).

-- ── 1. Visites enrichies ─────────────────────────────────────────────
ALTER TABLE public.site_visits
  ADD COLUMN IF NOT EXISTS country    text,
  ADD COLUMN IF NOT EXISTS region     text,
  ADD COLUMN IF NOT EXISTS city       text,
  ADD COLUMN IF NOT EXISTS device     text CHECK (device IS NULL OR device IN ('mobile', 'tablet', 'desktop')),
  ADD COLUMN IF NOT EXISTS duration_s integer CHECK (duration_s IS NULL OR (duration_s >= 0 AND duration_s <= 3600));

CREATE INDEX IF NOT EXISTS site_visits_path_created_idx
  ON public.site_visits (path, created_at DESC);

-- ── 2. Clics des fiches par jour ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pro_fiche_clicks_daily (
  kind    text NOT NULL CHECK (kind IN ('photographer', 'cleaner')),
  pro_id  uuid NOT NULL,
  day     date NOT NULL,
  event   text NOT NULL CHECK (event IN ('portfolio', 'site', 'instagram')),
  clicks  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, pro_id, day, event)
);
ALTER TABLE public.pro_fiche_clicks_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro_fiche_clicks_select_own" ON public.pro_fiche_clicks_daily;
CREATE POLICY "pro_fiche_clicks_select_own" ON public.pro_fiche_clicks_daily
  FOR SELECT USING (
    (kind = 'photographer' AND EXISTS (SELECT 1 FROM public.photographers p WHERE p.id = pro_id AND p.user_id = auth.uid()))
    OR (kind = 'cleaner' AND EXISTS (SELECT 1 FROM public.cleaners c WHERE c.id = pro_id AND c.user_id = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.increment_pro_fiche_click_daily(p_kind text, p_id uuid, p_event text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.pro_fiche_clicks_daily (kind, pro_id, day, event, clicks)
  VALUES (p_kind, p_id, (now() AT TIME ZONE 'Europe/Paris')::date, p_event, 1)
  ON CONFLICT (kind, pro_id, day, event) DO UPDATE SET clicks = public.pro_fiche_clicks_daily.clicks + 1;
$$;
REVOKE ALL ON FUNCTION public.increment_pro_fiche_click_daily(text, uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.increment_pro_fiche_click_daily(text, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.increment_pro_fiche_click_daily(text, uuid, text) FROM authenticated;
