/**
 * Paramètres fiscaux LCD — source de vérité unique.
 *
 * Utilisé par :
 *   - Le dashboard (simulateurs fiscaux préfilés)
 *   - Le helper account-stats.ts (détection régime estimé)
 *   - Les pages statiques (via export JSON sync — voir generate-fiscal-params-json.mjs)
 *
 * Si tu modifies un seuil ici, lance ensuite :
 *   node scripts/generate-fiscal-params-json.mjs
 * pour propager dans le site statique.
 */

export const FISCAL_PARAMS_2026 = {
  // ─── Micro-BIC (loi Le Meur applicable depuis 2025) ────────────────────
  microBic: {
    nonClasse: {
      abattement: 0.30,          // 30 %
      abattementMinimum: 305,    // € (CGI art. 50-0)
      plafond: 15000,            // € de CA annuel
      label: 'Meublé non classé',
    },
    classe: {
      abattement: 0.50,          // 50 % depuis loi Le Meur (avant 71 %)
      abattementMinimum: 305,
      // Revenus 2026 à 2028 : 83 600 € (revalorisation triennale, LégiFiscal).
      // 77 700 € s'appliquait aux revenus 2025.
      plafond: 83600,
      label: 'Meublé classé Atout France',
    },
    chambresHotes: {
      abattement: 0.50,          // 50 % depuis CE 16/09/2025, non rétabli à 71 % par la LFi 2026
      abattementMinimum: 305,
      plafond: 83600,            // revenus 2026 (77 700 € pour 2025)
      label: "Chambres d'hôtes",
    },
  },

  // ─── Versement libératoire ─────────────────────────────────────────────
  // Option en 2026 : RFR 2024 ≤ 29 315 € par part (2e tranche du barème
  // appliqué aux revenus 2024), majoré de 50 % par demi-part.
  versementLiberatoire: {
    plafondRfr1part: 29315,
    plafondRfr2parts: 58630,
    plafondRfr3parts: 87945,
    tauxClasse: 0.01,            // 1 % CA
    tauxNonClasse: 0.017,        // 1,7 % CA
  },

  // ─── Impôt sur le revenu ───────────────────────────────────────────────
  // Barème 2026 sur les revenus 2025 (loi n° 2026-103 du 19/02/2026, art. 4,
  // indexation 0,9 %), par part de quotient familial.
  ir: {
    tranches: [
      { jusqua: 11600, taux: 0 },
      { jusqua: 29579, taux: 0.11 },
      { jusqua: 84577, taux: 0.30 },
      { jusqua: 181917, taux: 0.41 },
      { jusqua: Infinity, taux: 0.45 },
    ],
  },

  // ─── Société (SASU 100 % dividendes) ──────────────────────────────────
  societe: {
    is: {
      tauxReduit: 0.15,          // jusqu'à 42 500 € de bénéfice
      seuilTauxReduit: 42500,
      tauxNormal: 0.25,
    },
    flatTax: 0.314,              // PFU sur dividendes versés depuis le 01/01/2026 : 12,8 IR + 18,6 PS (LFSS 2026, art. 12)
    // Prélèvements sociaux sur les revenus LMNP (BIC non professionnels) depuis les revenus 2025.
    // La location nue et les plus-values immobilières restent à 17,2 %.
    prelevementsSociauxLmnp: 0.186,
    csgDeductible: 0.068,        // CSG déductible si option barème
  },

  // ─── EI au régime réel (cotisations TNS approx) ───────────────────────
  ei: {
    // Ordre de grandeur des cotisations SSI d'un indépendant : environ 45 % du
    // revenu net, soit ~32 % du bénéfice avant cotisations (varie selon le
    // revenu : minimales en bas, plafonnées en haut). Estimation, pas un calcul Urssaf.
    tauxCotisationsTns: 0.32,
    // 23 000 € de recettes : seuil fiscal du LMP (avec recettes > autres revenus
    // d'activité du foyer) ET, pour la location courte durée (meublé de
    // tourisme), seuil d'affiliation sociale à lui seul (art. L613-1 CSS) :
    // cotisations sociales dues même en LMNP, à la place des 18,6 %.
    seuilLmp: 23000,
  },

  // ─── TVA / Franchise en base ───────────────────────────────────────────
  // LCD para-hôtelière (au moins 3 services sur 4 : petit-déjeuner, ménage
  // régulier pendant le séjour, linge, réception même non personnalisée,
  // séjours de 30 nuits max, art. 261 D 4° CGI) : prestation d'hébergement,
  // TVA 10 % au-delà de la franchise hébergement (85 000 € / 93 500 € majoré).
  // Sans ces services : location meublée exonérée, aucun seuil.
  // Le seuil 37 500 € / 41 250 € vise les autres prestations de services
  // (conciergerie). Seuil unique 25 000 € abandonné (loi 2025-1044, 3/11/2025).
  tva: {
    seuilFranchise: 85000,        // € : hébergement, sous ce CA pas de TVA à facturer
    seuilTolerance: 93500,        // € : seuil majoré, TVA due dès le jour du dépassement
    tauxLcdHotelier: 0.10,        // TVA 10 % hébergement para-hôtelier
    seuilServices: 37500,         // € : prestations de services (conciergerie)
    seuilServicesTolerance: 41250,
    label: 'Franchise en base hébergement',
  },

  // ─── Plafonds régime micro-foncier (location nue, pour ref) ───────────
  microFoncier: {
    plafond: 15000,
    abattement: 0.30,
  },

  // ─── Métadonnées ───────────────────────────────────────────────────────
  meta: {
    annee: 2026,
    versionLoi: 'Loi Le Meur (2025) + LFi 2026',
    derniereMaj: '2026-09-27',
  },
} as const

// ─── Helper : déterminer le régime selon CA ───────────────────────────
export type RegimeFiscalEstime = 'aucun' | 'micro-non-classe' | 'micro-classe' | 'reel'

export function estimateRegimeFromCA(
  ca: number,
  opts: { isClasse?: boolean } = {},
): {
  regime: RegimeFiscalEstime
  label: string
  hint: string
} {
  if (ca <= 0) {
    return {
      regime: 'aucun',
      label: 'À configurer',
      hint: 'Ajoute tes premiers séjours pour estimer ton régime',
    }
  }
  const isClasse = !!opts.isClasse
  // Si classé, le plafond micro est 83 600 € en 2026 (sinon 15 000 € en non classé)
  const effectifPlafond = isClasse
    ? FISCAL_PARAMS_2026.microBic.classe.plafond
    : FISCAL_PARAMS_2026.microBic.nonClasse.plafond
  if (ca <= effectifPlafond) {
    if (isClasse) {
      return {
        regime: 'micro-classe',
        label: 'Micro-BIC, classé Atout France',
        hint: `Plafond ${FISCAL_PARAMS_2026.microBic.classe.plafond.toLocaleString('fr-FR')} €, abattement ${Math.round(FISCAL_PARAMS_2026.microBic.classe.abattement * 100)} %`,
      }
    }
    return {
      regime: 'micro-non-classe',
      label: 'Micro-BIC, non classé',
      hint: `Plafond ${FISCAL_PARAMS_2026.microBic.nonClasse.plafond.toLocaleString('fr-FR')} €, abattement ${Math.round(FISCAL_PARAMS_2026.microBic.nonClasse.abattement * 100)} %`,
    }
  }
  // Au-dessus du plafond non classé mais sous le plafond classé : projection si classement
  if (ca <= FISCAL_PARAMS_2026.microBic.classe.plafond && !isClasse) {
    return {
      regime: 'reel',
      label: 'Régime réel (sauf si classé)',
      hint: `Au-dessus de ${FISCAL_PARAMS_2026.microBic.nonClasse.plafond.toLocaleString('fr-FR')} €, classer ton meublé permettrait de rester en micro jusqu'à ${FISCAL_PARAMS_2026.microBic.classe.plafond.toLocaleString('fr-FR')} €`,
    }
  }
  return {
    regime: 'reel',
    label: 'Régime réel simplifié',
    hint: 'Au-dessus du plafond micro-BIC',
  }
}

// ─── Helper : détection LMNP vs LMP ───────────────────────────────────
export type StatutLocatif = 'lmnp' | 'lmp' | 'a-configurer'

export function detectStatutLocatif(
  caLcd: number,
  autresRevenus: number | null
): { statut: StatutLocatif; label: string; details: string } {
  if (caLcd <= 0) {
    return {
      statut: 'a-configurer',
      label: 'À configurer',
      details: 'Ajoute tes séjours et tes autres revenus',
    }
  }
  const seuil = FISCAL_PARAMS_2026.ei.seuilLmp
  if (caLcd < seuil) {
    return {
      statut: 'lmnp',
      label: 'LMNP probable',
      details: `CA LCD sous ${seuil.toLocaleString('fr-FR')} € → tu restes en location meublée non professionnelle`,
    }
  }
  // CA >= seuil : test second critère
  // Au-delà de 23 000 € en courte durée : cotisations sociales dues dans tous
  // les cas (art. L613-1 CSS), le statut fiscal LMP dépend en plus des autres revenus.
  const social = `cotisations sociales dues au-delà de ${seuil.toLocaleString('fr-FR')} € de recettes en courte durée, même en LMNP`
  if (autresRevenus === null) {
    return {
      statut: 'lmnp',
      label: 'LMNP probable',
      details: `Renseigne les autres revenus d'activité du foyer pour savoir si tu es LMP ; ${social}`,
    }
  }
  if (caLcd > autresRevenus) {
    return {
      statut: 'lmp',
      label: 'LMP',
      details: `Recettes > autres revenus d'activité du foyer : loueur professionnel, cotisations sociales (SSI)`,
    }
  }
  return {
    statut: 'lmnp',
    label: 'LMNP',
    details: `LMNP pour l'impôt (recettes ≤ autres revenus du foyer), mais ${social}`,
  }
}
