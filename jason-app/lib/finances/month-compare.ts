// Comparaison « ce mois-ci » de l'accueil (02/11/2026, Jason : « c'est forcément
// -100 % quand on commence un nouveau mois »). Avant, le début du mois en cours
// était comparé au mois dernier ENTIER. Maintenant : même période du mois
// dernier (du 1er au même jour), et rien d'affiché les 7 premiers jours, où
// un seul séjour suffit à faire varier l'écart de -100 % à +300 %.

export const MIN_DAY_FOR_COMPARE = 8

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Période du mois dernier à comparer, ou null tant que le mois est trop jeune. */
export function samePeriodLastMonth(today: string): { start: string; end: string; label: string } | null {
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7)), d = Number(today.slice(8, 10))
  if (!y || !m || !d || d < MIN_DAY_FOR_COMPARE) return null
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1
  const last = new Date(Date.UTC(py, pm, 0)).getUTCDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { start: `${py}-${pad(pm)}-01`, end: `${py}-${pad(pm)}-${pad(Math.min(d, last))}`, label: `vs même période en ${MOIS[pm - 1]}` }
}

/** Écart en % arrondi, ou null si rien à comparer. */
export function pctChange(cur: number, prev: number): number | null {
  if (!(prev > 0)) return null
  return Math.round(((cur - prev) / prev) * 100)
}
