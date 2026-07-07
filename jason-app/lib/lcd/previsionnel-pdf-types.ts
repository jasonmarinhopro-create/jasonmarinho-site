// Types + constantes du prévisionnel bancaire, SANS dépendance jsPDF.
// Permet au modal de les importer sans charger jsPDF (~380 KB) tant que
// l'utilisateur ne clique pas sur « générer » — le builder lourd
// (previsionnel-pdf.ts) est importé dynamiquement à ce moment-là.

export interface ChargeAssumptions {
  /** % du CA */
  commissionsPct: number   // plateformes (Airbnb/Booking)
  menagePct: number        // ménage net à charge
  gestionPct: number       // conciergerie / gestion déléguée
  assurancePct: number     // PNO + RC
  energiePct: number       // énergie, eau, internet
  entretienPct: number     // entretien courant + petit équipement
  /** montants fixes annuels (€) */
  comptaEur: number
  taxeFonciereEur: number
  coproEur: number
}

export interface FinancingAssumptions {
  prixAchatEur: number | null
  apportEur: number | null
  /** mensualité de crédit (€/mois) — saisie directe pour éviter d'inventer un taux */
  mensualiteEur: number | null
}

export const DEFAULT_CHARGES: ChargeAssumptions = {
  commissionsPct: 14,
  menagePct: 8,
  gestionPct: 0,
  assurancePct: 2,
  energiePct: 6,
  entretienPct: 4,
  comptaEur: 500,
  taxeFonciereEur: 900,
  coproEur: 0,
}
