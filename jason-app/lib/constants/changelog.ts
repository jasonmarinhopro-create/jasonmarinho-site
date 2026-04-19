export type ChangelogTag = 'nouveau' | 'amélioration' | 'correction' | 'important'

export interface ChangelogEntry {
  id: string
  date: string // ISO 8601
  tag: ChangelogTag
  title: string
  description: string
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: 'revenus-journal-paiements-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Revenus — journal de tous tes paiements',
    description: 'Tu peux maintenant enregistrer manuellement tes paiements reçus (virement, espèces, chèque…) en plus des paiements en ligne. Tout s\'affiche dans un seul journal clair avec le logement, le montant et le statut — encaissé ou en attente.',
  },
  {
    id: 'dashboard-resume-operationnel-apr-2026',
    date: '2026-04-19',
    tag: 'amélioration',
    title: 'Accueil — un vrai résumé de ton activité',
    description: 'La page d\'accueil te montre maintenant ce qui compte vraiment : tes séjours en cours, les arrivées de la semaine et les choses à ne pas oublier. Pratique pour démarrer la journée d\'un coup d\'œil.',
  },
  {
    id: 'calendrier-4-blocs-priorite-apr-2026',
    date: '2026-04-19',
    tag: 'amélioration',
    title: 'Calendrier — alertes classées par priorité',
    description: 'Les actions à faire sont maintenant regroupées par niveau d\'urgence : Critique, Urgent, Important, À faire. Tu sais immédiatement quoi traiter en premier.',
  },
  {
    id: 'calendrier-checklist-sejour-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Calendrier — check-list par séjour',
    description: 'Chaque séjour a maintenant sa propre check-list : contrat envoyé, acompte reçu, ménage planifié, check-out… Coche au fur et à mesure et valide toute une étape d\'un seul clic.',
  },
  {
    id: 'calendrier-alertes-intelligentes-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Calendrier — rappels automatiques par séjour',
    description: 'Le calendrier te signale discrètement les oublis : contrat non signé, solde non reçu, instructions pas encore envoyées… Les rappels s\'effacent automatiquement une fois la tâche cochée.',
  },
  {
    id: 'calendrier-categories-refonte-apr-2026',
    date: '2026-04-19',
    tag: 'amélioration',
    title: 'Calendrier — catégories simplifiées',
    description: 'Les types d\'événements ont été simplifiés pour coller à la réalité du terrain : Ménage, RDV et Tâche. Plus clair, plus rapide à utiliser.',
  },
  {
    id: 'calendrier-bug-date-apr-2026',
    date: '2026-04-19',
    tag: 'correction',
    title: 'Calendrier — création d\'événement corrigée',
    description: 'La date de fin s\'affichait parfois incorrectement à l\'ouverture du formulaire. C\'est corrigé.',
  },
  {
    id: 'voyageur-signalement-temoignage-apr-2026',
    date: '2026-04-12',
    tag: 'nouveau',
    title: 'Signaler ou témoigner directement depuis la fiche voyageur',
    description: 'Deux nouveaux boutons sur chaque fiche voyageur : "Signaler" pour remonter un incident (dégradation, arnaque, fête non autorisée…) et "Témoigner" pour laisser un retour positif. Les informations du voyageur sont pré-remplies automatiquement et le signalement est connecté à la base Sécurité Voyageur partagée avec la communauté.',
  },
  {
    id: 'guide-lcd-refonte-apr-2026',
    date: '2026-04-09',
    tag: 'amélioration',
    title: 'Refonte complète du Guide LCD',
    description: 'Le Guide LCD a été entièrement repensé : 4 profils distincts (Gîtes, Chambres d\'hôtes, Conciergeries, Réservation directe), 12 fiches détaillées avec indicateurs visuels (règle, avertissement, info) et mise à jour loi Le Meur 2025. Filtre par profil pour n\'afficher que ce qui te concerne.',
  },
  {
    id: 'gabarits-en-timing-apr-2026',
    date: '2026-04-08',
    tag: 'amélioration',
    title: 'Gabarits — version EN et filtres par moment',
    description: 'Les gabarits disposent d\'un toggle FR / EN pour accéder à la traduction anglaise. Filtre rapidement par moment : "Avant l\'arrivée", "Pendant le séjour" ou "Après le départ".',
  },
  {
    id: 'nouveautes-page-apr-2026',
    date: '2026-04-07',
    tag: 'nouveau',
    title: 'Page Nouveautés dédiée',
    description: 'Toutes les avancées de la plateforme sont désormais consultables sur une page dédiée. Retrouve l\'historique complet depuis le menu.',
  },
  {
    id: 'notif-system-apr-2026',
    date: '2026-04-06',
    tag: 'nouveau',
    title: 'Centre de notifications',
    description: 'Un panneau dédié pour suivre toutes les nouveautés et améliorations de la plateforme — tu es au bon endroit !',
  },
  {
    id: 'formations-catalog-apr-2026',
    date: '2026-04-01',
    tag: 'amélioration',
    title: '14 formations disponibles + filtres avancés',
    description: 'Le catalogue atteint 14 formations avec de nouveaux filtres par thème et par niveau.',
  },
  {
    id: 'theme-toggle-mar-2026',
    date: '2026-03-28',
    tag: 'amélioration',
    title: 'Mode clair / sombre amélioré',
    description: 'Le thème est maintenant mémorisé entre les sessions. Passe du mode sombre au mode clair en un clic depuis le header.',
  },
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
    description: 'Plus de 20 modèles de messages prêts à l\'emploi : check-in, check-out, bienvenue, avis clients… Copie en un clic et personnalise selon ton style.',
  },
  {
    id: 'formations-progress-mar-2026',
    date: '2026-03-01',
    tag: 'amélioration',
    title: 'Suivi de progression des formations',
    description: 'Ta progression est maintenant sauvegardée automatiquement. Reprends une formation là où tu t\'es arrêté, à tout moment.',
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
    title: 'Accès aux groupes communautaires',
    description: 'Rejoins les groupes Facebook de la communauté Jason Marinho directement depuis ton dashboard. Réseau, entraide et partage d\'expériences.',
  },
  {
    id: 'auth-jan-2026',
    date: '2026-01-15',
    tag: 'important',
    title: 'Lancement de la plateforme membre',
    description: 'Bienvenue ! L\'espace membre Driing est officiellement lancé avec l\'authentification sécurisée, le profil personnalisé et l\'accès aux formations.',
  },
]
