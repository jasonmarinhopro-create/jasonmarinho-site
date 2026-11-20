// Libellé de mois sous une barre de graphique sur 12 mois (20/11/2026, audit
// responsive) : « janv. » sur ordinateur, « J » sur téléphone, où une colonne
// fait une vingtaine de pixels et le libellé court était coupé net.
// Bascule en CSS (.mt-l / .mt-s, globals.css) : rien à recalculer au rendu.
import { monthLabel } from '@/lib/finances/engine'

export default function MonthTick({ ym }: { ym: string }) {
  const court = monthLabel(ym, true)
  return (
    <>
      <span className="mt-l">{court}</span>
      <span className="mt-s" aria-hidden="true">{court.charAt(0).toUpperCase()}</span>
    </>
  )
}
