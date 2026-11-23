// Articles du blog liés à chaque formation (bloc « Sur le blog » des pages
// /services/formations/<slug>, scripts/inject-formations-blog.mjs).
// Choisis à la main le 24/11/2026 ; une formation absente d'ici reçoit les
// articles les plus proches calculés automatiquement.
export const FORMATIONS_BLOG = {
  'annonce-360': ['airbnb-vs-booking-com-location-courte-duree', 'video-annonce-airbnb-6-regles-tour-video-conversion-2026', 'synchronisation-ical-lcd-6-regles-eviter-double-reservation-airbnb-booking'],
  'annonce-directe': ['reservation-directe-sans-commission', 'site-reservation-directe-location-courte-duree', 'premieres-reservations-directes-sans-audience-site-web'],
  'audit-annonce': ['optimiser-annonce-airbnb', 'photo-couverture-airbnb-7-criteres-algo-computer-vision', 'titre-annonce-airbnb-optimiser-clics-visibilite'],
  'creer-conciergerie-lcd': ['creer-conciergerie-airbnb-2025', 'creer-societe-conciergerie-en-ligne-legalplace-2026', 'tarif-conciergerie-lcd-grille-marche-2026'],
  'declarer-lmnp-seul-decla-fr': ['declarer-lmnp-sans-expert-comptable-decla-fr', 'regime-reel-vs-micro-bic-decision-2026', 'cloture-comptable-lcd-2026-7-actions-avant-31-decembre'],
  'decorer-amenager-logement-lcd': ['amenager-logement-location-courte-duree-petit-budget', 'salon-lcd-7-regles-espace-vie-coeur-experience-voyageur', 'chambre-coucher-lcd-7-regles-sommeil-avis-voyageurs'],
  'ecrire-avis-repondre-voyageurs': ['obtenir-avis-5-etoiles-airbnb', 'gerer-mauvais-avis-airbnb-reponse-hote', 'repondre-avis-5-etoiles-airbnb-transformer-reservations'],
  'fiscalite-reglementation-lcd-france-2026': ['reglementation-lcd-france-2026', 'location-courte-duree-impots-france', 'numero-enregistrement-lcd-20-mai-2026-demarches'],
  'fiscalite-statut-conciergerie-tourisme': ['creer-societe-conciergerie-en-ligne-legalplace-2026', 'tva-location-courte-duree-2026', 'creer-conciergerie-airbnb-2025'],
  'gerer-incidents-litiges-lcd': ['refacturer-degat-voyageur-airbnb-procedure', 'caution-lcd-5-regles-juridiques-2026-prelever-sans-risque', 'reclamation-voyageur-pendant-sejour-methode-5-etapes'],
  'gerer-lcd-automatisation': ['messages-airbnb-automatiser', 'pms-logiciel-gestion-location-courte-duree-debutant', 'check-in-location-courte-duree-boite-a-cles-serrure-connectee'],
  'google-my-business-lcd': ['google-my-business-hotes-lcd', 'seo-local-hote-lcd-google-maps-visibilite', 'gmb-questions-reponses-hotes-lcd-optimiser'],
  'lcd-basse-saison': ['basse-saison-location-courte-duree-strategies-reservations', 'sejours-longs-lcd-strategie-revenus-basse-saison', 'attirer-teletravailleur-nomade-digital-location-courte-duree'],
  'livret-accueil-digital': ['livret-accueil-digital-creer-location-courte-duree', 'signaletique-interieure-lcd-reduit-questions', 'check-in-location-courte-duree-boite-a-cles-serrure-connectee'],
  'louer-en-direct-securise': ['securiser-paiement-reservation-directe-sans-airbnb', 'verification-voyageurs-avant-accepter-reservation-lcd', 'caution-lcd-5-regles-juridiques-2026-prelever-sans-risque'],
  'maitriser-booking-com-algorithme-genius': ['booking-com-hotes-location-courte-duree-guide', 'optimiser-annonce-booking-com-2026-classement', 'chatgpt-booking-com-impact-hotes-lcd'],
  'mettre-le-bon-prix-lcd': ['fixer-prix-minimum-airbnb-lcd', 'point-mort-lcd-calcul-rentabilite-hote', 'frais-menage-airbnb-combien-facturer-2026'],
  'optimiser-annonce-airbnb': ['optimiser-annonce-airbnb', 'algorithme-airbnb-2026-criteres-classement', 'titre-annonce-airbnb-optimiser-clics-visibilite'],
  'photographie-lcd-smartphone': ['photographier-logement-location-courte-duree-smartphone', 'photo-couverture-airbnb-7-criteres-algo-computer-vision', 'preparer-logement-shooting-photo-lcd-7-etapes'],
  'reseaux-sociaux-lcd': ['instagram-hotes-lcd-attirer-voyageurs-reservations-directes', 'instagram-reels-tiktok-lcd-attirer-voyageurs', 'email-marketing-newsletter-hote-lcd'],
  'securiser-reservations-eviter-mauvais-voyageurs': ['verification-voyageurs-avant-accepter-reservation-lcd', 'arnaques-airbnb-2026-classement-types-arnaques-hotes', 'voyageurs-surnumeraires-lcd-6-actions-personnes-en-plus-non-declarees'],
  'tarification-dynamique': ['tarification-dynamique-lcd', 'tarification-dynamique-pricelabs-wheelhouse-beyond-comparatif', 'evenements-locaux-lcd-6-actions-tarifs-festivals'],
}

// Formation vers laquelle le bouton d'un article doit mener quand le calcul
// automatique se trompe (null : le catalogue /services/formations).
export const ARTICLE_FORMATION = {
  'stripe-paiement-direct-lcd-mise-en-place': 'louer-en-direct-securise',
  'cheminee-poele-bois-lcd-7-regles-autoriser-hiver-sans-risque': null,
}
