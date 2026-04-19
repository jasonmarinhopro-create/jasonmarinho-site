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
    id: 'dashboard-resume-operationnel-apr-2026',
    date: '2026-04-19',
    tag: 'amélioration',
    title: 'Tableau de bord — résumé opérationnel du jour',
    description: 'La page d\'accueil affiche maintenant un vrai résumé de ton activité : séjours actifs, arrivées dans les 7 prochains jours et actions requises (contrats non signés, paiements en attente). Les stats formations ont été remplacées par ces indicateurs opérationnels, bien plus utiles au quotidien.',
  },
  {
    id: 'calendrier-4-blocs-priorite-apr-2026',
    date: '2026-04-19',
    tag: 'amélioration',
    title: 'Calendrier — section "À traiter" en 4 blocs de priorité',
    description: 'La liste d\'alertes est remplacée par 4 blocs colorés : Critique, Urgent, Important, À faire. Chaque bloc regroupe les actions de même niveau avec le nom du logement et le timing. Les blocs sans action passent en transparence.',
  },
  {
    id: 'calendrier-checklist-sejour-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Calendrier — check-list opérationnelle par séjour',
    description: '13 étapes réparties en 3 phases (Avant l\'arrivée, Pendant le séjour, Après le départ) pour chaque contrat. Un bouton "Tout cocher / Tout décocher" par phase permet de valider d\'un coup. La progression est affichée en temps réel et synchronisée avec la base de données.',
  },
  {
    id: 'calendrier-alertes-intelligentes-apr-2026',
    date: '2026-04-19',
    tag: 'nouveau',
    title: 'Calendrier — alertes intelligentes sur les dates',
    description: 'Des points colorés apparaissent sur les cases du calendrier pour signaler les actions non faites : contrat non signé (J-7), solde non reçu (J-3), instructions non envoyées (J-2), avis non demandé (J+3 après départ). Clique sur l\'alerte pour naviguer directement au séjour concerné.',
  },
  {
    id: 'calendrier-categories-refonte-apr-2026',
    date: '2026-04-19',
    tag: 'amélioration',
    title: 'Calendrier — refonte des catégories d\'événements',
    description: '"Entretien" renommé en "Ménage", "Admin" renommé en "Tâche", catégorie "Note" supprimée. Les anciens événements sont migrés automatiquement. Le sélecteur affiche désormais Ménage, RDV et Tâche.',
  },
  {
    id: 'calendrier-bug-date-apr-2026',
    date: '2026-04-19',
    tag: 'correction',
    title: 'Calendrier — correction de la saisie de date de fin',
    description: 'Cliquer sur "Ajouter un événement" affichait "Invalid Date" dans le champ date de fin. Corrigé : la date de la journée sélectionnée est maintenant correctement pré-remplie à l\'ouverture du formulaire.',
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
