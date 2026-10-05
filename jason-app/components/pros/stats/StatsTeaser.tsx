// Carte compacte « Tes statistiques » de Ma fiche (05/10/2026) : visiteurs,
// vu sur Google et demandes des 30 derniers jours, lien vers la page
// complète. Chargée à part (Suspense) : Google ne retarde pas Ma fiche.
import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PresentationChart, ArrowRight, Users, MagnifyingGlass, ChatCircle } from '@phosphor-icons/react/dist/ssr'
import { parisToday } from '@/lib/stripe/deposit-window'
import { loadProStats, proStatsPath, type ProFicheRow } from '@/lib/visibility/pro-load'
import type { ProMetier, ProStatsData } from '@/lib/visibility/pro-stats'
import { PctPill, nf } from './ui'

export async function ProStatsTeaser({ metier, fiche, db, isAdminPreview }: {
  metier: ProMetier; fiche: ProFicheRow; db: SupabaseClient; isAdminPreview: boolean
}) {
  let data: ProStatsData | null = null
  try {
    data = await loadProStats({ metier, fiche, db, periodKey: '28j', today: parisToday(), isAdminPreview, isAdmin: isAdminPreview, googleTimeoutMs: 5_000, skipReport: true })
  } catch { data = null }
  const href = `${proStatsPath(metier)}${isAdminPreview ? `?id=${fiche.id}` : ''}`
  return <StatsTeaserCard data={data} href={href} />
}

export function StatsTeaserCard({ data, href }: { data: ProStatsData | null; href: string }) {
  const items = data ? [
    { label: 'Visiteurs', Icon: Users, value: data.metrics.visitors.value, pct: data.metrics.visitors.pct },
    { label: 'Vu sur Google', Icon: MagnifyingGlass, value: data.metrics.google.value, pct: data.metrics.google.pct },
    { label: 'Demandes', Icon: ChatCircle, value: data.metrics.demandes.value, pct: data.metrics.demandes.pct },
  ] : []
  return (
    <div style={s.card}>
      <div style={s.head}>
        <span style={s.icon}><PresentationChart size={17} weight="duotone" /></span>
        <div style={{ minWidth: 0 }}>
          <div style={s.title}>Tes statistiques</div>
          <div style={s.sub}>30 derniers jours</div>
        </div>
      </div>
      {data ? (
        <div style={s.grid}>
          {items.map(it => (
            <div key={it.label} style={s.cell}>
              <span style={s.cellLabel}><it.Icon size={13} weight="duotone" color="var(--accent-text)" /> {it.label}</span>
              <span style={s.value}>{it.value === null ? '–' : nf(it.value)}</span>
              <PctPill pct={it.pct} size="sm" />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>Qui voit ta fiche, d&apos;où, et ce que Google en montre.</p>
      )}
      <Link href={href} style={s.link}>Voir mes statistiques <ArrowRight size={14} weight="bold" /></Link>
    </div>
  )
}

export function StatsTeaserSkeleton() {
  const bar: React.CSSProperties = { background: 'var(--surface-2)', borderRadius: 8 }
  return (
    <div style={s.card} aria-busy="true">
      <div style={{ ...bar, width: 160, height: 18 }} />
      <div style={s.grid}>{[1, 2, 3].map(i => <div key={i} style={{ ...bar, height: 62, borderRadius: 12 }} />)}</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 },
  head: { display: 'flex', alignItems: 'center', gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)', lineHeight: 1.2 },
  sub: { fontSize: 12, color: 'var(--text-3)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  cell: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '10px 10px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 0 },
  cellLabel: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.25 },
  value: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' },
  link: { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontSize: 13.5, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
}
