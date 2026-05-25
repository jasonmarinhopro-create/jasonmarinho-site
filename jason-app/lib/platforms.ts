// Configuration des plateformes de réservation
// Utilisé dans :
// - VoyageurDetail (sélection plateforme + auto-suggestion commission)
// - RevenusView (calcul du revenu net après commissions)
// - Statistiques par plateforme

export type PlatformKey =
  | 'driing'    // Plateforme partenaire, recommandée, 0% commission
  | 'direct'    // Canal direct (site perso, réservation par téléphone, etc.)
  | 'airbnb'
  | 'booking'
  | 'abritel'
  | 'vrbo'
  | 'autre'

export type PlatformDef = {
  label: string
  icon: string
  /** Taux de commission par défaut, en % du montant total payé par le voyageur.
   *  Le hôte peut surcharger ce taux séjour par séjour. */
  defaultCommissionPct: number
  /** True si la plateforme est valorisée (canal direct ou partenaire) */
  isDirect: boolean
}

// Note : ordre = ordre d'affichage. Direct/Driing en premier pour mettre
// en avant les canaux sans commission.
//
// Taux de commission = % du TOTAL payé par le voyageur jusqu'au NET touché
// par l'hôte. Pour Airbnb en modèle "split-fee" (le plus courant), ça inclut
// les frais voyageur (~14 %) côté traveler + les frais hôte (3 % + TVA), soit
// ~17-18 % effectif du montant total. Ces taux sont des moyennes : Airbnb
// varie selon la réservation, l'hôte ajuste séjour par séjour avec son net réel.
export const PLATFORMS: Record<PlatformKey, PlatformDef> = {
  driing:   { label: 'Driing',         icon: '🔔', defaultCommissionPct: 0,    isDirect: true  },
  direct:   { label: 'En direct',      icon: '🤝', defaultCommissionPct: 0,    isDirect: true  },
  airbnb:   { label: 'Airbnb',         icon: '🏠', defaultCommissionPct: 17,   isDirect: false },
  booking:  { label: 'Booking.com',    icon: '🛎️', defaultCommissionPct: 16,   isDirect: false },
  abritel:  { label: 'Abritel',        icon: '🏡', defaultCommissionPct: 8,    isDirect: false },
  vrbo:     { label: 'Vrbo',           icon: '🌴', defaultCommissionPct: 8,    isDirect: false },
  autre:    { label: 'Autre plateforme', icon: '📄', defaultCommissionPct: 0,  isDirect: false },
}

export const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[]

/** Calcule une suggestion de commission à partir d'un montant brut. */
export function suggestCommission(montant: number, platform: PlatformKey | string | null): number {
  if (!platform || montant <= 0) return 0
  const def = PLATFORMS[platform as PlatformKey]
  if (!def) return 0
  return Math.round(montant * (def.defaultCommissionPct / 100) * 100) / 100
}

/** Retourne le label d'une plateforme, ou un fallback. */
export function platformLabel(key: string | null | undefined): string {
  if (!key) return 'En direct'
  return PLATFORMS[key as PlatformKey]?.label ?? key
}
