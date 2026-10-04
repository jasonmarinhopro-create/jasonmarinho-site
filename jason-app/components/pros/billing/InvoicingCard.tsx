'use client'

// Encart « Tes factures » des devis (04/10/2026). Les devis se font dans
// l'app, les factures dans un outil agréé. Si le pro a déjà son outil
// (« J'ai déjà un outil »), on n'affiche plus nos partenaires (Tiime, Indy),
// seulement un rappel de faire la facture là-bas. Liens affiliés :
// rel="sponsored noopener" + mention visible.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Receipt, ArrowSquareOut, Check } from '@phosphor-icons/react/dist/ssr'
import { setInvoicingTool } from '@/lib/pros/billing-actions'
import { TIIME_URL, INDY_URL } from '@/lib/pros/invoicing-partners'
import type { ProKind } from '@/lib/pros/billing'

export default function InvoicingCard({ kind, hasTool, tool, guideHref, accepted = false, onChange }: {
  kind: ProKind
  hasTool: boolean
  tool: string | null
  guideHref: string
  /** Devis accepté : le ton passe à « fais la facture maintenant » */
  accepted?: boolean
  onChange?: (has: boolean) => void
}) {
  const [has, setHas] = useState(hasTool)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  function toggle(next: boolean) {
    setError('')
    const prev = has
    setHas(next)
    start(async () => {
      const r = await setInvoicingTool(kind, next, next ? tool : null)
      if (!r.ok) { setHas(prev); setError(r.error) } else onChange?.(next)
    })
  }

  if (has) {
    return (
      <section style={s.card}>
        <div style={s.title}><Receipt size={17} weight="bold" color="var(--accent-text)" /> {accepted ? 'Prochaine étape : la facture' : 'Tes factures'}</div>
        <p style={s.text}>
          {accepted ? 'Une fois la prestation faite, ' : 'Quand un devis est accepté, '}
          fais la facture dans {tool ? <strong>{tool}</strong> : 'ton outil habituel'} : reprends simplement les lignes et le montant du devis.
        </p>
        <button onClick={() => toggle(false)} disabled={pending} style={s.linkBtn}>Je n&apos;ai plus d&apos;outil de facturation</button>
        {error && <p style={s.err}>{error}</p>}
      </section>
    )
  }

  return (
    <section style={s.card}>
      <div style={s.title}><Receipt size={17} weight="bold" color="var(--accent-text)" /> {accepted ? 'Prochaine étape : la facture' : 'Et pour les factures ?'}</div>
      <p style={s.text}>
        Les devis se font ici. La facture, elle, doit passer par une plateforme agréée dès septembre 2027 : autant prendre la bonne tout de suite. Les deux que je recommande ont une offre gratuite.
      </p>
      <div style={s.partners}>
        <a href={TIIME_URL} target="_blank" rel="sponsored noopener" style={s.partner}>
          <span><strong>Tiime</strong><span style={s.sub}>Devis et factures gratuits</span></span>
          <ArrowSquareOut size={15} weight="bold" />
        </a>
        <a href={INDY_URL} target="_blank" rel="sponsored noopener" style={s.partner}>
          <span><strong>Indy</strong><span style={s.sub}>Factures, suivi et compte pro</span></span>
          <ArrowSquareOut size={15} weight="bold" />
        </a>
      </div>
      <div style={s.legal}>Liens affiliés : l&apos;outil verse une commission à Jason Marinho si tu t&apos;inscris, sans surcoût pour toi.</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => toggle(true)} disabled={pending} style={s.toolBtn}><Check size={14} weight="bold" /> J&apos;ai déjà un outil</button>
        <Link href={guideHref} style={s.guide}>Ce qui change en 2027</Link>
      </div>
      {error && <p style={s.err}>{error}</p>}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 },
  title: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-fraunces), serif', fontSize: 17, color: 'var(--text)' },
  text: { margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 },
  partners: { display: 'flex', flexDirection: 'column', gap: 8 },
  partner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--accent-text)', textDecoration: 'none', fontSize: 14 },
  sub: { display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  legal: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  toolBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  guide: { fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'underline', textUnderlineOffset: 3 },
  linkBtn: { alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' },
  err: { margin: 0, fontSize: 12.5, color: '#B4462F' },
}
