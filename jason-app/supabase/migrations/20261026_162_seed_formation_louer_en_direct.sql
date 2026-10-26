-- Formation « Louer en direct sans plateforme, en toute sécurité » (26/10/2026),
-- née d'une suggestion d'hôte. Les leçons sont publiées ensuite par le workflow
-- « Publier le contenu des formations » (content.ts → formation_modules /
-- formation_lessons). Rejouable : upsert par slug.
insert into public.formations
  (slug, title, description, duration, modules_count, lessons_count, level, is_published)
values
  ('louer-en-direct-securise',
   'Louer en direct sans plateforme, en toute sécurité',
   'Vérifier l''identité des voyageurs sans enfreindre la loi, choisir la bonne assurance, faire un contrat solide, encaisser sans risque, respecter la taxe de séjour et la fiche de police : tout ce qu''Airbnb faisait pour toi, et comment le faire toi-même, sereinement.',
   '3h', 6, 12, 'intermediaire', true)
on conflict (slug) do update
  set is_published  = true,
      title         = excluded.title,
      description   = excluded.description,
      duration      = excluded.duration,
      modules_count = excluded.modules_count,
      lessons_count = excluded.lessons_count,
      level         = excluded.level;
