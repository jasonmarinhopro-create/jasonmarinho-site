// Plafonds des appels à Google Places API (New) (06/10/2026, Jason : « je ne
// veux pas payer, ne dépasse jamais les options gratuites »). Pur et testé :
// places-budget-rules.test.ts.
//
// Gratuit par mois et par SKU depuis mars 2025 (grille Google Maps Platform,
// relevée en octobre 2026) : Essentials 10 000, Pro 5 000, Enterprise 1 000.
// Le SKU dépend des champs demandés : websiteUri, nationalPhoneNumber,
// rating, regularOpeningHours font passer en Enterprise ; editorialSummary
// en Enterprise + Atmosphere (1 000 aussi). Ajouter un champ à une requête
// peut changer son SKU : revoir ce fichier dans ce cas.
// https://developers.google.com/maps/billing-and-pricing/pricing

export type PlacesSku = 'text_search_enterprise' | 'text_search_ids' | 'place_details_atmosphere'

export const PLACES_BUDGET: Record<PlacesSku, { label: string; free: number; cap: number }> = {
  // Import de contacts (prospection) : nom, site, téléphone, adresse
  text_search_enterprise: { label: 'Recherche Google Maps (import de contacts)', free: 1000, cap: 900 },
  // Audit express : recherche de l'identifiant seul (places.id)
  text_search_ids: { label: 'Recherche de la fiche (audit express)', free: 1000, cap: 900 },
  // Audit express : détails de la fiche (avis, horaires, résumé)
  place_details_atmosphere: { label: 'Détails de la fiche (audit express)', free: 1000, cap: 900 },
}

/**
 * Mois de facturation : heure du Pacifique. Si Google comptait en UTC, notre
 * mois commencerait 8 h plus tard que le sien : jamais d'appel compté sur un
 * mois déjà remis à zéro chez nous mais pas chez Google.
 */
export function placesMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit' }).formatToParts(now)
  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  return `${y}-${m}`
}

export const PLACES_BUDGET_MESSAGE = "Plafond gratuit de Google atteint pour ce mois : la recherche reprendra le 1er du mois prochain (aucun appel payant n'est fait)."
