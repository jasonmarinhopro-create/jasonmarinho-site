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
  tva: {
    seuilFranchise: 37500,
    seuilTolerance: 41250,
    tauxLcdHotelier: 0.10,
    seuilReformePropose: 25000,
    label: 'Franchise en base BIC services',
  },
  meta: {
    annee: 2026,
    versionLoi: 'Loi Le Meur (2025) + LFi 2026',
  },
}

// Barème taxe de séjour 2026, top 30 villes FR (taxe communale, hors dpt +10%)
// Indicatif, vérifier taxesejour.fr pour exhaustivité.
// Données alignées sur SimulateursUI.tsx (dashboard).
export const TAXE_SEJOUR = {
  paris:        { nom: 'Paris',          nc: 5.20, et12: 1.13, et3: 1.95, et45: 5.20, dpt: 0.10, idf: 0.15 },
  cannes:       { nom: 'Cannes',         nc: 5.00, et12: 1.10, et3: 1.90, et45: 4.50, dpt: 0.10, idf: 0 },
  nice:         { nom: 'Nice',           nc: 3.50, et12: 0.83, et3: 1.50, et45: 2.30, dpt: 0.10, idf: 0 },
  lyon:         { nom: 'Lyon',           nc: 3.46, et12: 0.99, et3: 1.65, et45: 2.53, dpt: 0.10, idf: 0 },
  bordeaux:     { nom: 'Bordeaux',       nc: 3.40, et12: 0.83, et3: 1.40, et45: 2.10, dpt: 0.10, idf: 0 },
  annecy:       { nom: 'Annecy',         nc: 3.30, et12: 0.85, et3: 1.45, et45: 2.10, dpt: 0.10, idf: 0 },
  biarritz:     { nom: 'Biarritz',       nc: 3.20, et12: 0.85, et3: 1.40, et45: 2.10, dpt: 0.10, idf: 0 },
  aix:          { nom: 'Aix-en-Provence',nc: 3.00, et12: 0.85, et3: 1.45, et45: 2.10, dpt: 0.10, idf: 0 },
  chamonix:     { nom: 'Chamonix',       nc: 2.90, et12: 0.78, et3: 1.30, et45: 2.05, dpt: 0.10, idf: 0 },
  strasbourg:   { nom: 'Strasbourg',     nc: 2.80, et12: 0.78, et3: 1.30, et45: 1.90, dpt: 0.10, idf: 0 },
  avignon:      { nom: 'Avignon',        nc: 2.65, et12: 0.75, et3: 1.30, et45: 1.95, dpt: 0.10, idf: 0 },
  marseille:    { nom: 'Marseille',      nc: 2.42, et12: 0.83, et3: 1.40, et45: 2.10, dpt: 0.10, idf: 0 },
  montpellier:  { nom: 'Montpellier',    nc: 2.30, et12: 0.75, et3: 1.20, et45: 1.80, dpt: 0.10, idf: 0 },
  nantes:       { nom: 'Nantes',         nc: 2.20, et12: 0.70, et3: 1.15, et45: 1.75, dpt: 0.10, idf: 0 },
  toulon:       { nom: 'Toulon',         nc: 2.20, et12: 0.70, et3: 1.20, et45: 1.80, dpt: 0.10, idf: 0 },
  larochelle:   { nom: 'La Rochelle',    nc: 2.20, et12: 0.70, et3: 1.20, et45: 1.80, dpt: 0.10, idf: 0 },
  stmalo:       { nom: 'Saint-Malo',     nc: 2.15, et12: 0.70, et3: 1.15, et45: 1.75, dpt: 0.10, idf: 0 },
  toulouse:     { nom: 'Toulouse',       nc: 2.13, et12: 0.70, et3: 1.20, et45: 1.80, dpt: 0.10, idf: 0 },
  reims:        { nom: 'Reims',          nc: 2.10, et12: 0.65, et3: 1.10, et45: 1.65, dpt: 0.10, idf: 0 },
  lille:        { nom: 'Lille',          nc: 2.00, et12: 0.65, et3: 1.10, et45: 1.65, dpt: 0.10, idf: 0 },
  rouen:        { nom: 'Rouen',          nc: 1.95, et12: 0.65, et3: 1.10, et45: 1.65, dpt: 0.10, idf: 0 },
  tours:        { nom: 'Tours',          nc: 1.95, et12: 0.65, et3: 1.10, et45: 1.65, dpt: 0.10, idf: 0 },
  nimes:        { nom: 'Nîmes',          nc: 1.95, et12: 0.65, et3: 1.10, et45: 1.65, dpt: 0.10, idf: 0 },
  caen:         { nom: 'Caen',           nc: 1.85, et12: 0.60, et3: 1.05, et45: 1.55, dpt: 0.10, idf: 0 },
  dijon:        { nom: 'Dijon',          nc: 1.85, et12: 0.60, et3: 1.05, et45: 1.55, dpt: 0.10, idf: 0 },
  grenoble:     { nom: 'Grenoble',       nc: 1.85, et12: 0.60, et3: 1.05, et45: 1.55, dpt: 0.10, idf: 0 },
  metz:         { nom: 'Metz',           nc: 1.80, et12: 0.60, et3: 1.05, et45: 1.55, dpt: 0.10, idf: 0 },
  lehavre:      { nom: 'Le Havre',       nc: 1.75, et12: 0.55, et3: 1.00, et45: 1.50, dpt: 0.10, idf: 0 },
  brest:        { nom: 'Brest',          nc: 1.65, et12: 0.55, et3: 1.00, et45: 1.50, dpt: 0.10, idf: 0 },
  perpignan:    { nom: 'Perpignan',      nc: 1.50, et12: 0.55, et3: 0.95, et45: 1.40, dpt: 0.10, idf: 0 },
}

// Helper format euro pour cohérence
export function fmtEurStatic(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n))
}
