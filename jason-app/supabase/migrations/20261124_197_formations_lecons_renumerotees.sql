-- Leçons renumérotées (24/11/2026) : dans trois formations, les numéros de
-- leçon recommençaient à 1 dans chaque module (1, 2 puis 1, 2…), ce qui
-- mélangeait la progression des membres (completed_lessons ne garde que le
-- numéro). Nouveaux numéros : module 1 inchangé, puis 21, 22… pour le module 2,
-- 31, 32… pour le module 3, etc. (content.ts). On retire ici les anciennes
-- lignes des modules 2 et suivants ; le workflow « Publier le contenu des
-- formations » recrée les leçons avec les nouveaux numéros.
-- Rejouable : ne touche que les numéros inférieurs à 10 des modules 2 et plus.
delete from public.formation_lessons l
 using public.formation_modules m, public.formations f
 where l.module_id = m.id
   and m.formation_id = f.id
   and f.slug in ('louer-en-direct-securise', 'photographie-lcd-smartphone', 'gerer-incidents-litiges-lcd')
   and m.module_number >= 2
   and l.lesson_number < 10;
