'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChartLineUp } from '@phosphor-icons/react/dist/ssr'
import type { AcquisitionSnapshot } from '@/lib/acquisition/load'

// Raccourci de la Vue d'ensemble (10/10/2026, demande de Jason) : visiteurs,
// inscriptions, clics sur les liens suivis et Google Search Console,
// aujourd'hui ou sur 7 jours, avec lien vers la page Provenance.

const nf = (n: number) => n.toLocaleString('fr-FR')

export default function AcquisitionCard({ snap }: { snap: AcquisitionSnapshot }) {
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const d = snap[mode]
  const isDay = mode === 'day'
  const evo = (cur: number, prev: number) => {
    if (isDay) return `hier ${nf(prev)}`
    if (!prev) return '7 jours d\'avant : 0'
    const p = Math.round(((cur - prev) / prev) * 100)
    return `${p > 0 ? '+' : ''}${p} % sur 7 jours`
  }

  return (
    <section style={s.card} className="fade-up">
      <header style={s.head}>
        <span style={s.label}><ChartLineUp size={14} /> Provenance des visiteurs</span>
        <div style={s.toggle} role="tablist">
          {(['day', 'week'] as const).map(m => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} style={mode === m ? s.toggleOn : s.toggleBtn}>
              {m === 'day' ? 'Aujourd\'hui' : '7 jours'}
            </button>
          ))}
        </div>
      </header>
      <div style={s.grid}>
        <Tile label="Visiteurs" value={nf(d.visitors)} sub={evo(d.visitors, d.prevVisitors)} />
        <Tile label="Inscriptions" value={nf(d.signups)} sub={evo(d.signups, d.prevSignups)} />
        <Tile label="Clics sur tes liens" value={nf(d.linkClicks)} sub="liens suivis (groupes Facebook…)" />
        <Tile label="Clics depuis Google" value={d.google ? nf(d.google.clicks) : '–'} sub={d.google ? `${nf(d.google.impressions)} affichages, ${d.google.label}` : (snap.gscError ? 'Search Console indisponible' : 'pas encore de chiffres')} />
      </div>
      {d.topChannels.length > 0 && (
        <div style={s.channels}>
          {d.topChannels.map(c => (
            <span key={c.label} style={s.pill}>{c.label} <strong>{nf(c.visitors)}</strong></span>
          ))}
        </div>
      )}
      <Link href="/dashboard/admin/provenance" style={s.link}>
        Voir le détail par canal, tes liens et les inscriptions <ArrowRight size={13} weight="bold" />
      </Link>
    </section>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={s.tile}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 24, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', lineHeight: 1.15 }}>{value}</span>
      <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{sub}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  label: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-2)' },
  toggle: { display: 'inline-flex', padding: 3, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' },
  toggleBtn: { padding: '5px 11px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  toggleOn: { padding: '5px 11px', borderRadius: 8, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8 },
  tile: { display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', minWidth: 0 },
  channels: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  pill: { padding: '4px 10px', borderRadius: 99, background: 'color-mix(in srgb, var(--accent-text) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-text) 20%, transparent)', fontSize: 12.5, color: 'var(--text-2)' },
  link: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
}
