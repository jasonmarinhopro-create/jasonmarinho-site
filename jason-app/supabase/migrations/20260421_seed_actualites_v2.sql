-- Seed nouvelles actualités LCD, semaine du 16 au 21 avril 2026
INSERT INTO public.actualites (title, summary, source_url, category, published_at, is_published) VALUES

(
  'Micro-BIC : le plafond de recettes pour les meublés non classés abaissé à 15 000 €',
  'Depuis le 1er janvier 2025, les meublés de tourisme non classés ne peuvent bénéficier du régime micro-BIC qu''en dessous de 15 000 € de recettes annuelles (contre 77 700 € auparavant). Au-delà, le passage au régime réel devient obligatoire. Un changement qui touche de nombreux hôtes actifs, souvent sans qu''ils en soient informés.',
  'https://www.jedeclaremonmeuble.com/lmnp-2026/',
  'fiscalite',
  '2026-04-16 00:00:00+00',
  true
),

(
  'Sanctions renforcées : jusqu''à 50 000 € d''amende pour les annonces sans enregistrement',
  'À compter du 20 mai 2026, publier une annonce de meublé de tourisme sans numéro d''enregistrement valide expose à une amende administrative pouvant atteindre 50 000 €. Les plateformes (Airbnb, Booking, Abritel) devront retirer les annonces non conformes dans les 24h suivant la notification des mairies.',
  'https://hostcarefrance.fr/magazine/actualites/reglementation-airbnb-restrictions-quotas-et-fiscalite-par-ville-1',
  'reglementation',
  '2026-04-17 00:00:00+00',
  true
),

(
  'Airbnb : commission unifiée à 15,5 % entièrement à la charge de l''hôte',
  'Airbnb a généralisé début 2026 un nouveau modèle tarifaire : une commission fixe de 15,5 % intégralement supportée par l''hôte, sans frais additionnels pour le voyageur. Ce changement, déjà appliqué sur la majorité des annonces européennes, modifie la structure de prix affichée, et rend les réservations directes encore plus attractives.',
  'https://parisbnb.fr/commission-airbnb-2025-nouveaux-frais-pour-hotes/',
  'plateformes',
  '2026-04-18 00:00:00+00',
  true
),

(
  'DPE meublés de tourisme : classe E obligatoire dès 2028, classe D dès 2034',
  'Le gouvernement a précisé le calendrier des obligations énergétiques pour les meublés de tourisme. Dès 2028, tout bien nouvellement mis en location devra être classé au minimum E. À partir de 2034, la classe D deviendra le seuil minimal, au même titre que les locations classiques. Les logements F et G devront être rénovés ou retirés du marché.',
  'https://actus.foncia.com/gestion-locative/louer/dpe-location-saisonniere',
  'reglementation',
  '2026-04-19 00:00:00+00',
  true
),

(
  'Logement insalubre : les mairies pourront suspendre le numéro d''enregistrement dès le 20 mai',
  'Nouvelle mesure prévue pour le 20 mai 2026 : face à un logement insalubre, la mairie aura le pouvoir de suspendre immédiatement le numéro d''enregistrement du meublé de tourisme et d''imposer son retrait de toutes les plateformes de réservation. Un renforcement significatif du contrôle local sur le parc locatif touristique.',
  'https://www.lokizi.fr/blog/2026/01/28/meuble---ce-qui-change-en-2026-pour-les-loueurs--regles-fiscales--dpe--location-touristique--etc-.html',
  'communes',
  '2026-04-20 00:00:00+00',
  true
)

ON CONFLICT DO NOTHING;
