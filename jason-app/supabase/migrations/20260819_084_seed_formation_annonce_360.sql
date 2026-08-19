-- Ajoute la formation "Annonce 360°" au catalogue (à exécuter manuellement
-- dans le SQL Editor Supabase, comme les autres migrations formations —
-- ce projet ne fait pas de `supabase db push` automatique).
--
-- Upsert par slug : si la formation existe déjà (ré-exécution), on met à
-- jour ses métadonnées plutôt que d'échouer sur la contrainte unique.

INSERT INTO public.formations
  (slug, title, description, duration, modules_count, lessons_count, level, is_published)
VALUES
  ('annonce-360',
   'Annonce 360° : la stratégie multicanal pour hôtes confirmés',
   'Tu as déjà optimisé ton annonce Airbnb, ta fiche Booking, ton site direct. La suite, c''est la vue d''ensemble : piloter tes canaux comme un système, tester en continu, être recommandé par les IA génératives, et savoir où investir vraiment (vidéo, 3D, metasearch). Le niveau pro, sans répéter ce que tu sais déjà.',
   '3h50', 7, 14, 'avance', true)

ON CONFLICT (slug) DO UPDATE
  SET
    is_published  = true,
    title         = EXCLUDED.title,
    description   = EXCLUDED.description,
    duration      = EXCLUDED.duration,
    modules_count = EXCLUDED.modules_count,
    lessons_count = EXCLUDED.lessons_count,
    level         = EXCLUDED.level;
