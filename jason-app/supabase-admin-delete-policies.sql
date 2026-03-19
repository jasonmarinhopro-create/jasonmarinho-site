-- ============================================================
-- MIGRATION : Politiques DELETE manquantes pour l'admin
-- À exécuter dans Supabase → SQL Editor → New query
-- ============================================================

-- Permet à l'admin de supprimer des signalements
CREATE POLICY "Admin delete reports" ON public.reported_guests
  FOR DELETE USING (public.is_admin());

-- Permet à l'admin de supprimer des suggestions
CREATE POLICY "Admin delete suggestions" ON public.suggestions
  FOR DELETE USING (public.is_admin());

-- Permet à l'admin de supprimer un profil (utilisé avant la suppression auth)
DROP POLICY IF EXISTS "Admin delete profile" ON public.profiles;
CREATE POLICY "Admin delete profile" ON public.profiles
  FOR DELETE USING (public.is_admin());
