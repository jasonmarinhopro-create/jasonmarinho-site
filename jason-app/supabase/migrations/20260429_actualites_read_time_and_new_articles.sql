-- Ajoute le champ read_time_minutes à actualites
ALTER TABLE public.actualites
  ADD COLUMN IF NOT EXISTS read_time_minutes integer;

-- Mise à jour des articles existants avec des temps de lecture réalistes
UPDATE public.actualites SET read_time_minutes = 5 WHERE title ILIKE '%micro-BIC%plafond%15 000%';
UPDATE public.actualites SET read_time_minutes = 4 WHERE title ILIKE '%sanctions renforcées%50 000%';
UPDATE public.actualites SET read_time_minutes = 4 WHERE title ILIKE '%Airbnb%commission%15,5%';
UPDATE public.actualites SET read_time_minutes = 5 WHERE title ILIKE '%DPE meublés de tourisme%classe E%2028%';
UPDATE public.actualites SET read_time_minutes = 3 WHERE title ILIKE '%mairies%suspendre%numéro%insalubre%';
UPDATE public.actualites SET read_time_minutes = 4 WHERE title ILIKE '%Téléservice national%J-30%';
UPDATE public.actualites SET read_time_minutes = 5 WHERE title ILIKE '%abattement micro-BIC ramené%30%';
UPDATE public.actualites SET read_time_minutes = 4 WHERE title ILIKE '%Copropriétés%majorité%2/3%';
UPDATE public.actualites SET read_time_minutes = 5 WHERE title ILIKE '%DPE%meublés en zone tendue%';
UPDATE public.actualites SET read_time_minutes = 3 WHERE title ILIKE '%Quotas par ville%Paris%Lyon%';

-- Nouvelles actualités, semaine du 27 au 30 avril 2026
INSERT INTO public.actualites (title, summary, source_url, category, published_at, is_published, read_time_minutes) VALUES

(
  'Tarification dynamique : 62 % des opérateurs LCD l''utilisent déjà en 2026',
  'Selon les dernières données sectorielles, 62 % des opérateurs de location courte durée professionnels utilisent un outil de tarification dynamique (PriceLabs, Beyond, Wheelhouse). En France, les early-adopters affichent des revenus 18 à 35 % supérieurs à ceux qui fixent un tarif manuel. Les channel managers comme Smoobu et Lodgify proposent maintenant une intégration native sans surcoût, plus aucune raison de s''en passer si vous gérez plusieurs logements.',
  'https://hostnlib.com/meilleurs-logiciels-de-gestion-location-courte-duree-gerer-10-logements-efficacement-en-2026/',
  'outils',
  '2026-04-27 00:00:00+00',
  true,
  4
),

(
  'Workation : adapter son annonce pour capter la basse saison',
  'La tendance « workation » (télétravail + séjour) représente 15 à 25 % du chiffre d''affaires des hébergements LCD haut de gamme hors saison. Les séjours durent 5 à 14 jours avec une forte demande pour la fibre optique, un bureau dédié et une cuisine équipée. Intégrer ces points dans son annonce et proposer une réduction dès 5 nuits peut combler les creux de calendrier sans toucher aux tarifs de base.',
  'https://www.yesconciergerie.com/actualites/location-saisonniere-2026-tendances-marche/',
  'marche',
  '2026-04-28 00:00:00+00',
  true,
  3
),

(
  'Google Vacation Rentals : référencer son logement gratuitement pour booster la résa directe',
  'Google propose depuis 2024 un programme de référencement entièrement gratuit pour les locations saisonnières. En 2026, les hôtes connectés via un channel manager compatible (Smoobu, Lodgify, Avantio, Guesty) apparaissent directement dans Google Search et Maps avec un bouton de réservation directe, sans aucune commission. Peu d''hôtes français ont encore activé cette option, ce qui laisse un avantage concurrentiel réel sur les destinations populaires.',
  'https://concierge-angels.com/en/google-vacation-rentals-a-new-source-of-traffic-for-your-seasonal-rentals-in-2026/',
  'reservation-directe',
  '2026-04-29 00:00:00+00',
  true,
  5
),

(
  'Règlement européen : les plateformes transmettent vos données de location aux communes dès le 20 mai',
  'Dès le 20 mai 2026, Airbnb, Booking et Abritel sont tenus de transmettre automatiquement les données de chaque location (identité de l''hôte, nombre de nuitées, revenus) aux communes françaises dotées d''un registre d''enregistrement. Ce croisement de données en temps réel permet aux mairies de repérer les annonces non conformes plus facilement. Si vous avez des annonces actives sans numéro valide, c''est urgent.',
  'https://www.ecologie.gouv.fr/politiques-publiques/location-touristique-meublee',
  'reglementation',
  '2026-04-30 00:00:00+00',
  true,
  4
)

ON CONFLICT DO NOTHING;
