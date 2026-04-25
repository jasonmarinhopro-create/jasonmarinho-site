-- Seed nouvelles actualités LCD — semaine du 21 au 25 avril 2026
INSERT INTO public.actualites (title, summary, source_url, category, published_at, is_published) VALUES

(
  'Téléservice national d''enregistrement : J-30 avant le 20 mai',
  'Tous les meublés de tourisme doivent être enregistrés via le téléservice national unique avant le 20 mai 2026 — y compris les résidences principales louées en courte durée. À défaut, l''amende administrative atteint 10 000 € (et 20 000 € pour un faux numéro). Les plateformes retireront automatiquement les annonces sans numéro valide passé cette date.',
  'https://habyl.com/blog/loi-le-meur-2026-enregistrement-meubles-tourisme/',
  'reglementation',
  '2026-04-21 00:00:00+00',
  true
),

(
  'Meublés non classés : abattement micro-BIC ramené à 30 %, plafond 15 000 €',
  'Confirmation officielle : depuis 2025, les meublés de tourisme non classés ne bénéficient plus que d''un abattement de 30 % en micro-BIC (contre 50 % auparavant), avec un plafond de recettes ramené à 15 000 €/an. Pour conserver les conditions favorables (50 % d''abattement, plafond 77 700 €), il faut faire classer son logement de 1 à 5 étoiles auprès d''Atout France.',
  'https://www.jedeclaremonmeuble.com/loi-le-meur-location-saisonniere-fiscalite/',
  'fiscalite',
  '2026-04-22 00:00:00+00',
  true
),

(
  'Copropriétés : la majorité des 2/3 suffit pour interdire la location courte durée',
  'Depuis la loi Le Meur, une simple majorité des 2/3 des voix en assemblée générale permet désormais d''inscrire l''interdiction des meublés de tourisme dans le règlement de copropriété (avant : unanimité). Plusieurs grandes villes voient leurs copros voter ces interdictions au printemps 2026 — un risque concret pour les hôtes en immeuble collectif.',
  'https://www.juritravail.com/Actualite/locations-airbnb-que-prevoit-la-nouvelle-loi-2024-loi-le-meur/Id/377834',
  'reglementation',
  '2026-04-23 00:00:00+00',
  true
),

(
  'DPE : meublés en zone tendue déjà classés F minimum, E obligatoire en 2028',
  'Rappel important : les meublés de tourisme en zone tendue soumis à changement d''usage doivent déjà être classés au minimum F au DPE depuis 2025. La classe E deviendra obligatoire en 2028, puis D en 2034. La sanction pour défaut de DPE conforme atteint 5 000 € + 100 €/jour de retard, et le maire peut suspendre le numéro d''enregistrement.',
  'https://www.amarris-immo.fr/blog/lactualite-immobiliere/location-meublee-et-dpe/',
  'reglementation',
  '2026-04-24 00:00:00+00',
  true
),

(
  'Quotas par ville : Paris, Lyon et Bordeaux durcissent encore les règles',
  'Plusieurs grandes villes appliquent en avril 2026 des quotas plus restrictifs : Paris maintient le plafond 90 nuits/an pour la résidence principale et durcit les contrôles, Lyon généralise la compensation obligatoire dans 3 arrondissements supplémentaires, et Bordeaux étend la zone réglementée à toute la métropole. Vérifie les règles locales avant chaque renouvellement d''annonce.',
  'https://www.yesconciergerie.com/actualites/reglementation-airbnb-2026-changements-proprietaires/',
  'communes',
  '2026-04-25 00:00:00+00',
  true
)

ON CONFLICT DO NOTHING;
