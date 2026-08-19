-- Ajoute la formation "Audit Annonce" au catalogue (à exécuter manuellement
-- dans le SQL Editor Supabase, comme les autres migrations formations).
--
-- Upsert par slug : si la formation existe déjà (ré-exécution), on met à
-- jour ses métadonnées plutôt que d'échouer sur la contrainte unique.

INSERT INTO public.formations
  (slug, title, description, duration, modules_count, lessons_count, level, is_published)
VALUES
  ('audit-annonce',
   'Auditer une annonce LCD : le Score Annonce sur 100 points',
   'Une méthode de diagnostic complète pour n''importe quelle annonce LCD, la tienne ou celle d''un client. Une grille de notation en 8 catégories, un rapport qui priorise sans décourager, et comment en faire un vrai outil de prospection si tu es conciergerie.',
   '3h10', 6, 12, 'intermediaire', true)

ON CONFLICT (slug) DO UPDATE
  SET
    is_published  = true,
    title         = EXCLUDED.title,
    description   = EXCLUDED.description,
    duration      = EXCLUDED.duration,
    modules_count = EXCLUDED.modules_count,
    lessons_count = EXCLUDED.lessons_count,
    level         = EXCLUDED.level;
