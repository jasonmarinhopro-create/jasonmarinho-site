'use client'

// Bouton discret pour relancer une visite guidée à la demande.
// Émet un CustomEvent que OnboardingTour écoute, et pose aussi ?tour=1
// dans l'URL pour qu'un share-link fonctionne aussi.

import { useRouter, usePathname } from 'next/navigation'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'

export default function TourTrigger({ label = 'Comment ça marche ?' }: { label?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function start() {
    // 1. Met à jour l'URL (pour shareability) — replace, pas push, pour ne pas polluer l'historique
    router.replace(`${pathname}?tour=1`, { scroll: false })
    // 2. Notifie le OnboardingTour de la même page (le push URL seul ne re-trigger pas le useEffect)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jm-tour-open'))
    }
  }

  return (
    <button
      type="button"
      onClick={start}
      style={s.btn}
      title="Relancer la visite guidée"
      aria-label={label}
    >
      <Sparkle size={12} weight="fill" />
      <span style={s.label}>{label}</span>
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '999px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-3)',
    fontSize: '11.5px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s',
  },
  label: { whiteSpace: 'nowrap' as const },
}
