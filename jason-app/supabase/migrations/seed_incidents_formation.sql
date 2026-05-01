-- ============================================================
-- MIGRATION : Insertion de la formation Incidents & Litiges (18e)
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- Idempotent : ON CONFLICT DO UPDATE sur slug
-- ============================================================

INSERT INTO public.formations (
  slug,
  title,
  description,
  duration,
  modules_count,
  lessons_count,
  level,
  is_published
) VALUES (
  'gerer-incidents-litiges-lcd',
  'Gérer les incidents et litiges en LCD : la formation pour ne plus jamais être pris au dépourvu',
  '100 % des hôtes vivent au moins 1 incident par an : linge taché, dégât matériel, plainte voisin, voyageur qui ne respecte pas les règles, caution à récupérer. Cette formation t''apprend à anticiper, gérer et facturer chaque incident avec méthode, sans paniquer, sans y laisser ta sérénité. Procédures Airbnb 2026, Booking, Stripe, contrats — tout est dedans.',
  '2h30',
  6,
  22,
  'intermediaire',
  true
)
ON CONFLICT (slug) DO UPDATE
  SET title         = EXCLUDED.title,
      description   = EXCLUDED.description,
      duration      = EXCLUDED.duration,
      modules_count = EXCLUDED.modules_count,
      lessons_count = EXCLUDED.lessons_count,
      level         = EXCLUDED.level,
      is_published  = EXCLUDED.is_published;

-- ─────────────────────────────────────────────────────────────
-- Note : le contenu (objectifs + 22 leçons) est géré côté code
-- dans jason-app/app/dashboard/formations/
-- gerer-incidents-litiges-lcd/content.ts
-- (fallback statique utilisé par getFormationDbContent).
-- ─────────────────────────────────────────────────────────────
