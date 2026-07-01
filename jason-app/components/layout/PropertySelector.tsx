'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { House, CaretUp, Check, SquaresFour, Gear, Plus } from '@phosphor-icons/react/dist/ssr'
import type { PropertyLite } from '@/lib/queries/active-property'

interface Props {
  /** Tous les logements de l'utilisateur (peut être vide). */
  allProperties: PropertyLite[]
  /** UUID du logement courant, ou 'all'. */
  currentId: string
  /** Mode sidebar réduite : n'affiche que l'icône (Étape 3). */
  collapsed?: boolean
}

/**
 * Sélecteur de logement en bas de sidebar (pattern Linear/Vercel).
 * - Si l'utilisateur n'a aucun logement : ne s'affiche pas
 * - Si 1 seul : affiché en lecture seule (pas de dropdown)
 * - Si plusieurs : dropdown ouvert vers le HAUT au clic
 *
 * Le choix est persisté côté serveur via POST /api/me/active-property
 * puis on rafraîchit la page pour que toutes les queries se réappliquent.
 */
export default function PropertySelector({ allProperties, currentId, collapsed = false }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Cas "aucun logement" : au lieu de cacher le composant (l'utilisateur
  // n'a alors AUCUN moyen d'ajouter un logement depuis la sidebar), on
  // affiche un CTA "Ajouter mon 1er logement" qui pointe directement vers
  // /dashboard/logements?new=1. Reste discret et utile.
  if (allProperties.length === 0) {
    return (
      <div style={styles.wrap}>
        <Link href="/dashboard/logements?new=1" style={{ ...styles.trigger, cursor: 'pointer', textDecoration: 'none' }} title="Ajouter un logement">
          <span style={styles.ico}><House size={15} weight="duotone" /></span>
          {!collapsed && (
            <span style={styles.info}>
              <span style={styles.lbl}>Logement</span>
              <span style={{ ...styles.name, color: 'var(--accent-text)' }}>+ Ajouter mon 1er logement</span>
            </span>
          )}
        </Link>
      </div>
    )
  }

  const current = allProperties.find(p => p.id === currentId) ?? null
  const isAll = currentId === 'all' || !current
  const label = isAll
    ? (allProperties.length > 1 ? 'Tous les logements' : allProperties[0].nom)
    : current!.nom
  // Toujours interactif : même avec 1 seul logement, l'utilisateur doit
  // pouvoir ouvrir le menu pour accéder à "Ajouter un logement" et
  // "Gérer mes logements". L'option "Tous les logements" n'apparaît que
  // s'il y a plus d'1 logement (rendu conditionnel dans le dropdown).
  const interactive = true
  const hasMultiple = allProperties.length > 1

  async function pick(id: string) {
    if (id === currentId) { setOpen(false); return }
    setBusy(true)
    try {
      await fetch('/api/me/active-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={wrapRef} style={styles.wrap}>
      {open && (
        <div style={styles.dropdown} role="menu">
          {/* Tous les logements (vue agrégée) — visible uniquement si plusieurs */}
          {hasMultiple && (
            <button
              onClick={() => pick('all')}
              style={{ ...styles.item, ...(isAll ? styles.itemCurrent : {}) }}
              role="menuitem"
              disabled={busy}
            >
              <span style={styles.itemIco}>{isAll ? <Check size={13} weight="bold" /> : <SquaresFour size={13} />}</span>
              <span style={styles.itemLabel}>Tous les logements</span>
            </button>
          )}
          {/* Liste des logements */}
          {allProperties.map(p => {
            const active = p.id === currentId
            return (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                style={{ ...styles.item, ...(active ? styles.itemCurrent : {}) }}
                role="menuitem"
                disabled={busy}
              >
                <span style={styles.itemIco}>{active ? <Check size={13} weight="bold" /> : null}</span>
                <span style={styles.itemLabel}>
                  {p.nom}
                  {p.ville && <span style={styles.itemSub}> · {p.ville}</span>}
                </span>
              </button>
            )
          })}
          <div style={styles.divider} />
          <Link href="/dashboard/logements" style={styles.item} onClick={() => setOpen(false)}>
            <span style={styles.itemIco}><Gear size={13} /></span>
            <span style={styles.itemLabel}>Gérer mes logements</span>
          </Link>
          <Link href="/dashboard/logements?new=1" style={{ ...styles.item, color: 'var(--accent-text)' }} onClick={() => setOpen(false)}>
            <span style={{ ...styles.itemIco, color: 'var(--accent-text)' }}><Plus size={13} weight="bold" /></span>
            <span style={styles.itemLabel}>Ajouter un logement</span>
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => interactive && setOpen(v => !v)}
        style={{ ...styles.trigger, cursor: interactive ? 'pointer' : 'default', justifyContent: collapsed ? 'center' : 'flex-start' }}
        aria-haspopup={interactive ? 'menu' : undefined}
        aria-expanded={open}
        title={collapsed ? `Logement : ${label}` : undefined}
      >
        <span style={styles.ico}><House size={15} weight="duotone" /></span>
        {!collapsed && (
          <>
            <span style={styles.info}>
              <span style={styles.lbl}>Logement</span>
              <span style={styles.name}>{label}</span>
            </span>
            {interactive && (
              <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', flexShrink: 0 }}>
                <CaretUp size={13} weight="bold" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
              </span>
            )}
          </>
        )}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'relative', marginTop: '12px', marginBottom: '14px' },
  trigger: {
    display: 'flex', alignItems: 'center', gap: '12px',
    width: '100%', padding: '12px 14px',       // Padding généreux → look bouton
    background: 'rgba(255,213,107,0.05)',       // Fond légèrement accent
    border: '1px solid var(--accent-border)',   // Bordure accent = plus cliquable
    borderRadius: 'var(--r-md)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
  },
  ico: {
    width: '32px', height: '32px', flexShrink: 0,
    background: 'rgba(255,213,107,0.15)',
    border: '1px solid var(--accent-border)',
    borderRadius: '8px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent-text)',
  },
  info: { flex: 1, minWidth: 0, textAlign: 'left' as const, overflow: 'hidden' },
  lbl: { display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: '2px' },
  name: { display: 'block', fontSize: '13.5px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dropdown: {
    position: 'absolute',
    bottom: 'calc(100% + 6px)', left: 0, right: 0,
    background: 'var(--bg-2)',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-md)',
    padding: '4px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
    zIndex: 50,
    maxHeight: '320px',
    overflowY: 'auto',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '7px 10px',
    border: 'none', background: 'none',
    borderRadius: '6px',
    fontSize: '12.5px', fontFamily: 'inherit',
    color: 'var(--text-2)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    textDecoration: 'none',
    transition: 'background 0.12s, color 0.12s',
  },
  itemCurrent: { color: 'var(--accent-text)' },
  itemIco: { width: '16px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemSub: { color: 'var(--text-muted)', fontSize: '11px' },
  divider: { height: '1px', background: 'var(--border)', margin: '4px 6px' },
}
