import { estimateRegimeFromCA, type RegimeFiscalEstime, FISCAL_PARAMS_2026 } from './fiscal-params'

type LogementWithStats = {
  ville: string | null
  stats?: {
    nuitsLouees: number
    revenuTotal: number
    adrReel: number
    occupationReelle: number
    nbSejours: number
  }
}

export type Insight = {
  message: string
  ctaLabel: string
  ctaHref: string
  tone: 'neutral' | 'opportunity' | 'warning'
}

export type AccountStats = {
  fullName: string | null
  firstName: string
  plan: 'decouverte' | 'standard' | 'driing'
  caTotal12m: number
  nbLogements: number
  nbLogementsActifs: number
  nuitsTotales12m: number
  adrMoyen: number
  occupationMoyenne: number
  regimeEstime: RegimeFiscalEstime
  regimeLabel: string
  regimeHint: string
  villes: string[]
  insights: {
    ca: Insight | null
    logements: Insight | null
    adr: Insight | null
    regime: Insight | null
  }
}

export function computeAccountStats(
  prefill: LogementWithStats[],
  profile: { full_name: string | null; plan: 'decouverte' | 'standard' | 'driing' }
): AccountStats {
  const caTotal12m = prefill.reduce((sum, l) => sum + (l.stats?.revenuTotal ?? 0), 0)
  const nuitsTotales12m = prefill.reduce((sum, l) => sum + (l.stats?.nuitsLouees ?? 0), 0)
  const nbLogements = prefill.length
  const nbLogementsActifs = prefill.filter(l => l.stats && l.stats.nuitsLouees > 0).length
  const adrMoyen = nuitsTotales12m > 0 ? Math.round(caTotal12m / nuitsTotales12m) : 0
  const occupationMoyenne = nbLogementsActifs > 0
    ? Math.round(prefill.reduce((sum, l) => sum + (l.stats?.occupationReelle ?? 0), 0) / nbLogementsActifs)
    : 0

  const regimeInfo = estimateRegimeFromCA(caTotal12m)

  const villes = Array.from(new Set(prefill.map(l => l.ville).filter(Boolean) as string[]))

  const fullName = profile.full_name
  const firstName = (fullName ?? '').split(' ')[0] || 'Hôte'

  return {
    fullName,
    firstName,
    plan: profile.plan,
    caTotal12m,
    nbLogements,
    nbLogementsActifs,
    nuitsTotales12m,
    adrMoyen,
    occupationMoyenne,
    regimeEstime: regimeInfo.regime,
    regimeLabel: regimeInfo.label,
    regimeHint: regimeInfo.hint,
    villes,
    insights: computeInsights({
      caTotal12m,
      nbLogements,
      nbLogementsActifs,
      adrMoyen,
      regime: regimeInfo.regime,
    }),
  }
}

// ─── Moteur d'insights : transforme les stats en recommandations actionnables ─
function computeInsights(s: {
  caTotal12m: number
  nbLogements: number
  nbLogementsActifs: number
  adrMoyen: number
  regime: RegimeFiscalEstime
}): AccountStats['insights'] {
  const plafondNc = FISCAL_PARAMS_2026.microBic.nonClasse.plafond  // 15 000
  const plafondCl = FISCAL_PARAMS_2026.microBic.classe.plafond     // 77 700

  // ── CA tile ──
  let ca: Insight | null = null
  if (s.caTotal12m === 0 && s.nbLogements > 0) {
    ca = {
      message: 'Saisis tes séjours pour voir ton activité réelle',
      ctaLabel: 'Aller au calendrier',
      ctaHref: '/dashboard/calendrier',
      tone: 'neutral',
    }
  } else if (s.caTotal12m > 0 && s.caTotal12m < plafondNc * 0.5) {
    ca = {
      message: 'Beau démarrage. Vise plus haut en te classant Atout France',
      ctaLabel: 'Voir mon économie potentielle',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'opportunity',
    }
  } else if (s.caTotal12m >= plafondNc * 0.8 && s.caTotal12m < plafondNc) {
    const reste = plafondNc - s.caTotal12m
    ca = {
      message: `Tu approches du plafond ${plafondNc.toLocaleString('fr-FR')} € (reste ${Math.round(reste).toLocaleString('fr-FR')} €)`,
      ctaLabel: 'Préparer le passage en classé',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'warning',
    }
  } else if (s.caTotal12m >= plafondCl * 0.85) {
    ca = {
      message: `Tu approches du plafond ${plafondCl.toLocaleString('fr-FR')} € (régime réel obligatoire au-delà)`,
      ctaLabel: 'Simuler le régime réel',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'warning',
    }
  } else if (s.caTotal12m > plafondCl) {
    ca = {
      message: 'CA au-dessus du plafond micro — régime réel obligatoire dès N+1',
      ctaLabel: 'Comparer EI vs SASU',
      ctaHref: '/dashboard/simulateurs#statut',
      tone: 'warning',
    }
  }

  // ── Logements tile ──
  let logements: Insight | null = null
  if (s.nbLogements === 0) {
    logements = {
      message: 'Ajoute ton premier logement pour activer le pilotage',
      ctaLabel: 'Ajouter un logement',
      ctaHref: '/dashboard/logements',
      tone: 'opportunity',
    }
  } else if (s.nbLogements === 1) {
    logements = {
      message: 'Compare ton portefeuille en ajoutant tes autres biens',
      ctaLabel: 'Ajouter un logement',
      ctaHref: '/dashboard/logements',
      tone: 'neutral',
    }
  } else if (s.nbLogementsActifs < s.nbLogements) {
    const inactifs = s.nbLogements - s.nbLogementsActifs
    logements = {
      message: `${inactifs} logement${inactifs > 1 ? 's' : ''} sans séjour ce trimestre`,
      ctaLabel: 'Voir mes logements',
      ctaHref: '/dashboard/logements',
      tone: 'warning',
    }
  } else {
    logements = {
      message: 'Beau portefeuille. Compare leurs performances entre eux',
      ctaLabel: 'Voir les performances',
      ctaHref: '/dashboard/performances',
      tone: 'opportunity',
    }
  }

  // ── ADR tile ──
  let adr: Insight | null = null
  if (s.adrMoyen > 0) {
    adr = {
      message: 'Compare ton ADR au marché de ta ville en 30 secondes',
      ctaLabel: 'Comparer au marché',
      ctaHref: '/dashboard/calculateurs#mesvilles',
      tone: 'opportunity',
    }
  }

  // ── Régime tile ──
  let regime: Insight | null = null
  if (s.regime === 'aucun' && s.nbLogements > 0) {
    regime = {
      message: 'Régime calculé dès tes premiers séjours saisis',
      ctaLabel: 'Aller au calendrier',
      ctaHref: '/dashboard/calendrier',
      tone: 'neutral',
    }
  } else if (s.regime === 'micro-non-classe' && s.caTotal12m > 0) {
    // Économie potentielle si classement : (abat_classé - abat_nonclassé) × CA × TMI estimé 30%
    const economieAn = s.caTotal12m
      * (FISCAL_PARAMS_2026.microBic.classe.abattement - FISCAL_PARAMS_2026.microBic.nonClasse.abattement)
      * 0.30
    if (economieAn > 50) {
      regime = {
        message: `En te classant Atout France, économie estimée ~${Math.round(economieAn).toLocaleString('fr-FR')} €/an (TMI 30 %)`,
        ctaLabel: 'Comment me classer',
        ctaHref: '/services/simulateurs/fiscalite-micro-bic#explication',
        tone: 'opportunity',
      }
    } else {
      regime = {
        message: 'Économie modeste pour l\'instant. Pertinent dès que tu grossis',
        ctaLabel: 'Simuler à plus haut CA',
        ctaHref: '/dashboard/simulateurs#fiscal',
        tone: 'neutral',
      }
    }
  } else if (s.regime === 'micro-classe') {
    regime = {
      message: 'Tu profites de 50 % d\'abattement. Surveille le plafond 77 700 €',
      ctaLabel: 'Voir le détail',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'neutral',
    }
  } else if (s.regime === 'reel') {
    regime = {
      message: 'Régime réel : maximise tes charges déductibles',
      ctaLabel: 'Comparer EI vs SASU',
      ctaHref: '/dashboard/simulateurs#statut',
      tone: 'opportunity',
    }
  }

  return { ca, logements, adr, regime }
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
