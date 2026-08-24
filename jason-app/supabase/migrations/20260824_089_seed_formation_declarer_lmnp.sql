-- Ajoute la formation "Déclarer sa LMNP seul avec décla.fr" au catalogue
-- (à exécuter manuellement dans le SQL Editor Supabase, comme les autres
-- migrations formations — ce projet ne fait pas de `supabase db push`
-- automatique).
--
-- Upsert par slug : si la formation existe déjà (ré-exécution), on met à
-- jour ses métadonnées plutôt que d'échouer sur la contrainte unique.

INSERT INTO public.formations
  (slug, title, description, duration, modules_count, lessons_count, level, is_published)
VALUES
  ('declarer-lmnp-seul-decla-fr',
   'Déclarer sa LMNP seul avec décla.fr',
   'Régime réel, liasse fiscale 2031/2033, amortissements, réforme 2025 sur la plus-value : la méthode complète pour faire ta déclaration LMNP toi-même avec décla.fr, sans expert-comptable — et savoir exactement quand tu en as quand même besoin.',
   '2h50', 4, 12, 'intermediaire', true)

ON CONFLICT (slug) DO UPDATE
  SET
    is_published  = true,
    title         = EXCLUDED.title,
    description   = EXCLUDED.description,
    duration      = EXCLUDED.duration,
    modules_count = EXCLUDED.modules_count,
    lessons_count = EXCLUDED.lessons_count,
    level         = EXCLUDED.level;
