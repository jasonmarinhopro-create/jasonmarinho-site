'use client'

import { useEffect, useState } from 'react'
import { Star, X } from '@phosphor-icons/react/dist/ssr'

// Demande d'avis Google, une seule fois, dès qu'un contrat a été signé
// (sept. 2026). Avant : lien permanent « Laisser un avis Google » dans le
// menu du compte, que personne ne remarquait. Un moment positif convertit
// mieux qu'un lien perdu. Masquage mémorisé dans le navigateur (simple
// confort : au pire, la carte réapparaît sur un autre appareil).

const KEY = 'jm-review-prompt-v1'

export default function ReviewPrompt() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setVisible(true) } catch { /* stockage indisponible : on n'affiche pas */ }
  }, [])
  if (!visible) return null
  const hide = () => {
    setVisible(false)
    try { localStorage.setItem(KEY, new Date().toISOString()) } catch { /* ignore */ }
  }
  return (
    <section style={s.card} aria-label="Laisser un avis">
      <span style={s.ico}><Star size={18} weight="fill" /></span>
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <strong style={s.title}>L&apos;app t&apos;aide au quotidien ?</strong>
        <span style={s.text}>Si l&apos;app t&apos;a fait gagner du temps, un avis Google aide d&apos;autres hôtes à la trouver. Ça prend une minute.</span>
      </div>
      <a href="https://g.page/r/CcLzE7IbhS5_EAE/review" target="_blank" rel="noopener noreferrer" onClick={hide} style={s.cta}>
        Laisser un avis
      </a>
      <button type="button" onClick={hide} style={s.close} aria-label="Ne plus afficher"><X size={14} weight="bold" /></button>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px', padding: '14px 16px', marginBottom: '20px',
    borderRadius: '14px', background: 'rgba(255,213,107,0.14)', border: '1px solid rgba(255,213,107,0.45)', position: 'relative',
  },
  ico: { width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: 'var(--accent-text)' },
  title: { display: 'block', fontSize: '14px', color: 'var(--text)' },
  text: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  cta: { padding: '9px 14px', borderRadius: '10px', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 700, fontSize: '13px', textDecoration: 'none', flexShrink: 0 },
  close: { background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '6px', display: 'flex' },
}
