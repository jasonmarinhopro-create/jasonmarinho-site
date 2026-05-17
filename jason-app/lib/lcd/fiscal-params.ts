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
      plafond: 77700,
      label: 'Meublé classé Atout France',
    },
    chambresHotes: {
      abattement: 0.50,          // 50 % depuis CE 16/09/2025
      abattementMinimum: 305,
      plafond: 77700,
      label: "Chambres d'hôtes",
    },
  },

  // ─── Versement libératoire ─────────────────────────────────────────────
  // Seuils RFR du foyer fiscal (avant-dernière année)
  versementLiberatoire: {
    plafondRfr1part: 27478,
    plafondRfr2parts: 54956,
    plafondRfr3parts: 82434,
    tauxClasse: 0.01,            // 1 % CA
    tauxNonClasse: 0.017,        // 1,7 % CA
  },

  // ─── Impôt sur le revenu ───────────────────────────────────────────────
  ir: {
    tranches: [
      { jusqua: 11497, taux: 0 },
      { jusqua: 29315, taux: 0.11 },
      { jusqua: 83823, taux: 0.30 },
      { jusqua: 180294, taux: 0.41 },
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
    flatTax: 0.30,               // PFU sur dividendes (12,8 IR + 17,2 PS)
    csgDeductible: 0.068,        // CSG déductible si option barème
  },

  // ─── EI au régime réel (cotisations TNS approx) ───────────────────────
  ei: {
    // Taux approximatif moyen URSSAF / SSI / CIPAV — varie selon profil
    tauxCotisationsTns: 0.42,
    seuilLmp: 23000,             // € de CA pour basculer en LMP (si >50% revenus foyer)
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
    derniereMaj: '2026-05-17',
  },
} as const

// ─── Helper : déterminer le régime selon CA ───────────────────────────
export type RegimeFiscalEstime = 'aucun' | 'micro-non-classe' | 'micro-classe' | 'reel'

export function estimateRegimeFromCA(ca: number): {
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
  if (ca <= FISCAL_PARAMS_2026.microBic.nonClasse.plafond) {
    return {
      regime: 'micro-non-classe',
      label: 'Micro-BIC, non classé',
      hint: `Plafond ${FISCAL_PARAMS_2026.microBic.nonClasse.plafond.toLocaleString('fr-FR')} €, abattement ${Math.round(FISCAL_PARAMS_2026.microBic.nonClasse.abattement * 100)} %`,
    }
  }
  if (ca <= FISCAL_PARAMS_2026.microBic.classe.plafond) {
    return {
      regime: 'micro-classe',
      label: 'Micro-BIC, classé Atout France',
      hint: `Plafond ${FISCAL_PARAMS_2026.microBic.classe.plafond.toLocaleString('fr-FR')} €, abattement ${Math.round(FISCAL_PARAMS_2026.microBic.classe.abattement * 100)} %`,
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
  if (autresRevenus === null) {
    return {
      statut: 'lmnp',
      label: 'LMNP probable',
      details: `CA LCD ≥ ${seuil.toLocaleString('fr-FR')} € — vérifie ton autre revenu foyer pour confirmer (LMP si LCD > 50 % des revenus)`,
    }
  }
  if (caLcd > autresRevenus) {
    return {
      statut: 'lmp',
      label: 'LMP',
      details: `CA LCD > autres revenus du foyer → bascule LMP automatique (cotisations sociales TNS)`,
    }
  }
  return {
    statut: 'lmnp',
    label: 'LMNP',
    details: `Tu restes LMNP : LCD ≤ autres revenus du foyer`,
  }
}
