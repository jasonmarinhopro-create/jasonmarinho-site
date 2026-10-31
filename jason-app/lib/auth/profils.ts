// Profils proposés à l'inscription (31/10/2026, refonte de /auth/register).
// Une seule liste : ajouter un métier (maintenance, etc.) = une entrée ici.
// Les hôtes et investisseurs créent leur compte dans l'app ; les pros passent
// par l'inscription du site (fiche + paiement Stripe, compte créé au paiement).

export type ProfilId = 'host' | 'investor' | 'photo' | 'menage' | 'maintenance'
export type GroupeId = 'loue' | 'pro'
export type IconeProfil = 'maison' | 'courbe' | 'appareil' | 'eclat' | 'cle'

export interface ProfilInscription {
  id: ProfilId
  groupe: GroupeId
  titre: string
  ligne: string
  /** Pastille de la liste */
  pastille: string
  icone: IconeProfil
  /** Panneau de gauche quand le profil est choisi */
  accroche: string
  points: string[]
  /** Inscription des pros sur le site (fiche et paiement) */
  inscriptionPro?: string
  /** Métier annoncé, pas encore ouvert */
  bientot?: boolean
}

export const GROUPES: { id: GroupeId; nom: string }[] = [
  { id: 'loue', nom: 'Je loue' },
  { id: 'pro', nom: 'Je travaille pour les hôtes' },
]

const POINTS_PRO = [
  'Ta fiche vitrine, visible sur Google',
  'Les demandes des hôtes de ton secteur',
  'Tes statistiques de visites et de contacts',
]

export const PROFILS: ProfilInscription[] = [
  {
    id: 'host', groupe: 'loue', titre: 'Hôte', icone: 'maison', pastille: 'Gratuit',
    ligne: 'Je loue un ou plusieurs logements en courte durée',
    accroche: 'Ton activité de location, au même endroit.',
    points: ['Réservations, calendrier et contrats avec caution', 'Messages prêts à envoyer à tes voyageurs', 'Formations, simulateurs et entraide entre hôtes'],
  },
  {
    id: 'investor', groupe: 'loue', titre: 'Investisseur', icone: 'courbe', pastille: 'Gratuit',
    ligne: 'Je prépare un achat pour la location courte durée',
    accroche: 'Ton projet chiffré, avant d’acheter.',
    points: ['Revenus et rentabilité estimés sur des données sourcées', 'Un prévisionnel prêt pour ta banque', 'Les règles de ta ville avant de signer'],
  },
  {
    id: 'photo', groupe: 'pro', titre: 'Photographe ou vidéaste', icone: 'appareil', pastille: 'Annuaire',
    ligne: 'Je mets en valeur les logements des hôtes',
    accroche: 'Les hôtes de ta ville te trouvent.', points: POINTS_PRO,
    inscriptionPro: 'https://jasonmarinho.com/annuaires/photographes/inscription',
  },
  {
    id: 'menage', groupe: 'pro', titre: 'Équipe de ménage', icone: 'eclat', pastille: 'Annuaire',
    ligne: 'J’assure le ménage et le linge entre deux séjours',
    accroche: 'Les hôtes de ta ville te trouvent.', points: POINTS_PRO,
    inscriptionPro: 'https://jasonmarinho.com/annuaires/menage/inscription',
  },
  {
    id: 'maintenance', groupe: 'pro', titre: 'Maintenance et dépannage', icone: 'cle', pastille: 'Bientôt', bientot: true,
    ligne: 'Plomberie, électricité, petites réparations',
    accroche: 'Les hôtes de ta ville te trouvent.', points: POINTS_PRO,
  },
]

export const ACCUEIL = {
  accroche: 'L’espace des pros de la location courte durée.',
  points: ['Hôtes : outils, formations et communauté', 'Pros : une fiche vitrine et des demandes près de chez toi', 'Gratuit pour les hôtes, sans commission pour les pros'],
}

/** Profil demandé par l'URL (?role=…), anciens liens compris. */
export function profilDepuisRole(role: string | null | undefined): ProfilId | null {
  switch ((role ?? '').toLowerCase()) {
    case 'host': case 'hote': return 'host'
    case 'investor': case 'investisseur': return 'investor'
    case 'photo': case 'photographe': case 'videaste': return 'photo'
    case 'menage': return 'menage'
    default: return null
  }
}

export function profil(id: ProfilId | null): ProfilInscription | null {
  return PROFILS.find(p => p.id === id) ?? null
}

/** Profils qui créent leur compte dans l'app (les autres vont sur le site). */
export function compteDansLApp(p: ProfilInscription | null): boolean {
  return !!p && !p.bientot && !p.inscriptionPro
}
