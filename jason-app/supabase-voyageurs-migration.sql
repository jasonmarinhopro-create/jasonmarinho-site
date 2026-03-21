-- Migration: Mes Voyageurs
-- Annuaire des voyageurs avec historique de séjours

-- Table principale: profils voyageurs
CREATE TABLE IF NOT EXISTS public.voyageurs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom      TEXT NOT NULL,
  nom         TEXT NOT NULL,
  email       TEXT,
  telephone   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS voyageurs_user_id_idx ON public.voyageurs(user_id);
CREATE INDEX IF NOT EXISTS voyageurs_email_idx   ON public.voyageurs(email);

-- Table des séjours associés
CREATE TABLE IF NOT EXISTS public.sejours (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voyageur_id            UUID NOT NULL REFERENCES public.voyageurs(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logement               TEXT,
  date_arrivee           DATE NOT NULL,
  date_depart            DATE NOT NULL,
  montant                NUMERIC(10,2),
  contrat_statut         TEXT DEFAULT 'non_requis'
                           CHECK (contrat_statut IN ('signe', 'en_attente', 'non_requis')),
  contrat_date_signature DATE,
  contrat_lien           TEXT,
  created_at             TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS sejours_voyageur_id_idx ON public.sejours(voyageur_id);
CREATE INDEX IF NOT EXISTS sejours_user_id_idx     ON public.sejours(user_id);

-- RLS
ALTER TABLE public.voyageurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sejours   ENABLE ROW LEVEL SECURITY;

-- Chaque hôte gère uniquement ses propres voyageurs
DROP POLICY IF EXISTS "Users manage own voyageurs" ON public.voyageurs;
CREATE POLICY "Users manage own voyageurs" ON public.voyageurs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own sejours" ON public.sejours;
CREATE POLICY "Users manage own sejours" ON public.sejours
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin accès total
DROP POLICY IF EXISTS "Admin all voyageurs" ON public.voyageurs;
CREATE POLICY "Admin all voyageurs" ON public.voyageurs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin all sejours" ON public.sejours;
CREATE POLICY "Admin all sejours" ON public.sejours
  FOR ALL USING (public.is_admin());
