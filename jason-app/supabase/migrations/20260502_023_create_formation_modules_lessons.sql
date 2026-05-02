-- ============================================================
-- MIGRATION : Création des tables formation_modules et formation_lessons
-- Idempotent : IF NOT EXISTS partout. Sûr à rejouer.
-- ============================================================
-- Objectif : permettre de stocker en DB le contenu des leçons
-- (actuellement bundlé côté JS dans 18 fichiers content.ts).
-- Une fois ces tables peuplées, getFormationDbContent() lit
-- prioritairement la DB et le contenu statique devient
-- juste un fallback de sécurité.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.formation_modules (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id    UUID         NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  module_number   INTEGER      NOT NULL,
  title           TEXT         NOT NULL,
  duration        TEXT         DEFAULT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (formation_id, module_number)
);

CREATE TABLE IF NOT EXISTS public.formation_lessons (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       UUID         NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  lesson_number   INTEGER      NOT NULL,
  title           TEXT         NOT NULL,
  duration        TEXT         DEFAULT NULL,
  content         TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (module_id, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_formation_modules_formation
  ON public.formation_modules (formation_id, module_number);

CREATE INDEX IF NOT EXISTS idx_formation_lessons_module
  ON public.formation_lessons (module_id, lesson_number);

-- ── RLS : lecture publique (le contenu est gated côté app via formation_access) ──
ALTER TABLE public.formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read formation_modules" ON public.formation_modules;
CREATE POLICY "Public read formation_modules"
  ON public.formation_modules
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read formation_lessons" ON public.formation_lessons;
CREATE POLICY "Public read formation_lessons"
  ON public.formation_lessons
  FOR SELECT
  USING (true);

-- ── Champ objectifs JSONB sur formations (si pas déjà présent) ──
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS objectifs JSONB DEFAULT NULL;
