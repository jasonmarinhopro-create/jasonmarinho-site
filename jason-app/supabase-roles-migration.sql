-- ============================================================
-- MIGRATION : Rôles utilisateurs & statut Driing
-- À exécuter dans Supabase → SQL Editor → New query
-- ============================================================


-- 1. Nouvelles colonnes sur profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text
    CHECK (role IN ('user', 'driing', 'admin'))
    DEFAULT 'user' NOT NULL,
  ADD COLUMN IF NOT EXISTS driing_status text
    CHECK (driing_status IN ('none', 'pending', 'confirmed'))
    DEFAULT 'none' NOT NULL;


-- 2. Fonction helper is_admin()
--    SECURITY DEFINER = bypass RLS → évite la récursion infinie
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 3. Mise à jour du trigger de création de profil
--    Lit is_driing_member depuis les user_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, driing_status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    CASE
      WHEN (new.raw_user_meta_data->>'is_driing_member') = 'true' THEN 'pending'
      ELSE 'none'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    driing_status = EXCLUDED.driing_status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Mise à jour des RLS de profiles
-- ============================================================
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Select own or admin"   ON public.profiles;
DROP POLICY IF EXISTS "Update own or admin"   ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile"    ON public.profiles;

-- Lecture : chacun voit son profil, admin voit tous
CREATE POLICY "Select own or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Mise à jour : chacun modifie son profil, admin modifie tous
CREATE POLICY "Update own or admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Insert : via trigger + API route
CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());


-- 5. RLS reported_guests : admin lit tout et peut valider
-- ============================================================
DROP POLICY IF EXISTS "Auth users read validated reports" ON public.reported_guests;
DROP POLICY IF EXISTS "Read validated or admin reads all" ON public.reported_guests;
DROP POLICY IF EXISTS "Admin update reports"              ON public.reported_guests;
DROP POLICY IF EXISTS "Auth users insert reports"         ON public.reported_guests;

CREATE POLICY "Read validated or admin reads all" ON public.reported_guests
  FOR SELECT USING (
    (auth.role() = 'authenticated' AND is_validated = true)
    OR public.is_admin()
  );

CREATE POLICY "Admin update reports" ON public.reported_guests
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Auth users insert reports" ON public.reported_guests
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);


-- 6. RLS suggestions : admin lit toutes les suggestions
-- ============================================================
DROP POLICY IF EXISTS "Auth users read own suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Read own or admin reads all"     ON public.suggestions;

CREATE POLICY "Read own or admin reads all" ON public.suggestions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());


-- ============================================================
-- 7. TE METTRE EN ADMIN
--    Remplace l'email ci-dessous par le tien, puis exécute.
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'ton-email@jasonmarinho.com';
