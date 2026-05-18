'use client'

// Bouton discret pour relancer une visite guidée à la demande.
// Pose juste `?tour=1` dans l'URL — c'est OnboardingTour qui détecte ce param
// et démarre la visite (déjà géré dans le composant).
//
// Pourquoi un bouton plutôt qu'auto-launch ? Le tour s'auto-déclenche une
// seule fois (premier visit, mémorisé en localStorage). Après ça, c'est à
// l'utilisateur de demander à le revoir. Ce bouton lui donne la porte d'entrée.

import { useRouter, usePathname } from 'next/navigation'
import { Sparkle } from '@phosphor-icons/react/dist/ssr'

export default function TourTrigger({ label = 'Comment ça marche ?' }: { label?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function start() {
    // Ajoute ?tour=1 à l'URL et reload soft — OnboardingTour réagit au param.
    router.push(`${pathname}?tour=1`)
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
