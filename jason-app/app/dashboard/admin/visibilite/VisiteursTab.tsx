'use client'

import { useState } from 'react'
import { Users, Compass, GlobeHemisphereWest, DeviceMobile, Files, Info } from '@phosphor-icons/react/dist/ssr'
import { pctChange, formatDuration, type Share } from '@/lib/visibility/rules'
import { fmtInt, shortDate } from '@/lib/visibility/admin-rules'
import type { VisiteursData } from '@/lib/visibility/admin-build'
import { v, PctDelta, ACCENT } from './ui'
import { ChipGroup } from './ListParts'
import TrendChart from './TrendChart'

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function bucketLabel(key: string, g: VisiteursData['granularity']): string {
  if (g === 'day') return shortDate(key)
  if (g === 'week') return `sem. du ${shortDate(key)}`
  return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`
}

export default function VisiteursTab({ d }: { d: VisiteursData }) {
  const s = d.summary
  const [srcMode, setSrcMode] = useState<'canaux' | 'sites'>('canaux')
  const [geoMode, setGeoMode] = useState<'pays' | 'regions' | 'villes'>('pays')
  const partial = s.views > 0 && s.measured < s.views * 0.9
  const geo = geoMode === 'pays' ? s.countries : geoMode === 'regions' ? s.regions : s.cities

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
        <Tile label="Visiteurs" value={fmtInt(s.visitors)} delta={<PctDelta pct={pctChange(s.visitors, d.prevVisitors)} />} sub={`${fmtInt(d.prevVisitors)} sur la période d'avant`} />
        <Tile label="Pages vues" value={fmtInt(s.views)} delta={<PctDelta pct={pctChange(s.views, d.prevViews)} />} sub={s.visitors ? `${(s.views / s.visitors).toFixed(1).replace('.', ',')} par visiteur` : '–'} />
        <Tile label="Temps moyen" value={formatDuration(s.avgSeconds)} sub="par visiteur, toutes pages" />
        <Tile label="Sur téléphone" value={d.mobilePct === null ? '–' : `${d.mobilePct} %`} sub="des visiteurs mesurés" />
      </div>

      {partial && (
        <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: 0, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
          <Info size={15} weight="bold" color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
          Pays, écran et temps passé mesurés depuis le 5 octobre 2026 : {fmtInt(s.measured)} pages vues sur {fmtInt(s.views)} portent ces informations. Les pourcentages ne portent que sur celles-ci.
        </p>
      )}

      <section style={v.card}>
        <header style={v.head}>
          <span style={v.icon}><Users size={18} weight="bold" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={v.title}>Visiteurs par {d.granularity === 'day' ? 'jour' : d.granularity === 'week' ? 'semaine' : 'mois'}</h2>
            <p style={v.sub}>Une session de navigation compte pour un visiteur, le jour de sa visite (heure de Paris)</p>
          </div>
        </header>
        <TrendChart
          points={d.series.map(p => ({ key: p.key, label: bucketLabel(p.key, d.granularity), value: p.visitors, prev: p.prevVisitors }))}
          unit="visiteur" height={200}
        />
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={v.card}>
            <header style={v.head}>
              <span style={v.icon}><Compass size={18} weight="bold" /></span>
              <h2 style={{ ...v.title, flex: 1 }}>Comment ils nous trouvent</h2>
              <ChipGroup label="Vue" value={srcMode} onChange={setSrcMode} options={[{ key: 'canaux', label: 'Canaux' }, { key: 'sites', label: 'Sites' }]} />
            </header>
            <Bars list={srcMode === 'canaux' ? s.sources : s.sites} empty={srcMode === 'sites' ? 'Aucun site ne nous a envoyé de visiteur.' : 'Aucune visite.'} />
          </section>
          <section style={v.card}>
            <header style={v.head}>
              <span style={v.icon}><GlobeHemisphereWest size={18} weight="bold" /></span>
              <h2 style={{ ...v.title, flex: 1 }}>D&apos;où ils viennent</h2>
              <ChipGroup label="Vue" value={geoMode} onChange={setGeoMode} options={[{ key: 'pays', label: 'Pays' }, { key: 'regions', label: 'Régions' }, { key: 'villes', label: 'Villes' }]} />
            </header>
            <Bars list={geo} empty="Pas encore de visite mesurée." />
          </section>
          <section style={v.card}>
            <header style={v.head}>
              <span style={v.icon}><DeviceMobile size={18} weight="bold" /></span>
              <h2 style={{ ...v.title, flex: 1 }}>Sur quel écran</h2>
            </header>
            <Bars list={s.devices} empty="Pas encore de visite mesurée." />
          </section>
        </div>
        <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={v.card}>
            <header style={v.head}>
              <span style={v.icon}><Files size={18} weight="bold" /></span>
              <h2 style={{ ...v.title, flex: 1 }}>Pages les plus vues</h2>
            </header>
            {d.topPages.length === 0 ? <p style={v.empty}>Aucune page vue.</p> : (
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
                {d.topPages.map((p, i) => (
                  <li key={p.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: 22, fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</span>
                    </span>
                    <span style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(p.views)}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{fmtInt(p.visitors)} visiteur{p.visitors > 1 ? 's' : ''}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function Tile({ label, value, delta, sub }: { label: string; value: string; delta?: React.ReactNode; sub: string }) {
  return (
    <div style={{ ...v.card, gap: 6 }}>
      <span style={v.colHead}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 32, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
        {delta}
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</span>
    </div>
  )
}

/** Barres horizontales : libellé, barre proportionnelle, % et nombre */
function Bars({ list, empty, max = 8 }: { list: Share[]; empty: string; max?: number }) {
  if (!list.length) return <p style={v.empty}>{empty}</p>
  const top = list.slice(0, max)
  const rest = list.slice(max)
  const restCount = rest.reduce((n, x) => n + x.count, 0)
  const restPct = rest.reduce((n, x) => n + x.pct, 0)
  const rows = restCount ? [...top, { key: '__autres', label: `Autres (${rest.length})`, count: restCount, pct: restPct }] : top
  const peak = Math.max(1, ...rows.map(r => r.pct))
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
      {rows.map(r => (
        <li key={r.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
            <span style={{ color: 'var(--text-2)', minWidth: 0, overflowWrap: 'anywhere' }}>{r.label}</span>
            <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              <strong style={{ color: 'var(--text)' }}>{r.pct} %</strong>
              <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{fmtInt(r.count)}</span>
            </span>
          </span>
          <span style={{ display: 'block', height: 8, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.max(2, (r.pct / peak) * 100)}%`, borderRadius: 99, background: r.key === '__autres' ? 'color-mix(in srgb, var(--accent-text) 35%, var(--surface))' : ACCENT }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
