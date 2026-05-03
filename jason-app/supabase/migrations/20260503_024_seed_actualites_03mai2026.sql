-- Actualités LCD du 3 mai 2026
INSERT INTO public.actualites (title, summary, source_url, category, published_at, is_published, read_time_minutes) VALUES

(
  'Téléservice national d''enregistrement des meublés repoussé au T4 2026',
  'Le portail national unique d''enregistrement des meublés de tourisme, initialement prévu pour le 20 mai 2026, ne sera pas disponible avant le 4e trimestre 2026. En attendant, les déclarations doivent continuer à se faire auprès de ta mairie ou via son téléservice local. L''obligation d''enregistrement reste en vigueur, seul le portail national est décalé : les amendes (10 000 € pour défaut, 20 000 € pour faux numéro) s''appliquent toujours.',
  'https://habyl.com/blog/loi-le-meur-2026-enregistrement-meubles-tourisme/',
  'reglementation',
  '2026-05-03 00:00:00+00',
  true,
  3
),

(
  'Meublés classés : l''abattement micro-BIC tombe de 71 % à 50 % en 2026',
  'Le classement Atout France ne protège plus autant ton régime fiscal. Depuis 2026, les meublés de tourisme classés (1 à 5 étoiles) voient leur abattement micro-BIC passer de 71 % à 50 %, même si le plafond monte légèrement à 83 600 €. C''est moins impactant que pour les non-classés (30 % / 15 000 €), mais l''avantage fiscal du classement s''est nettement réduit. Si tes charges dépassent 50 % de tes recettes, le régime réel mérite un calcul comparatif sérieux.',
  'https://www.monmeublesaisonnier.com/blog/micro-bic-lmnp-seuils-abattements-fiscal',
  'fiscalite',
  '2026-05-03 00:00:00+00',
  true,
  4
)

ON CONFLICT DO NOTHING;
