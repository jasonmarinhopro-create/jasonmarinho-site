// Miroir de jason-app/lib/lcd/fiscal-params.ts pour les scripts Node.
// Si tu modifies une valeur ici, modifie aussi le fichier TS et inversement.
// Lance les générateurs après modification pour propager dans le HTML statique.

export const FISCAL_PARAMS_2026 = {
  microBic: {
    nonClasse: { abattement: 0.30, plafond: 15000, label: 'Meublé non classé' },
    classe:    { abattement: 0.50, plafond: 83600, label: 'Meublé classé Atout France' }, // revenus 2026 (77 700 € en 2025)
    cdh:       { abattement: 0.50, plafond: 83600, label: "Chambres d'hôtes" },
  },
  versementLiberatoire: {
    plafondRfr1part: 29315,
    plafondRfr2parts: 58630,
    plafondRfr3parts: 87945,
    tauxClasse: 0.01,
    tauxNonClasse: 0.017,
  },
  ir: {
    tranches: [
      { jusqua: 11600, taux: 0 },
      { jusqua: 29579, taux: 0.11 },
      { jusqua: 84577, taux: 0.30 },
      { jusqua: 181917, taux: 0.41 },
      { jusqua: Infinity, taux: 0.45 },
    ],
  },
  societe: {
    is: { tauxReduit: 0.15, seuilTauxReduit: 42500, tauxNormal: 0.25 },
    flatTax: 0.314,            // PFU dividendes 2026 : 12,8 % IR + 18,6 % PS (LFSS 2026, art. 12)
  },
  ei: {
    tauxCotisationsTns: 0.32,
    seuilLmp: 23000,
  },
  tva: {
    seuilFranchise: 85000,
    seuilTolerance: 93500,
    tauxLcdHotelier: 0.10,
    seuilServices: 37500,
    seuilServicesTolerance: 41250,
    label: 'Franchise en base hébergement',
  },
  meta: {
    annee: 2026,
    versionLoi: 'Loi Le Meur (2025) + LFi 2026',
  },
}

// Taxe de séjour 2026 : plafonds nationaux (barème DGCL 2026), miroir de
// jason-app/lib/lcd/taxe-sejour.ts. Chaque commune vote son tarif dans ces
// limites : les calculateurs demandent le tarif de la commune.
export const TAXE_SEJOUR_2026 = {
  categories: [
    { id: 'nc', label: 'Non classé', plafond: null },
    { id: 'cdh12', label: "1★, 2★ ou chambres d'hôtes", plafond: 1.0 },
    { id: 'e3', label: '3★', plafond: 1.7 },
    { id: 'e4', label: '4★', plafond: 2.6 },
    { id: 'e5', label: '5★', plafond: 3.6 },
    { id: 'palace', label: 'Palace', plafond: 4.9 },
  ],
  plafondMax: 4.9,
  departementale: 0.1,
  idfRegionale: 0.15,
  idfMobilites: 2.0,
}

// Helper format euro pour cohérence
export function fmtEurStatic(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n))
}
