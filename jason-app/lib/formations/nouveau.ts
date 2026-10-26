// Badge « Nouveau » du catalogue (26/10/2026, Jason : « une notion de
// nouveauté, avec une temporalité de 1 mois ou plus, et de mise en avant »).
// Une formation est nouvelle pendant 45 jours après sa mise en ligne
// (formations.created_at, posé par la migration qui la publie).
export const NOUVEAU_JOURS = 45

export function isNouvelleFormation(createdAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!createdAt) return false
  const t = Date.parse(createdAt)
  if (Number.isNaN(t)) return false
  const age = now.getTime() - t
  return age >= 0 && age < NOUVEAU_JOURS * 86_400_000
}

/** Date de mise en ligne de la formation nouvelle la plus récente, sinon null
 *  (point « du neuf » du menu) */
export function derniereNouvelleFormationAt(formations: Array<{ created_at?: string | null }>, now: Date = new Date()): string | null {
  const dates = formations.map(f => f.created_at).filter((d): d is string => isNouvelleFormation(d, now))
  return dates.length ? dates.reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b)) : null
}
