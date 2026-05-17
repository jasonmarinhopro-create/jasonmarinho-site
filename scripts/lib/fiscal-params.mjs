// Miroir de jason-app/lib/lcd/fiscal-params.ts pour les scripts Node.
// Si tu modifies une valeur ici, modifie aussi le fichier TS et inversement.
// Lance les générateurs après modification pour propager dans le HTML statique.

export const FISCAL_PARAMS_2026 = {
  microBic: {
    nonClasse: { abattement: 0.30, plafond: 15000, label: 'Meublé non classé' },
    classe:    { abattement: 0.50, plafond: 77700, label: 'Meublé classé Atout France' },
    cdh:       { abattement: 0.50, plafond: 77700, label: "Chambres d'hôtes" },
  },
  versementLiberatoire: {
    plafondRfr1part: 27478,
    plafondRfr2parts: 54956,
    plafondRfr3parts: 82434,
    tauxClasse: 0.01,
    tauxNonClasse: 0.017,
  },
  ir: {
    tranches: [
      { jusqua: 11497,  taux: 0    },
      { jusqua: 29315,  taux: 0.11 },
      { jusqua: 83823,  taux: 0.30 },
      { jusqua: 180294, taux: 0.41 },
      { jusqua: Infinity, taux: 0.45 },
    ],
  },
  societe: {
    is: { tauxReduit: 0.15, seuilTauxReduit: 42500, tauxNormal: 0.25 },
    flatTax: 0.30,
  },
  ei: {
    tauxCotisationsTns: 0.42,
    seuilLmp: 23000,
  },
  meta: {
    annee: 2026,
    versionLoi: 'Loi Le Meur (2025) + LFi 2026',
  },
}

// Barème taxe de séjour 2026, top 8 villes FR (taxe communale, hors dpt 10%)
// Indicatif, vérifier taxesejour.fr pour exhaustivité
export const TAXE_SEJOUR = {
  paris:        { nom: 'Paris',          nc: 5.20, et12: 1.13, et3: 1.95, et45: 5.20, dpt: 0.10, idf: 0.15 },
  cannes:       { nom: 'Cannes',         nc: 5.00, et12: 1.10, et3: 1.90, et45: 4.50, dpt: 0.10, idf: 0 },
  nice:         { nom: 'Nice',           nc: 3.50, et12: 0.83, et3: 1.50, et45: 2.30, dpt: 0.10, idf: 0 },
  lyon:         { nom: 'Lyon',           nc: 3.46, et12: 0.99, et3: 1.65, et45: 2.53, dpt: 0.10, idf: 0 },
  bordeaux:     { nom: 'Bordeaux',       nc: 3.40, et12: 0.83, et3: 1.40, et45: 2.10, dpt: 0.10, idf: 0 },
  marseille:    { nom: 'Marseille',      nc: 3.30, et12: 0.85, et3: 1.45, et45: 2.10, dpt: 0.10, idf: 0 },
  strasbourg:   { nom: 'Strasbourg',     nc: 2.50, et12: 0.78, et3: 1.30, et45: 1.95, dpt: 0.10, idf: 0 },
  honfleur:     { nom: 'Honfleur',       nc: 2.20, et12: 0.65, et3: 1.10, et45: 1.65, dpt: 0.10, idf: 0 },
}

// Helper format euro pour cohérence
export function fmtEurStatic(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n))
}
