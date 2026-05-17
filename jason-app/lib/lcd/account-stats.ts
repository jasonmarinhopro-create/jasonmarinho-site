import { estimateRegimeFromCA, type RegimeFiscalEstime, detectStatutLocatif, type StatutLocatif, FISCAL_PARAMS_2026 } from './fiscal-params'

type LogementWithStats = {
  ville: string | null
  classementAtoutFrance?: 'non_classe' | '1' | '2' | '3' | '4' | '5' | 'chambres_hotes' | null
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
  // Régime micro-BIC pré-rempli dans le simulateur Fiscalité.
  // Null si aucun classement renseigné → l'utilisateur choisit.
  defaultRegimeFiscal: 'non_classe' | 'classe' | 'cdh' | null
  statutLocatif: StatutLocatif
  statutLocatifLabel: string
  statutLocatifDetails: string
  villes: string[]
  insights: {
    ca: Insight | null
    logements: Insight | null
    adr: Insight | null
    regime: Insight | null
    statut: Insight | null
  }
}

export function computeAccountStats(
  prefill: LogementWithStats[],
  profile: { full_name: string | null; plan: 'decouverte' | 'standard' | 'driing'; autres_revenus_pro?: number | null }
): AccountStats {
  const caTotal12m = prefill.reduce((sum, l) => sum + (l.stats?.revenuTotal ?? 0), 0)
  const nuitsTotales12m = prefill.reduce((sum, l) => sum + (l.stats?.nuitsLouees ?? 0), 0)
  const nbLogements = prefill.length
  const nbLogementsActifs = prefill.filter(l => l.stats && l.stats.nuitsLouees > 0).length
  const adrMoyen = nuitsTotales12m > 0 ? Math.round(caTotal12m / nuitsTotales12m) : 0
  const occupationMoyenne = nbLogementsActifs > 0
    ? Math.round(prefill.reduce((sum, l) => sum + (l.stats?.occupationReelle ?? 0), 0) / nbLogementsActifs)
    : 0

  // Classement majoritaire : si la plupart des logements sont classés,
  // on bascule l'estimation sur le régime classé (50 %/77.7 k€)
  const classementCounts = prefill.reduce((acc, l) => {
    const c = l.classementAtoutFrance
    if (!c) return acc
    if (c === 'non_classe') acc.nonClasse++
    else if (c === 'chambres_hotes') acc.chambresHotes++
    else acc.classe++  // étoiles 1-5
    return acc
  }, { classe: 0, nonClasse: 0, chambresHotes: 0 })
  const totalRenseignes = classementCounts.classe + classementCounts.nonClasse + classementCounts.chambresHotes
  const tousClasses = totalRenseignes > 0 && classementCounts.classe + classementCounts.chambresHotes === totalRenseignes
  const tousNonClasses = totalRenseignes > 0 && classementCounts.nonClasse === totalRenseignes
  const mixteClassement = totalRenseignes > 0 && !tousClasses && !tousNonClasses
  const regimeInfo = estimateRegimeFromCA(caTotal12m, { isClasse: tousClasses })
  // autresRevenus = saisis dans /dashboard/profil (FiscalContextCard).
  // Si null, l'algo retombe sur "LMNP probable à vérifier".
  const autresRevenus = (typeof profile.autres_revenus_pro === 'number' && profile.autres_revenus_pro >= 0)
    ? profile.autres_revenus_pro
    : null
  const statutInfo = detectStatutLocatif(caTotal12m, autresRevenus)

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
    defaultRegimeFiscal: classementCounts.chambresHotes >= Math.max(classementCounts.classe, classementCounts.nonClasse) && classementCounts.chambresHotes > 0
      ? 'cdh'
      : classementCounts.classe > classementCounts.nonClasse
        ? 'classe'
        : classementCounts.nonClasse > 0
          ? 'non_classe'
          : null,
    statutLocatif: statutInfo.statut,
    statutLocatifLabel: statutInfo.label,
    statutLocatifDetails: statutInfo.details,
    villes,
    insights: computeInsights({
      caTotal12m,
      nbLogements,
      nbLogementsActifs,
      adrMoyen,
      regime: regimeInfo.regime,
      statut: statutInfo.statut,
      tousClasses,
      tousNonClasses,
      mixteClassement,
      classementRenseigne: totalRenseignes > 0,
      autresRevenusRenseignes: autresRevenus !== null,
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
  statut: StatutLocatif
  tousClasses: boolean
  tousNonClasses: boolean
  mixteClassement: boolean
  classementRenseigne: boolean
  autresRevenusRenseignes: boolean
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
  } else if (s.caTotal12m > 0 && !s.classementRenseigne && s.nbLogements > 0) {
    // Cas critique : classement non renseigné → on prescrit la saisie pour
    // débloquer l'estimation exacte du régime
    regime = {
      message: 'Renseigne le classement de tes logements pour un régime exact',
      ctaLabel: 'Mettre à jour mes logements',
      ctaHref: '/dashboard/logements',
      tone: 'opportunity',
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
  // Note : si mixteClassement (logements mélangés), l'insight reste sur le
  // régime majoritaire mais le label de la tile aura déjà signalé "mixte"

  // ── Statut LMNP/LMP tile ──
  let statut: Insight | null = null
  if (s.statut === 'a-configurer') {
    statut = null
  } else if (s.statut === 'lmp') {
    statut = {
      message: 'LMP : cotisations sociales TNS (URSSAF) applicables. Anticipe.',
      ctaLabel: 'Comparer EI vs SASU',
      ctaHref: '/dashboard/simulateurs#statut',
      tone: 'warning',
    }
  } else if (s.caTotal12m >= FISCAL_PARAMS_2026.ei.seuilLmp && !s.autresRevenusRenseignes) {
    // CA >= 23k€ mais autres revenus pas saisis → on prescrit la saisie pour
    // verrouiller le statut LMNP/LMP
    statut = {
      message: `LMNP probable. Renseigne tes autres revenus pour verrouiller LMNP ou LMP`,
      ctaLabel: 'Renseigner mes revenus',
      ctaHref: '/dashboard/profil',
      tone: 'opportunity',
    }
  } else if (s.statut === 'lmnp' && s.caTotal12m >= FISCAL_PARAMS_2026.ei.seuilLmp) {
    statut = {
      message: 'LMNP confirmé : LCD ≤ autres revenus du foyer',
      ctaLabel: 'Voir le simulateur',
      ctaHref: '/dashboard/simulateurs#statut',
      tone: 'neutral',
    }
  }

  return { ca, logements, adr, regime, statut }
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
