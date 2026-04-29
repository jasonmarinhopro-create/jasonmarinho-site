-- ============================================================
-- MIGRATION : Insertion de la formation Booking.com (16e formation)
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
  'maitriser-booking-com-algorithme-genius',
  'Maîtriser Booking.com : algorithme, Genius & IA en 2026',
  'La deuxième plateforme LCD d''Europe fonctionne sur des règles radicalement différentes d''Airbnb. Algorithme de pertinence, programme Genius 2026, intégration ChatGPT et synchronisation intelligente : la formation pour sortir du mono-Airbnb et transformer Booking en canal rentable.',
  '3h15',
  7,
  14,
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
-- Note : les objectifs et le contenu des 14 leçons sont gérés
-- côté code dans jason-app/app/dashboard/formations/
-- maitriser-booking-com-algorithme-genius/content.ts
-- (fallback statique utilisé par getFormationDbContent).
--
-- Si tu veux plus tard migrer le contenu en DB, utilise les
-- tables formation_modules et formation_lessons en liant via
-- formation_id = (SELECT id FROM formations WHERE slug =
-- 'maitriser-booking-com-algorithme-genius').
-- ─────────────────────────────────────────────────────────────

SELECT
  slug,
  title,
  duration,
  modules_count,
  lessons_count,
  level,
  is_published
FROM public.formations
WHERE slug = 'maitriser-booking-com-algorithme-genius';
