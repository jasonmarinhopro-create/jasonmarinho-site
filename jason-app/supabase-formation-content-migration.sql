-- ============================================================
-- MIGRATION: Formation content tables (modules + lessons)
-- Allows admin to edit formation content from the dashboard
-- Run in Supabase SQL Editor
-- ============================================================

-- Add objectifs column to formations table
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS objectifs text[] DEFAULT '{}';

-- Formation modules
CREATE TABLE IF NOT EXISTS public.formation_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  module_number int NOT NULL,
  title text NOT NULL,
  duration text NOT NULL DEFAULT '30 min',
  created_at timestamptz DEFAULT now(),
  UNIQUE(formation_id, module_number)
);

-- Formation lessons
CREATE TABLE IF NOT EXISTS public.formation_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.formation_modules(id) ON DELETE CASCADE NOT NULL,
  lesson_number int NOT NULL,
  title text NOT NULL,
  duration text NOT NULL DEFAULT '15 min',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(module_id, lesson_number)
);

-- Enable RLS
ALTER TABLE public.formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_lessons ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read modules of published formations
CREATE POLICY "Read published formation modules"
  ON public.formation_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.formations f
      WHERE f.id = formation_id AND f.is_published = true
    )
  );

-- Authenticated users can read all lessons
CREATE POLICY "Read formation lessons"
  ON public.formation_lessons FOR SELECT
  USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_formation_modules_formation_id
  ON public.formation_modules(formation_id);

CREATE INDEX IF NOT EXISTS idx_formation_lessons_module_id
  ON public.formation_lessons(module_id);
