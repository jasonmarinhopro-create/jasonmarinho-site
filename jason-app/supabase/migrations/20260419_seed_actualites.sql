-- Create actualites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.actualites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  summary       text,
  source_url    text,
  category      text NOT NULL DEFAULT 'general',
  published_at  timestamptz,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- Disable RLS (public read-only editorial content)
ALTER TABLE public.actualites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published actualites" ON public.actualites;
CREATE POLICY "Public can read published actualites"
  ON public.actualites FOR SELECT
  USING (is_published = true);

-- Seed initial articles
INSERT INTO public.actualites (title, summary, source_url, category, published_at, is_published) VALUES

(
  'Téléservice national d''enregistrement obligatoire dès le 20 mai 2026',
  'Toutes les mairies doivent avoir mis en place une procédure d''enregistrement pour les meublés de tourisme avant le 20 mai 2026. Chaque bien se voit attribuer un numéro unique à 13 caractères qui doit figurer sur toutes les annonces, sous peine d''une amende pouvant atteindre 10 000 €.',
  'https://www.avantio.com/fr/blog/location-saisonniere-obligation-proprietaire/',
  'reglementation',
  '2026-04-15 00:00:00+00',
  true
),

(
  'Loi Le Meur : les communes peuvent abaisser le plafond à 90 jours par an',
  'Depuis janvier 2025, les conseils municipaux peuvent réduire la durée maximale de location d''une résidence principale de 120 à 90 jours par an. Plusieurs grandes villes ont déjà adopté cette mesure pour lutter contre la pression sur l''habitat local.',
  'https://www.epsilium.fr/reforme-airbnb-2026-ce-qui-change-pour-les-proprietaires/',
  'reglementation',
  '2026-04-10 00:00:00+00',
  true
),

(
  'Numéro d''enregistrement : un système national centralisé pour tous les meublés',
  'Un téléservice national centralise désormais toutes les déclarations de meublés de tourisme. Le numéro attribué à chaque bien doit obligatoirement apparaître sur toutes tes annonces en ligne, quelle que soit la plateforme utilisée. Les communes reçoivent les données en temps réel.',
  'https://notaires-office.fr/mise-a-jour-du-guide-pratique-de-la-reglementation-des-meubles-de-tourisme/',
  'communes',
  '2026-04-14 00:00:00+00',
  true
),

(
  'Règlement européen sur la transparence : en vigueur en mai 2026',
  'Le règlement européen sur la transparence des locations de courte durée entre pleinement en vigueur en mai 2026. Airbnb, Booking et les autres plateformes seront tenues de transmettre les données de leurs hôtes aux autorités fiscales et aux collectivités locales.',
  'https://www.loftely.com/blog/actualites/reglementation-locations-saisonnieres-2026.html',
  'reglementation',
  '2026-04-08 00:00:00+00',
  true
),

(
  'Micro-BIC 2026 : abattement réduit à 30 % pour les meublés non classés',
  'Depuis le 1er janvier 2025, les revenus issus de la location de meublés non classés ne bénéficient plus que d''un abattement de 30 % dans le cadre du micro-BIC, contre 50 % auparavant. Le seuil de revenus passe de 77 700 € à 15 000 € par an, un changement qui concerne la plupart des hôtes occasionnels.',
  'https://www.jedeclaremonmeuble.com/lmnp-2026/',
  'fiscalite',
  '2026-04-05 00:00:00+00',
  true
),

(
  'LMNP : les amortissements réintégrés dans le calcul de la plus-value à la revente',
  'La loi de finances 2025 modifie le traitement fiscal des amortissements en LMNP : à la revente d''un bien, les amortissements déduits seront réintégrés dans le calcul de la plus-value imposable. Un changement significatif pour tous ceux qui investissent en location meublée.',
  'https://blog.maslow.immo/lmnp-2026/',
  'fiscalite',
  '2026-03-28 00:00:00+00',
  true
),

(
  'Airbnb et Booking obligés de déclarer tes revenus aux impôts',
  'Les plateformes de location courte durée transmettent depuis 2024 les revenus de leurs hôtes directement à l''administration fiscale. En 2026, les contrôles se renforcent : les revenus non déclarés croisés avec les données des plateformes exposent les hôtes à des redressements.',
  'https://www.liwango.com/fr/blog/fiscalite-location-courte-duree',
  'plateformes',
  '2026-03-15 00:00:00+00',
  true
),

(
  'DPE : les meublés de tourisme soumis aux mêmes règles que la location classique',
  'Les meublés de tourisme seront progressivement soumis aux mêmes obligations de performance énergétique que les locations à l''année. À l''horizon 2034, seuls les logements classés A à D pourront être proposés en location courte durée. Anticipez dès maintenant si votre bien est classé E, F ou G.',
  'https://www.ecologie.gouv.fr/politiques-publiques/location-touristique-meublee',
  'reglementation',
  '2026-03-20 00:00:00+00',
  true
),

(
  'Gîtes de France : +4 % de nuitées, le tourisme rural confirme sa dynamique',
  'Le réseau Gîtes de France enregistre plus de 28 millions de nuitées, en hausse de 4 % par rapport à l''année précédente. La tendance de fond se confirme : le tourisme rural attire une clientèle croissante, notamment en avant et arrière-saison, avec une demande forte pour les séjours à la semaine.',
  'https://www.pole-implantation-tourisme.org/tendances-2026-gites-chambres-hotes-france/',
  'gites',
  '2026-04-12 00:00:00+00',
  true
),

(
  'Réservation directe : comment réduire ta dépendance aux OTA en 2026',
  'Face à la montée des commissions et aux restrictions des grandes plateformes, de plus en plus d''hôtes misent sur la réservation directe. Site web personnel, liste d''anciens voyageurs, réseaux sociaux : des stratégies concrètes pour fidéliser ta clientèle et préserver ta marge.',
  'https://www.moncercleimmo.com/blog-articles/location-courte-duree-comment-te-demarquer',
  'reservation-directe',
  '2026-04-06 00:00:00+00',
  true
),

(
  'Conciergeries : tarifs entre 17 % et 25 % des loyers selon les villes',
  'Le tarif moyen d''une conciergerie de location saisonnière oscille entre 17 % et 25 % HT des loyers perçus. Les destinations côtières et à forte demande se situent en haut de la fourchette. Si tu envisages de déléguer la gestion de ton bien, comparer les offres locales reste essentiel.',
  'https://toploc.com/blog/hotes/tarifs-conciergerie-location-saisonniere',
  'conciergerie',
  '2026-04-01 00:00:00+00',
  true
),

(
  'Tarification dynamique : les outils d''optimisation de prix accessibles à tous',
  'La tarification dynamique, longtemps réservée aux professionnels, se démocratise. Des outils comme PriceLabs ou Beyond Pricing ajustent automatiquement tes prix selon la demande, les événements locaux et la concurrence. Les hôtes qui les utilisent constatent en moyenne +15 % de revenus.',
  'https://coliveo.fr/etude-de-marche-location-saisonniere-en-france-en-2025/',
  'outils',
  '2026-03-10 00:00:00+00',
  true
)

ON CONFLICT DO NOTHING;
