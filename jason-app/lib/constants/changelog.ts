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
    id: 'notif-system-apr-2025',
    date: '2026-04-06',
    tag: 'nouveau',
    title: 'Centre de notifications',
    description: 'Un panneau dédié pour suivre toutes les nouveautés et améliorations de la plateforme — tu es au bon endroit !',
  },
  {
    id: 'blog-page-apr-2025',
    date: '2026-04-04',
    tag: 'nouveau',
    title: 'Page Blog intégrée au dashboard',
    description: 'Les articles du blog jasonmarinho.com sont désormais accessibles directement depuis ton espace membre, sans quitter le dashboard.',
  },
  {
    id: 'theme-toggle-mar-2025',
    date: '2026-03-28',
    tag: 'amélioration',
    title: 'Mode clair / sombre amélioré',
    description: 'Le thème est maintenant mémorisé entre les sessions. Passe du mode sombre au mode clair en un clic depuis le header.',
  },
  {
    id: 'securite-traveler-mar-2025',
    date: '2026-03-20',
    tag: 'nouveau',
    title: 'Vérification voyageurs',
    description: 'La section Sécurité est en ligne. Vérifie l\'identité de tes voyageurs et consulte les signalements de la communauté avant chaque séjour.',
  },
  {
    id: 'gabarits-mar-2025',
    date: '2026-03-15',
    tag: 'nouveau',
    title: 'Bibliothèque de gabarits',
    description: 'Plus de 20 modèles de messages prêts à l\'emploi : check-in, check-out, bienvenue, avis clients… Copie en un clic et personnalise selon ton style.',
  },
  {
    id: 'formations-progress-feb-2025',
    date: '2026-03-01',
    tag: 'amélioration',
    title: 'Suivi de progression des formations',
    description: 'Ta progression est maintenant sauvegardée automatiquement. Reprends une formation là où tu t\'es arrêté, à tout moment.',
  },
  {
    id: 'partenaires-feb-2025',
    date: '2026-02-20',
    tag: 'nouveau',
    title: 'Espace partenaires Driing',
    description: 'Accède aux offres exclusives de nos partenaires sélectionnés pour les hôtes : outils de gestion, services de conciergerie et bien plus.',
  },
  {
    id: 'communaute-feb-2025',
    date: '2026-02-10',
    tag: 'nouveau',
    title: 'Accès aux groupes communautaires',
    description: 'Rejoins les groupes Facebook de la communauté Jason Marinho directement depuis ton dashboard. Réseau, entraide et partage d\'expériences.',
  },
  {
    id: 'auth-jan-2025',
    date: '2026-01-15',
    tag: 'important',
    title: 'Lancement de la plateforme membre',
    description: 'Bienvenue ! L\'espace membre Driing est officiellement lancé avec l\'authentification sécurisée, le profil personnalisé et l\'accès aux formations.',
  },
]
