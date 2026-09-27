-- Annuaire pros (photographes, équipes de ménage) :
--  1. Portfolio hébergé pour les photographes (photos affichées sur leur
--     fiche publique, chargées en direct par /api/photographer/portfolio :
--     pas besoin d'attendre un redéploiement du site).
--  2. Vues des fiches par jour, pour afficher « vues ce mois-ci » et la
--     tendance (views_count reste le cumul historique).

-- ── 1. Portfolio ─────────────────────────────────────────────────────
ALTER TABLE public.photographers
  ADD COLUMN IF NOT EXISTS portfolio_photos text[] NOT NULL DEFAULT '{}';

-- Bucket PUBLIC (les photos sont faites pour être vues sur la fiche publique).
-- Écritures uniquement côté serveur (URL signées générées après contrôle).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pro-portfolio', 'pro-portfolio', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "pro_portfolio_public_read" ON storage.objects;
CREATE POLICY "pro_portfolio_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pro-portfolio');

-- ── 2. Vues par jour ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pro_fiche_views_daily (
  kind    text NOT NULL CHECK (kind IN ('photographer', 'cleaner')),
  pro_id  uuid NOT NULL,
  day     date NOT NULL,
  views   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, pro_id, day)
);
ALTER TABLE public.pro_fiche_views_daily ENABLE ROW LEVEL SECURITY;

-- Chaque pro lit uniquement les vues de sa propre fiche.
DROP POLICY IF EXISTS "pro_fiche_views_select_own" ON public.pro_fiche_views_daily;
CREATE POLICY "pro_fiche_views_select_own" ON public.pro_fiche_views_daily
  FOR SELECT USING (
    (kind = 'photographer' AND EXISTS (SELECT 1 FROM public.photographers p WHERE p.id = pro_id AND p.user_id = auth.uid()))
    OR (kind = 'cleaner' AND EXISTS (SELECT 1 FROM public.cleaners c WHERE c.id = pro_id AND c.user_id = auth.uid()))
  );

-- Incrément atomique (jour en heure de Paris), service role uniquement,
-- appelé par api/photographer/track.js et api/cleaner/track.js.
CREATE OR REPLACE FUNCTION public.increment_pro_fiche_view_daily(p_kind text, p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.pro_fiche_views_daily (kind, pro_id, day, views)
  VALUES (p_kind, p_id, (now() AT TIME ZONE 'Europe/Paris')::date, 1)
  ON CONFLICT (kind, pro_id, day) DO UPDATE SET views = public.pro_fiche_views_daily.views + 1;
$$;
REVOKE ALL ON FUNCTION public.increment_pro_fiche_view_daily(text, uuid) FROM public;
REVOKE ALL ON FUNCTION public.increment_pro_fiche_view_daily(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_pro_fiche_view_daily(text, uuid) FROM authenticated;
