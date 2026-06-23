export type ChangelogTag = 'nouveau' | 'amélioration' | 'correction' | 'important'

export interface ChangelogEntry {
  id: string
  date: string // ISO 8601
  tag: ChangelogTag
  title: string
  description: string
}

// Liste curée des nouveautés qui intéressent vraiment un hôte LCD.
// On garde l'essentiel (nouvelles fonctionnalités utiles, formations, plans,
// outils opérationnels) et on retire les détails techniques / refontes
// internes / micro-ajustements UX qui n'apportent rien au quotidien d'un hôte.
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 'pricing-annuel-only-jun-2026',
    date: '2026-06-23',
    tag: 'important',
    title: 'Plan Standard désormais en annuel uniquement (19,98 €/an Fondateur)',
    description: 'Simplification : on bascule le plan Standard sur de la facturation annuelle uniquement. Tarif Membre Fondateur 19,98 €/an HT à vie (au lieu de 1,98 €/mois). Tarif public à 38,98 €/an. Les abonnements mensuels en cours restent actifs et se renouvellent normalement.',
  },
  {
    id: 'annuaires-pros-jun-2026',
    date: '2026-06-22',
    tag: 'nouveau',
    title: 'Annuaires Photographes LCD et Équipes Ménage LCD',
    description: 'Deux nouveaux annuaires lancés sur jasonmarinho.com : photographes spécialisés LCD et équipes de ménage LCD. Côté hôte, l\'accès est gratuit (consulter + contacter directement, sans commission). Côté pro, mini-site dédié à 39,98 €/an à vie pour les 20 premiers fondateurs de chaque catégorie.',
  },
  // ─── Mai 2026 ──────────────────────────────────────────────────
  {
    id: 'sos-hote-mai-2026',
    date: '2026-05-12',
    tag: 'nouveau',
    title: 'SOS Hôte : le module d\'urgence en 1 clic',
    description: 'Quand ça pète, tu n\'as plus à chercher sur Google. 6 scénarios pas-à-pas (voyageur qui dégrade, refuse de partir, fête, avis injuste, annulation last-minute, litige plateforme) couvrant Airbnb, Booking, Vrbo et la location directe. Templates de messages prêts à copier, recours juridiques détaillés, erreurs à éviter. Accessible depuis l\'icône bouée en haut du dashboard.',
  },
  {
    id: 'photographie-lcd-mai-2026',
    date: '2026-04-30',
    tag: 'nouveau',
    title: 'Nouvelle formation : Faire des photos qui font cliquer',
    description: 'Apprends à transformer ton annonce avec ton seul smartphone : composition, lumière naturelle, mise en scène, retouche Snapseed, ordre des photos. 6 modules, 19 leçons. Une bonne photo de couverture peut multiplier tes réservations par 1,5.',
  },
  {
    id: 'gerer-incidents-mai-2026',
    date: '2026-04-30',
    tag: 'nouveau',
    title: 'Nouvelle formation : Gérer les incidents et litiges en LCD',
    description: 'Anticiper, gérer et facturer chaque incident sans paniquer : caution Stripe, AirCover Airbnb, Booking, état des lieux, médiation. Plaintes voisins, dégâts, voyageurs problématiques, no-show. 6 modules, 22 leçons.',
  },
  {
    id: 'performances-dashboard-mai-2026',
    date: '2026-04-29',
    tag: 'nouveau',
    title: 'Performances : ton tableau de bord de pilotage',
    description: 'Une nouvelle section dans le dashboard pour piloter ton activité : taux d\'occupation par logement, revenus mensuels sur 12 mois, prix moyen par nuit, comparateur de tes logements, sources de réservation, insights automatiques. Tout ce qu\'il te faut pour savoir quand baisser tes prix ou monter en gamme.',
  },
  {
    id: 'fiche-incident-sejour-mai-2026',
    date: '2026-04-28',
    tag: 'nouveau',
    title: 'Fiche incident par séjour',
    description: 'Signale chaque incident lié à un séjour directement depuis la fiche voyageur : linge taché, casse, dégradation, vol, retard de restitution, plainte voisin. Avec photo, montant de caution à appliquer et statut (ouvert / résolu / remboursé). Tes preuves organisées en 1 endroit.',
  },
  {
    id: 'auto-checklist-contrats-mai-2026',
    date: '2026-04-27',
    tag: 'amélioration',
    title: 'Checklist contrat auto-cochée à chaque étape',
    description: 'Ton suivi opérationnel se met à jour tout seul : « Contrat envoyé » coché à la création, « Contrat signé » à la signature, « Solde reçu » et « Caution reçue » cochés automatiquement quand le voyageur paye sur Stripe. Plus besoin de cocher à la main.',
  },
  {
    id: 'ical-sync-logements-mai-2026',
    date: '2026-04-26',
    tag: 'nouveau',
    title: 'Synchronisation iCal multi-plateformes',
    description: 'Ajoute tes liens iCal Airbnb, Booking, Vrbo et autres plateformes directement sur la fiche logement. Les réservations externes apparaissent automatiquement dans ton calendrier intégré. Plus de double-réservation par oubli de bloquer une date.',
  },
  {
    id: 'qr-affiches-mai-2026',
    date: '2026-05-09',
    tag: 'nouveau',
    title: 'QR & Affiches : prêts à imprimer pour ton logement',
    description: 'Génère en 2 minutes les affiches utiles pour ton logement : WiFi (avec QR code de connexion auto), règlement intérieur, consignes check-out, contacts d\'urgence. Personnalisation rapide, format A4 prêt à imprimer ou afficher. Idéal pour réduire les questions voyageurs.',
  },
  {
    id: 'audit-gbp-mai-2026',
    date: '2026-05-06',
    tag: 'nouveau',
    title: 'Audit Google Business Profile gratuit',
    description: 'Évalue en 25 questions la santé de ta fiche Google Business Profile. Score sur 100, points faibles identifiés, plan d\'action priorisé. Une bonne fiche GBP peut t\'amener 10 à 30 réservations directes par an sans commission.',
  },
  {
    id: 'simulateurs-lcd-mai-2026',
    date: '2026-05-06',
    tag: 'nouveau',
    title: 'Simulateurs LCD : rentabilité, fiscalité, point mort',
    description: 'Calculateurs intégrés pour anticiper : LMNP vs LMP selon ton chiffre d\'affaires, simulation micro-BIC vs régime réel, calcul de point mort par logement, marge nette par nuit. Connecté à la dernière fiscalité 2026 (Loi Le Meur, abattements actualisés).',
  },

  // ─── Avril 2026 ─────────────────────────────────
  {
    id: 'formation-booking-com-apr-2026',
    date: '2026-04-25',
    tag: 'nouveau',
    title: 'Nouvelle formation : Maîtriser Booking.com',
    description: 'Formation entièrement dédiée à Booking.com : algorithme 2026, programme Genius, intégration ChatGPT pour tes annonces, et stratégie de prix. 7 modules, 14 leçons complètes.',
  },
  {
    id: 'blog-132-articles-apr-2026',
    date: '2026-04-25',
    tag: 'nouveau',
    title: '70 nouveaux articles sur le blog LCD',
    description: 'Le blog passe à 132+ articles sur la location courte durée. Nouveaux sujets : fiscalité 2026, réglementation (Loi Le Meur), tarification dynamique, automatisation, conciergerie, expérience voyageurs, Airbnb vs Booking, DPE, algorithme Airbnb 2026.',
  },
  {
    id: 'plan-gating-apr-2026',
    date: '2026-04-19',
    tag: 'important',
    title: 'Accès par plan : Découverte, Standard, Driing',
    description: 'La plateforme adapte ce que tu vois selon ton plan. En Découverte : 2 formations au choix, actualités récentes, accès à la communauté et aux gabarits. En Standard : 14+ formations complètes, journal des revenus, contrats illimités + Stripe, codes promo partenaires. Tout est automatique.',
  },
  {
    id: 'abonnement-stripe-apr-2026',
    date: '2026-04-19',
    tag: 'important',
    title: 'Abonnement Standard à 1,98 €/mois (Membre Fondateur)',
    description: 'Souscris au plan Standard directement depuis ton espace : 1,98 €/mois en tarif Membre Fondateur (prix bloqué à vie). Le plan Membre Driing est disponible à 0,98 €/mois pour les clients Driing actifs. Paiement sécurisé via Stripe, résiliation à tout moment.',
  },
  {
    id: 'actualites-lcd-page-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Actualités LCD dans le dashboard',
    description: 'Une nouvelle section « Actualités » rassemble les infos importantes du moment : nouvelles obligations, changements fiscaux, évolutions des plateformes. Tout trié et résumé pour toi, avec un lien direct vers la source.',
  },
  {
    id: 'revenus-guide-fiscalite-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Guide fiscalité 2026 dans la section Revenus',
    description: 'Un guide clair sur les régimes fiscaux est accessible directement depuis la page Revenus. Seuils 2026 (micro-BIC, régime réel, LMP) expliqués simplement, avec ce que ça change concrètement selon tes revenus. Pas de jargon, juste l\'essentiel.',
  },
  {
    id: 'revenus-journal-paiements-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Journal de tous tes paiements',
    description: 'Enregistre manuellement tes paiements reçus (virement, espèces, chèque) en plus des paiements en ligne. Tout s\'affiche dans un seul journal clair avec le logement, le montant et le statut, encaissé ou en attente.',
  },
  {
    id: 'calendrier-checklist-sejour-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Check-list par séjour dans le calendrier',
    description: 'Chaque séjour a maintenant sa propre check-list : contrat envoyé, acompte reçu, ménage planifié, check-out. Coche au fur et à mesure et valide toute une étape d\'un seul clic.',
  },
  {
    id: 'calendrier-alertes-intelligentes-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Rappels automatiques par séjour',
    description: 'Le calendrier te signale discrètement les oublis : contrat non signé, solde non reçu, instructions pas encore envoyées. Les rappels s\'effacent automatiquement une fois la tâche cochée.',
  },
  {
    id: 'voyageur-signalement-temoignage-apr-2026',
    date: '2026-04-12',
    tag: 'nouveau',
    title: 'Signaler ou témoigner depuis la fiche voyageur',
    description: 'Deux boutons sur chaque fiche voyageur : « Signaler » pour remonter un incident (dégradation, arnaque, fête non autorisée) et « Témoigner » pour laisser un retour positif. Les informations du voyageur sont pré-remplies, et le signalement est connecté à la base Sécurité Voyageur partagée avec la communauté.',
  },
  {
    id: 'guide-lcd-refonte-apr-2026',
    date: '2026-04-09',
    tag: 'amélioration',
    title: 'Guide LCD : 4 profils + loi Le Meur',
    description: '4 profils distincts (Gîtes, Chambres d\'hôtes, Conciergeries, Réservation directe), 12 fiches détaillées avec indicateurs visuels et mise à jour loi Le Meur 2025. Filtre par profil pour n\'afficher que ce qui te concerne.',
  },
  {
    id: 'gabarits-en-timing-apr-2026',
    date: '2026-04-08',
    tag: 'amélioration',
    title: 'Gabarits : version anglaise + filtres par moment',
    description: 'Les gabarits disposent d\'un toggle FR / EN pour accéder à la traduction anglaise. Filtre rapidement par moment : « Avant l\'arrivée », « Pendant le séjour » ou « Après le départ ».',
  },

  // ─── Mars / Février 2026 ────────────────────────────────────────
  {
    id: 'securite-traveler-mar-2026',
    date: '2026-03-20',
    tag: 'nouveau',
    title: 'Vérification voyageurs',
    description: 'La section Sécurité est en ligne. Vérifie l\'identité de tes voyageurs et consulte les signalements de la communauté avant chaque séjour.',
  },
  {
    id: 'gabarits-mar-2026',
    date: '2026-03-15',
    tag: 'nouveau',
    title: 'Bibliothèque de gabarits',
    description: 'Plus de 20 modèles de messages prêts à l\'emploi : check-in, check-out, bienvenue, avis clients. Copie en un clic et personnalise selon ton style.',
  },
  {
    id: 'partenaires-feb-2026',
    date: '2026-02-20',
    tag: 'nouveau',
    title: 'Espace partenaires Driing',
    description: 'Accède aux offres exclusives de nos partenaires sélectionnés pour les hôtes : outils de gestion, services de conciergerie et bien plus.',
  },
  {
    id: 'communaute-feb-2026',
    date: '2026-02-10',
    tag: 'nouveau',
    title: 'Groupes communautaires',
    description: 'Rejoins les groupes Facebook de la communauté Jason Marinho directement depuis ton dashboard. Réseau, entraide et partage d\'expériences.',
  },
  {
    id: 'auth-jan-2026',
    date: '2026-01-15',
    tag: 'important',
    title: 'Lancement de la plateforme membre',
    description: 'Bienvenue ! L\'espace membre est officiellement lancé avec l\'authentification sécurisée, le profil personnalisé et l\'accès aux formations.',
  },
]
