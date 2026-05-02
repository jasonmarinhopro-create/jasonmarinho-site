-- ============================================================
-- MIGRATION : Insertion de la formation Photographie LCD (17e)
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
  'photographie-lcd-smartphone',
  'Faire des photos qui font cliquer : la photographie LCD au smartphone',
  'Les photos décident à elles seules de 60 % du clic et 40 % du prix qu''un voyageur est prêt à payer. Cette formation t''apprend à transformer ton annonce en quelques heures, avec ton seul smartphone, composition, lumière, mise en scène, retouche, mise en ligne. Aucun matériel pro requis.',
  '2h30',
  6,
  19,
  'debutant',
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
-- Note : le contenu (objectifs + 19 leçons) est géré côté code
-- dans jason-app/app/dashboard/formations/
-- photographie-lcd-smartphone/content.ts
-- (fallback statique utilisé par getFormationDbContent).
-- ─────────────────────────────────────────────────────────────
