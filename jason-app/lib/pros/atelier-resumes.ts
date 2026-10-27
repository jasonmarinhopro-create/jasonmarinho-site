// Résumés d'une ligne de l'atelier de Ma fiche (27/10/2026) : chaque partie
// dit ce qu'elle contient sans l'ouvrir (« Paris + 30 km, 4 villes en plus »).

/** « Paris + 30 km, 4 villes en plus » */
export function zoneSummary(ville: string, zone: string, nVilles: number): string {
  const km = /(\d{1,3})\s?km/i.exec(zone)?.[1]
  const head = ville.trim() ? `${ville.trim()}${km ? ` + ${km} km` : ''}` : ''
  const tail = nVilles ? `${nVilles} ville${nVilles > 1 ? 's' : ''} en plus` : ''
  return [head, tail].filter(Boolean).join(', ') || 'À renseigner'
}

/** Prix « dès » : la formule la moins chère, sinon le tarif minimum saisi */
export function prixDes(formules: Array<{ prix: string | number | null }>, tarifMin: number | null): number | null {
  const prices = formules.map(x => Number(String(x.prix ?? '').replace(',', '.'))).filter(n => Number.isFinite(n) && n > 0)
  if (prices.length) return Math.min(...prices)
  return tarifMin && tarifMin > 0 ? tarifMin : null
}
