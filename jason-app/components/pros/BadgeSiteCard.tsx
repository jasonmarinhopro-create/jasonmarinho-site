'use client'

// Carte « Un badge pour ton site » de Ma fiche (19/11/2026, audit SEO) : le pro
// colle le badge sur son site, avec un lien vers sa fiche. Pour lui, les hôtes
// qui arrivent sur son site voient qu'il est référencé ; pour sa fiche, c'est
// un lien de plus depuis un site local. Version texte pour Instagram, une fiche
// Google ou une signature d'e-mail.

import { useRef, useState } from 'react'
import { Code, Copy, Check, TextAa } from '@phosphor-icons/react/dist/ssr'
import { badgeHtml, badgeTexte, type BadgeMetier } from '@/lib/pros/badge'

export default function BadgeSiteCard({ metier, ficheUrl, nom }: { metier: BadgeMetier; ficheUrl: string; nom: string }) {
  const [copie, setCopie] = useState<'html' | 'texte' | null>(null)
  const htmlRef = useRef<HTMLTextAreaElement>(null)
  const texteRef = useRef<HTMLTextAreaElement>(null)
  let html = '', texte = ''
  try { html = badgeHtml(metier, ficheUrl, nom); texte = badgeTexte(ficheUrl) } catch { return null }

  async function copier(kind: 'html' | 'texte') {
    const valeur = kind === 'html' ? html : texte
    try {
      await navigator.clipboard.writeText(valeur)
    } catch {
      // Presse-papiers refusé : on sélectionne le texte pour Ctrl+C
      const el = kind === 'html' ? htmlRef.current : texteRef.current
      el?.focus(); el?.select()
    }
    setCopie(kind)
    setTimeout(() => setCopie(null), 2000)
  }

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <h3 style={s.title}><Code size={15} weight="bold" color="var(--accent-text)" /> Un badge pour ton site</h3>
          <p style={s.hint}>
            Colle ce code sur ton site, dans le pied de page ou la page « À propos ». Les hôtes qui te découvrent chez toi voient que tu es référencé, et ce lien aide ta fiche à se faire connaître de Google.
          </p>
        </div>
        <img src={`https://jasonmarinho.com/badge/${metier}.svg`} alt="Aperçu du badge" width={240} height={72} style={{ display: 'block', maxWidth: '100%', height: 'auto', aspectRatio: '240 / 72', flexShrink: 0, borderRadius: 14 }} />
      </div>

      <label htmlFor={`badge-html-${metier}`} style={s.label}>Code pour ton site</label>
      <textarea id={`badge-html-${metier}`} ref={htmlRef} readOnly value={html} rows={3} style={s.code} onFocus={e => e.currentTarget.select()} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" onClick={() => copier('html')} style={s.primaryBtn}>
          {copie === 'html' ? <><Check size={13} weight="bold" /> Code copié</> : <><Copy size={13} weight="bold" /> Copier le code</>}
        </button>
        <button type="button" onClick={() => copier('texte')} style={s.ghostBtn}>
          {copie === 'texte' ? <><Check size={13} weight="bold" /> Texte copié</> : <><TextAa size={13} weight="bold" /> Copier la version texte</>}
        </button>
      </div>
      <textarea ref={texteRef} readOnly value={texte} aria-label="Version texte" tabIndex={-1} style={s.cache} />
      <p style={{ ...s.hint, margin: '10px 0 0' }}>
        Pas de site ? La version texte se colle dans ta bio Instagram, ta fiche Google ou ta signature d&apos;e-mail.
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 18,
  },
  title: {
    display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 6px',
    fontFamily: 'var(--font-fraunces), serif', fontSize: 15, fontWeight: 500, color: 'var(--text)',
  },
  hint: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, margin: 0 },
  label: { display: 'block', margin: '14px 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  code: {
    width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', borderRadius: 9,
    border: '1px solid var(--border-2)', background: 'var(--bg)', color: 'var(--text-2)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.5,
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 600, color: 'var(--bg)', background: 'var(--accent-text)',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', background: 'transparent',
    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
  },
  cache: { position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 },
}
