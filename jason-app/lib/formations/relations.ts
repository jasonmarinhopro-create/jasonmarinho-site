// Phase 4, Mapping formation slug → articles blog liés + formations recommandées
// Permet d'enrichir l'expérience apprenant en croisant avec le contenu blog
// et de proposer une suite logique d'apprentissage.

const BLOG_BASE = 'https://jasonmarinho.com/blog/'

export interface RelatedArticle {
  label: string
  slug: string
}

export interface RelatedFormation {
  slug: string
  reason?: string // ex : "Suite logique" / "Pour aller plus loin"
}

interface FormationRelations {
  articles: RelatedArticle[]
  recommendedNext: RelatedFormation[]
}

// Map ciblé pour chaque formation active
const RELATIONS: Record<string, FormationRelations> = {
  'google-my-business-lcd': {
    articles: [
      { label: 'GMB pour réservations directes', slug: 'google-my-business-reservations-directes-hotes-lcd' },
      { label: 'GMB : questions/réponses optimiser', slug: 'gmb-questions-reponses-hotes-lcd-optimiser' },
      { label: 'Formation GMB : contenu', slug: 'formation-google-my-business-lcd-contenu' },
      { label: 'SEO local hôte LCD', slug: 'seo-local-hote-lcd-google-maps-visibilite' },
    ],
    recommendedNext: [
      { slug: 'annonce-directe', reason: 'Construis ton canal direct sans commission' },
      { slug: 'reseaux-sociaux-lcd', reason: 'Combine GMB + réseaux pour le local' },
    ],
  },
  'annonce-directe': {
    articles: [
      { label: 'Driing, alternative directe à Airbnb', slug: 'driing-plateforme-vacances-sans-commissions' },
      { label: 'Sécuriser le paiement résa directe', slug: 'securiser-paiement-reservation-directe-sans-airbnb' },
      { label: 'Stripe pour la résa directe', slug: 'stripe-paiement-direct-lcd-mise-en-place' },
      { label: 'Email marketing & newsletter', slug: 'email-marketing-newsletter-hote-lcd' },
    ],
    recommendedNext: [
      { slug: 'google-my-business-lcd', reason: 'Le canal n°1 pour la résa directe locale' },
      { slug: 'reseaux-sociaux-lcd', reason: 'Construis une audience qui te suit' },
    ],
  },
  'tarification-dynamique': {
    articles: [
      { label: 'Tarification dynamique LCD', slug: 'tarification-dynamique-lcd' },
      { label: 'Saisonnalité par région 2026', slug: 'saisonnalite-tarif-region-france-lcd-2026' },
      { label: 'Prix min/max : fourchette tarifaire', slug: 'prix-min-max-airbnb-fourchette-tarifaire' },
      { label: 'Fixer son prix minimum', slug: 'fixer-prix-minimum-airbnb-lcd' },
    ],
    recommendedNext: [
      { slug: 'mettre-le-bon-prix-lcd', reason: 'Méthode complète prix + saisonnalité' },
      { slug: 'lcd-basse-saison', reason: 'Maximise la basse saison' },
    ],
  },
  'mettre-le-bon-prix-lcd': {
    articles: [
      { label: 'Tarification dynamique LCD', slug: 'tarification-dynamique-lcd' },
      { label: 'Saisonnalité par région', slug: 'saisonnalite-tarif-region-france-lcd-2026' },
      { label: 'Frais de ménage : combien facturer ?', slug: 'frais-menage-airbnb-combien-facturer-2026' },
      { label: 'Point mort LCD : calcul rentabilité', slug: 'point-mort-lcd-calcul-rentabilite-hote' },
    ],
    recommendedNext: [
      { slug: 'tarification-dynamique', reason: 'Automatiser ta tarification' },
      { slug: 'lcd-basse-saison', reason: 'Stratégie revenus basse saison' },
    ],
  },
  'lcd-basse-saison': {
    articles: [
      { label: 'Séjours longs hors saison', slug: 'sejours-longs-lcd-strategie-revenus-basse-saison' },
      { label: 'Workation : louer cher hors saison', slug: 'workation-lcd-logement-equiper-louer-cher-hors-saison' },
      { label: 'Diversifier les revenus LCD', slug: 'diversifier-revenus-lcd-au-dela-nuitees' },
    ],
    recommendedNext: [
      { slug: 'tarification-dynamique', reason: 'Adapte ta grille tarifaire' },
      { slug: 'reseaux-sociaux-lcd', reason: 'Trouve des voyageurs hors saison' },
    ],
  },
  'optimiser-annonce-airbnb': {
    articles: [
      { label: 'Algorithme Airbnb 2026', slug: 'algorithme-airbnb-2026-criteres-classement' },
      { label: 'Photo couverture : 7 critères', slug: 'photo-couverture-airbnb-7-criteres-algo-computer-vision' },
      { label: 'Optimiser son annonce Airbnb', slug: 'optimiser-annonce-airbnb' },
      { label: 'Description Airbnb 500 caractères', slug: 'description-airbnb-500-caracteres-convertit-2026' },
      { label: 'Titre Airbnb optimisé', slug: 'titre-annonce-airbnb-optimiser-clics-visibilite' },
    ],
    recommendedNext: [
      { slug: 'maitriser-booking-com-algorithme-genius', reason: 'Diversifie tes plateformes' },
      { slug: 'ecrire-avis-repondre-voyageurs', reason: 'Booste tes avis = ton classement' },
    ],
  },
  'maitriser-booking-com-algorithme-genius': {
    articles: [
      { label: 'Airbnb vs Booking : comparatif', slug: 'airbnb-vs-booking-com-location-courte-duree' },
      { label: 'ChatGPT × Booking : impact hôtes', slug: 'chatgpt-booking-com-impact-hotes-lcd' },
    ],
    recommendedNext: [
      { slug: 'optimiser-annonce-airbnb', reason: 'Optimise aussi ton Airbnb' },
      { slug: 'tarification-dynamique', reason: 'Synchronise tes prix' },
    ],
  },
  'reseaux-sociaux-lcd': {
    articles: [
      { label: 'Instagram pour hôtes LCD', slug: 'instagram-hotes-lcd-attirer-voyageurs-reservations-directes' },
      { label: 'Instagram Reels & TikTok LCD', slug: 'instagram-reels-tiktok-lcd-attirer-voyageurs' },
      { label: 'Blog hôte LCD : trafic organique', slug: 'blog-hote-lcd-strategie-trafic-organique' },
    ],
    recommendedNext: [
      { slug: 'annonce-directe', reason: 'Convertis ton audience en résas directes' },
      { slug: 'google-my-business-lcd', reason: 'Domine la recherche locale' },
    ],
  },
  'gerer-lcd-automatisation': {
    articles: [
      { label: 'Make/Zapier : workflow no-code', slug: 'make-zapier-workflow-airbnb-no-code-debutant' },
      { label: 'Messages Airbnb : automatiser', slug: 'messages-airbnb-automatiser' },
      { label: 'Gabarits messages LCD', slug: 'gabarits-messages-lcd-hotes-templates' },
      { label: 'Scripts check-out automatique', slug: 'scripts-check-out-automatique-lcd' },
    ],
    recommendedNext: [
      { slug: 'livret-accueil-digital', reason: 'Livret d\'accueil digital pour scaler' },
      { slug: 'creer-conciergerie-lcd', reason: 'Si tu vises la conciergerie' },
    ],
  },
  'livret-accueil-digital': {
    articles: [
      { label: 'Livret d\'accueil digital LCD', slug: 'livret-accueil-digital-hotes-lcd' },
      { label: 'Signalétique intérieure LCD', slug: 'signaletique-interieure-lcd-reduit-questions' },
      { label: 'Welcome bag : 12 idées', slug: 'welcome-bag-lcd-12-idees-marquantes-budget' },
    ],
    recommendedNext: [
      { slug: 'gerer-lcd-automatisation', reason: 'Automatise les messages voyageurs' },
      { slug: 'ecrire-avis-repondre-voyageurs', reason: 'Maximise tes avis 5★' },
    ],
  },
  'securiser-reservations-eviter-mauvais-voyageurs': {
    articles: [
      { label: 'Vérifier un voyageur avant d\'accepter', slug: 'verification-voyageurs-avant-accepter-reservation-lcd' },
      { label: 'Refacturer un dégât voyageur', slug: 'refacturer-degat-voyageur-airbnb-procedure' },
      { label: 'Bruit & règlement intérieur', slug: 'bruit-reglement-interieur-lcd-efficace' },
    ],
    recommendedNext: [
      { slug: 'fiscalite-reglementation-lcd-france-2026', reason: 'Connais tes obligations légales' },
    ],
  },
  'decorer-amenager-logement-lcd': {
    articles: [
      { label: 'Photos avant/après home staging', slug: 'photos-avant-apres-home-staging-lcd' },
      { label: 'Inventaire logement Airbnb', slug: 'inventaire-logement-airbnb-modele-photos' },
      { label: 'Travaux énergétiques LCD', slug: 'travaux-energetiques-lcd-aides-maprimerenov-2026' },
    ],
    recommendedNext: [
      { slug: 'optimiser-annonce-airbnb', reason: 'Mets en avant tes nouveaux atouts' },
    ],
  },
  'fiscalite-reglementation-lcd-france-2026': {
    articles: [
      { label: 'Réglementation LCD France 2026', slug: 'reglementation-lcd-france-2026' },
      { label: 'Guide fiscal débutant 2026', slug: 'guide-fiscal-debutant-hote-airbnb-2026' },
      { label: 'Micro-BIC abattement 2026', slug: 'micro-bic-abattement-2026-airbnb' },
      { label: 'Numéro d\'enregistrement 20 mai 2026', slug: 'numero-enregistrement-lcd-20-mai-2026-demarches' },
    ],
    recommendedNext: [
      { slug: 'fiscalite-statut-conciergerie-tourisme', reason: 'Si tu vises la conciergerie' },
    ],
  },
  'fiscalite-statut-conciergerie-tourisme': {
    articles: [
      { label: 'Créer une conciergerie 2025', slug: 'creer-conciergerie-airbnb-2025' },
      { label: 'Tarif conciergerie 2026', slug: 'tarif-conciergerie-lcd-grille-marche-2026' },
      { label: 'Modèle contrat mandat', slug: 'contrat-mandat-conciergerie-lcd-modele-clauses' },
    ],
    recommendedNext: [
      { slug: 'creer-conciergerie-lcd', reason: 'Méthode complète création' },
    ],
  },
  'creer-conciergerie-lcd': {
    articles: [
      { label: 'Créer une conciergerie 2025', slug: 'creer-conciergerie-airbnb-2025' },
      { label: 'Prospection : trouver le 1er mandat', slug: 'prospection-conciergerie-trouver-premier-mandat' },
      { label: 'Scaler de 5 à 30 mandats', slug: 'scaler-conciergerie-5-30-mandats-process' },
      { label: 'Recruter et fidéliser une équipe ménage', slug: 'equipe-menage-conciergerie-recruter-fideliser' },
    ],
    recommendedNext: [
      { slug: 'fiscalite-statut-conciergerie-tourisme', reason: 'Loi Hoguet, statuts, TVA' },
      { slug: 'gerer-lcd-automatisation', reason: 'Automatise dès le départ' },
    ],
  },
  'ecrire-avis-repondre-voyageurs': {
    articles: [
      { label: 'Obtenir des avis 5 étoiles', slug: 'obtenir-avis-5-etoiles-airbnb' },
      { label: 'Gérer un mauvais avis Airbnb', slug: 'gerer-mauvais-avis-airbnb-reponse-hote' },
      { label: 'Récupérer après un mauvais avis', slug: 'recuperer-mauvais-avis-airbnb-methode-5-etapes' },
    ],
    recommendedNext: [
      { slug: 'optimiser-annonce-airbnb', reason: 'Avis = facteur de classement n°1' },
    ],
  },
}

export function getFormationRelations(slug: string): FormationRelations {
  return RELATIONS[slug] ?? { articles: [], recommendedNext: [] }
}

export function getBlogUrl(slug: string): string {
  return `${BLOG_BASE}${slug}`
}
