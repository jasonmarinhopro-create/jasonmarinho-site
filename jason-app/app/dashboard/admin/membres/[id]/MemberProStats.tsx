// Statistiques d'une fiche pro dans la fiche membre de l'admin (05/10/2026) :
// « Audience · 30 derniers jours » et « Sa fiche dans Google · 28 derniers
// jours », avec lien vers la page statistiques du pro (?id=). Composant
// serveur rendu dans un Suspense par la page : Google ne bloque rien.
import Link from 'next/link'
import { Users, Eye, Timer, ChatCircle, MagnifyingGlass, ArrowRight, MapPin, Camera, Broom } from '@phosphor-icons/react/dist/ssr'
import { loadMemberProStats, type MemberProSpace } from '@/lib/admin/member-profile'
import { proStatsPath } from '@/lib/visibility/pro-load'
import { formatDuration, placeLabel } from '@/lib/visibility/rules'
import { mainSearch, sortByImpressions, type ProStatsData } from '@/lib/visibility/pro-stats'
import { AMBER_DARK, BarList, PctPill, PlacePill, nf } from '@/components/pros/stats/ui'

export default async function MemberProStats({ pro }: { pro: MemberProSpace }) {
  let data: ProStatsData | null = null
  let error: string | null = null
  try {
    data = await loadMemberProStats(pro)
  } catch (e) {
    error = String((e as Error)?.message ?? e).slice(0, 200)
  }
  return <MemberProStatsCards pro={pro} data={data} error={error} />
}

export function MemberProStatsCards({ pro, data, error }: { pro: Pick<MemberProSpace, 'kind' | 'id' | 'full_name' | 'pseudo'>; data: ProStatsData | null; error?: string | null }) {
  const photo = pro.kind === 'photographe'
  const statsHref = `${proStatsPath(pro.kind)}?id=${pro.id}`
  const name = data?.fiche.name ?? pro.pseudo ?? pro.full_name ?? 'Fiche'
  if (!data) {
    return (
      <div style={s.card}>
        <div style={s.title}>Statistiques de {name}</div>
        <p style={{ fontSize: 13, color: AMBER_DARK, margin: 0 }}>{error ? `Lecture impossible : ${error}` : 'Fiche introuvable.'}</p>
      </div>
    )
  }
  const m = data.metrics
  const places = data.visits.cities.length ? data.visits.cities : data.visits.countries
  const g = data.google
  const sorted = sortByImpressions(g.queries)
  const main = mainSearch(g.queries)
  const series = m.visitors.series ?? []

  return (
    <div style={s.row}>
      <section style={s.card}>
        <div style={s.head}>
          <span style={s.icon}>{photo ? <Camera size={16} weight="duotone" /> : <Broom size={16} weight="duotone" />}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={s.title}>Audience · 30 derniers jours</div>
            <div style={s.sub}>{name}</div>
          </div>
        </div>
        <div style={s.cells}>
          {[
            { label: 'Visiteurs', Icon: Users, v: m.visitors.value === null ? '–' : nf(m.visitors.value), pct: m.visitors.pct },
            { label: 'Vues', Icon: Eye, v: m.views.value === null ? '–' : nf(m.views.value), pct: m.views.pct },
            { label: 'Temps moyen', Icon: Timer, v: formatDuration(m.time.value), pct: m.time.pct },
            { label: 'Demandes', Icon: ChatCircle, v: m.demandes.value === null ? '–' : nf(m.demandes.value), pct: m.demandes.pct },
          ].map(c => (
            <div key={c.label} style={s.cell}>
              <span style={s.cellLabel}><c.Icon size={13} weight="duotone" color="var(--accent-text)" /> {c.label}</span>
              <span style={s.value}>{c.v}</span>
              <PctPill pct={c.pct} size="sm" />
            </div>
          ))}
        </div>
        {series.length > 1 && <Spark values={series.map(p => p.cur)} />}
        <div style={s.subTitle}><MapPin size={13} weight="duotone" color="var(--accent-text)" /> D&apos;où ils viennent</div>
        <BarList rows={places} limit={6} empty={data.visits.detailsSince ? 'Lieux mesurés depuis le 5 octobre 2026 : rien encore sur la période.' : 'Pas encore de visite sur la période.'} />
        {data.visits.adminError && <p style={s.err}>Visites : {data.visits.adminError}</p>}
        <Link href={statsHref} style={s.link}>Statistiques complètes <ArrowRight size={13} weight="bold" /></Link>
      </section>

      <section style={s.card}>
        <div style={s.head}>
          <span style={s.icon}><MagnifyingGlass size={16} weight="duotone" /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={s.title}>Sa fiche dans Google · 28 derniers jours</div>
            <div style={s.sub}>{name}</div>
          </div>
        </div>
        {g.status === 'error' ? (
          <p style={s.err}>Google : {g.adminError ?? 'indisponible'}</p>
        ) : g.status === 'empty' ? (
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>Google n&apos;a pas encore montré cette fiche sur la période.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px', fontSize: 13.5, color: 'var(--text-2)' }}>
              <span><strong style={s.strong}>{nf(g.clicks)}</strong> clic{g.clicks > 1 ? 's' : ''}</span>
              <span><strong style={s.strong}>{nf(g.impressions)}</strong> affichages</span>
              <span><strong style={s.strong}>{nf(g.queries.length)}</strong> recherche{g.queries.length > 1 ? 's' : ''}</span>
              <PctPill pct={g.pct} size="sm" />
            </div>
            {main && (
              <div style={s.main}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sa recherche principale</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                  <PlacePill position={main.position} /> {main.query}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{placeLabel(main.position)} en moyenne, {nf(main.impressions)} affichages</span>
              </div>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sorted.slice(0, 5).map(q => (
                <li key={q.query} style={s.qRow}>
                  <PlacePill position={q.position} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: 'var(--text)', overflowWrap: 'anywhere' }}>{q.query}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{nf(q.impressions)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Link href={statsHref} style={s.link}>{g.status === 'ok' && g.queries.length > 5 ? `Voir ses ${g.queries.length} recherches` : 'Voir ses statistiques'} <ArrowRight size={13} weight="bold" /></Link>
      </section>
    </div>
  )
}

/** Mini-courbe des visiteurs (sans axe) */
function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${(36 - (v / max) * 32).toFixed(2)}`).join(' ')
  return (
    <svg viewBox="0 0 100 38" preserveAspectRatio="none" width="100%" height={46} role="img" aria-label="Visiteurs par jour sur 30 jours">
      <polygon points={`0,38 ${pts} 100,38`} fill="var(--accent-bg)" />
      <polyline points={pts} fill="none" stroke="var(--accent-text)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

export function MemberProStatsSkeleton() {
  const bar: React.CSSProperties = { background: 'var(--surface-2)', borderRadius: 8 }
  return (
    <div style={s.row} aria-busy="true">
      {[1, 2].map(i => (
        <div key={i} style={{ ...s.card, gap: 12 }}>
          <div style={{ ...bar, width: 220, height: 16 }} />
          <div style={{ ...bar, width: '100%', height: 60 }} />
          <div style={{ ...bar, width: '70%', height: 10 }} />
          <div style={{ ...bar, width: '50%', height: 10 }} />
        </div>
      ))}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 12, alignItems: 'start' },
  card: { display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 16.5, color: 'var(--text)', lineHeight: 1.25 },
  sub: { fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cells: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 },
  cell: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: 10, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  cellLabel: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-3)' },
  value: { fontFamily: 'var(--font-fraunces), serif', fontSize: 21, color: 'var(--text)', lineHeight: 1.1 },
  subTitle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.4 },
  strong: { color: 'var(--text)', fontWeight: 700 },
  main: { display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  qRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' },
  link: { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  err: { fontSize: 12.5, color: AMBER_DARK, margin: 0, lineHeight: 1.5 },
}
