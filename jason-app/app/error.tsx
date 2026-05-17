'use client'

// Erreur top-level pour toutes les routes hors `app/dashboard/*` (qui a son
// propre boundary). Affiche le même composant unifié pour cohérence visuelle.

import DashboardError from '@/components/ui/DashboardError'

export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <DashboardError error={error} reset={reset} />
}
