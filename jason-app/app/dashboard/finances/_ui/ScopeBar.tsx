'use client'

// Choix du logement de « Mes finances » : même réglage que le sélecteur de
// la sidebar (cookie active-property-id), mais reste sur la page.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { House, Buildings } from '@phosphor-icons/react/dist/ssr'

export default function ScopeBar({ choices, activeId }: { choices: Array<{ id: string; nom: string }>; activeId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState(activeId)

  // Un seul logement : son nom est déjà dans le titre du bandeau
  if (choices.length <= 1) return null

  async function pick(id: string) {
    if (id === current) return
    setCurrent(id)
    await fetch('/api/me/active-property', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: id }),
    }).catch(() => {})
    startTransition(() => router.refresh())
  }

  const items = [{ id: 'all', nom: 'Tous les logements' }, ...choices]
  return (
    <div style={{ ...s.bar, opacity: pending ? 0.6 : 1 }} role="tablist" aria-label="Logement affiché">
      {items.map(c => {
        const active = c.id === current
        const Icon = c.id === 'all' ? Buildings : House
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => pick(c.id)}
            style={{ ...s.pill, ...(active ? s.pillActive : {}) }}
          >
            <Icon size={14} weight={active ? 'fill' : 'regular'} />
            {c.nom}
          </button>
        )
      })}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: { display: 'flex', flexWrap: 'wrap', gap: 8, transition: 'opacity 0.15s' },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
    padding: '7px 13px', borderRadius: 999, border: '1px solid var(--border-2)', background: 'var(--surface)',
    color: 'var(--text-2)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  pillActive: { background: 'var(--accent-text)', border: '1px solid var(--accent-text)', color: 'var(--bg)', fontWeight: 600 },
}
