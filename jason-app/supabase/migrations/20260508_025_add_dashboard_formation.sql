-- Formation : Maîtriser le dashboard Jason Marinho
-- 4 modules, 14 leçons, 2h00, Débutant

INSERT INTO formations (slug, title, description, duration, modules_count, lessons_count, level, is_published)
VALUES (
  'maitriser-dashboard-jason-marinho',
  'Maîtriser le dashboard Jason Marinho : gérer tes logements, contrats et revenus LCD de A à Z',
  'Le dashboard Jason Marinho regroupe tout ce dont un hôte LCD a besoin : gestion des logements, contrats signés électroniquement, paiements Stripe, calendrier synchronisé avec Airbnb et Booking, suivi des revenus et simulateurs fiscaux. Cette formation te guide pas à pas pour utiliser chaque fonctionnalité et t''y retrouver en 2h, même si tu démarres de zéro.',
  '2h00',
  4,
  14,
  'debutant',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  description    = EXCLUDED.description,
  duration       = EXCLUDED.duration,
  modules_count  = EXCLUDED.modules_count,
  lessons_count  = EXCLUDED.lessons_count,
  level          = EXCLUDED.level,
  is_published   = EXCLUDED.is_published;
