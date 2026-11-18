'use client'

// Cockpit de la Vue d'ensemble admin (16/11/2026, Jason : « revoir la totalité
// de la page pour en faire un vrai cockpit », maquette A retenue) :
// - LivePanel : le panneau « En ce moment » de la page Provenance (pages vues
//   là, sources du jour, la journée), rafraîchi toutes les 5 minutes ;
// - AudienceCard : visiteurs, inscriptions, clients, Google (aujourd'hui,
//   7 jours, 30 jours) + courbe jour par jour + sources + pages lues ;
// - MembersCard : membres filtrables par espace avec courbe sur 12 mois ;
// - Shortcuts : chaque page admin, avec son chiffre clé.
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChartLineUp, UsersThree } from '@phosphor-icons/react/dist/ssr'
import type { TodayData } from '@/lib/acquisition/traffic'
import type { AudiencePeriod, AudienceSide } from '@/lib/acquisition/audience'
import type { MemberSpace, SpaceSummary } from '@/lib/admin/members-cockpit'

const AMBER = '#B7791F'
const PINK = '#B83A7C'
const BROWN = '#6E5446'
const RUST = '#A4502A'
const GOLD = '#D6A628'
const nf = (n: number) => n.toLocaleString('fr-FR')
const plural = (n: number, one: string, many = `${one}s`) => `${nf(n)} ${n > 1 ? many : one}`
const tint = (c: string, p = 12) => `color-mix(in srgb, ${c} ${p}%, transparent)`

const CHANNEL_COLOR: Record<string, string> = {
  google: 'var(--accent-text)', direct: 'color-mix(in srgb, var(--accent-text) 55%, #9FB8AE)', facebook: GOLD,
  instagram: PINK, email: BROWN, liens: AMBER, ia: RUST, autres: 'color-mix(in srgb, var(--text-3) 60%, transparent)',
}

// ── En ce moment ──────────────────────────────────────────────────────────

export function LivePanel({ today: t }: { today: TodayData }) {
  const router = useRouter()
  const [updated, setUpdated] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  // Plus de rafraîchissement automatique toutes les 5 minutes (18/11/2026) :
  // il recalculait toute la Vue d'ensemble (une dizaine de lectures) sur une
  // base gratuite déjà saturée, même sans personne devant l'écran. Bouton
  // « Actualiser » à la place.
  useEffect(() => {
    setUpdated(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }))
    setRefreshing(false)
  }, [t])

  return (
    <section className="fade-up" style={{ ...c.card, padding: 0 }}>
      <header style={c.liveHead}>
        <span style={{ ...c.dot, background: t.liveNow ? '#22A06B' : 'var(--text-3)', animation: t.liveNow ? 'pulse 2s ease-in-out infinite' : undefined }} />
        <strong style={{ fontSize: 15, color: 'var(--text)' }}>En ce moment sur jasonmarinho.com : {plural(t.liveNow, 'personne')}</strong>
        <span style={c.muted}>· {nf(t.last30)} sur les 30 dernières minutes</span>
        <span style={{ ...c.muted, marginLeft: 'auto', fontSize: 12 }}>{updated ? `mis à jour à ${updated}` : ''}</span>
        <button
          type="button"
          onClick={() => { setRefreshing(true); router.refresh() }}
          disabled={refreshing}
          style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: refreshing ? 'default' : 'pointer' }}
        >
          {refreshing ? 'Actualisation…' : 'Actualiser'}
        </button>
      </header>
      <div className="ck-cols3" style={c.cols3}>
        <div className="ck-col" style={c.col}>
          <span style={c.colTitle}>Sur quelles pages, là</span>
          {t.livePages.length ? <Ranked items={t.livePages} /> : <span style={c.muted}>Personne pour l&apos;instant.</span>}
        </div>
        <div className="ck-col" style={c.col}>
          <span style={c.colTitle}>D&apos;où ils viennent {t.sourcesDay === 'today' ? 'aujourd’hui' : 'hier'}</span>
          {t.sourcesDay === 'yesterday' && <span style={c.muted}>Pas encore de visite aujourd&apos;hui. Hier :</span>}
          {t.sources.length ? <Ranked items={t.sources} /> : <span style={c.muted}>Rien à afficher.</span>}
        </div>
        <div className="ck-col" style={c.col}>
          <span style={c.colTitle}>La journée</span>
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}><strong style={c.bigInline}>{nf(t.visitorsToday)}</strong> {t.visitorsToday > 1 ? 'visiteurs' : 'visiteur'} · {plural(t.viewsToday, 'page vue', 'pages vues')}</span>
          <span style={c.muted}>Hier, journée entière : <strong>{nf(t.visitorsYesterday)}</strong> visiteurs. La journée n&apos;est pas finie : c&apos;est un repère, pas une comparaison.</span>
          <span style={c.muted}>Inscriptions : <strong>{t.signupsToday}</strong> aujourd&apos;hui, {t.signupsYesterday} hier.</span>
        </div>
      </div>
    </section>
  )
}

function Ranked({ items }: { items: Array<{ name: string; count: number }> }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map(i => (
        <li key={i.name} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--text)' }}>
          <strong style={{ minWidth: 22, textAlign: 'right' }}>{i.count}</strong>
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{i.name}</span>
        </li>
      ))}
    </ol>
  )
}

// ── Audience ──────────────────────────────────────────────────────────────

const PERIODS: Array<[AudiencePeriod, string, string]> = [['day', 'Aujourd’hui', 'vs hier'], ['week', '7 jours', 'vs 7 j d’avant'], ['month', '30 jours', 'vs 30 j d’avant']]

function Evo({ cur, prev, vs }: { cur: number; prev: number; vs: string }) {
  if (!prev && !cur) return <span style={c.evo}>{vs.replace('vs', 'comme')} : 0</span>
  if (!prev) return <span style={{ ...c.evo, color: 'var(--accent-text)' }}>nouveau {vs}</span>
  const p = Math.round(((cur - prev) / prev) * 100)
  if (p === 0) return <span style={c.evo}>stable {vs}</span>
  const up = p >= 0
  return <span style={{ ...c.evo, color: up ? 'var(--accent-text)' : 'var(--danger-text)' }}>{up ? '+' : '−'}{Math.abs(p)} % {vs}</span>
}

export function AudienceCard({ audience, gscError }: { audience: Record<AudiencePeriod, AudienceSide>; gscError: string | null }) {
  const [period, setPeriod] = useState<AudiencePeriod>('week')
  const d = audience[period]
  const vs = PERIODS.find(p => p[0] === period)![2]
  const rate = (a: number, b: number) => (b ? `${(Math.round((a / b) * 1000) / 10).toString().replace('.', ',')} %` : '–')
  const totalSources = d.sources.reduce((n, s) => n + s.count, 0) || 1
  const maxPage = Math.max(1, ...d.pages.map(p => p.views))
  const gDates = d.google ? `${dayShort(d.google.from)}${d.google.from !== d.google.to ? ` au ${dayShort(d.google.to)}` : ''}` : ''

  return (
    <section className="fade-up" style={c.card}>
      <header style={c.head}>
        <span style={c.label}><ChartLineUp size={14} /> Audience du site</span>
        <div style={c.seg} role="tablist" aria-label="Période">
          {PERIODS.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={period === k} onClick={() => setPeriod(k)} style={period === k ? c.segOn : c.segBtn}>{l}</button>
          ))}
        </div>
      </header>

      <div className="ck-funnel" style={c.funnel}>
        <Step label="Visiteurs" value={nf(d.visitors)} evo={<Evo cur={d.visitors} prev={d.prevVisitors} vs={vs} />} />
        <Step label="Inscriptions" value={nf(d.signups)} evo={<Evo cur={d.signups} prev={d.prevSignups} vs={vs} />} note={`${rate(d.signups, d.visitors)} des visiteurs`} arrow />
        <Step label="Devenus clients" value={nf(d.clients)} evo={<Evo cur={d.clients} prev={d.prevClients} vs={vs} />} note={`${rate(d.clients, d.signups)} des inscrits`} arrow />
        <Step label="Clics depuis Google" value={d.google ? nf(d.google.clicks) : '–'} evo={d.google ? <Evo cur={d.google.clicks} prev={d.google.prevClicks} vs={vs} /> : null}
          note={d.google ? `${nf(d.google.impressions)} affichages, ${gDates}` : (gscError ? 'Search Console indisponible' : 'pas encore de chiffres')} soft />
      </div>

      <Chart series={d.series} />

      <div className="ck-two" style={c.two}>
        <div>
          <div style={{ ...c.label, marginBottom: 8 }}>D&apos;où ils viennent</div>
          {d.sources.length === 0 ? <span style={c.muted}>Pas encore de visite sur cette période.</span> : d.sources.map(s => (
            <div key={s.key} style={c.srcRow}>
              <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{s.label}</span>
              <span style={c.bar}><i style={{ ...c.barFill, width: `${(s.count / totalSources) * 100}%`, background: CHANNEL_COLOR[s.key] ?? 'var(--text-3)' }} /></span>
              <strong style={c.num}>{nf(s.count)}</strong>
            </div>
          ))}
        </div>
        <div>
          <div style={{ ...c.label, marginBottom: 4 }}>Ce qu&apos;ils lisent</div>
          {d.pages.length === 0 ? <span style={c.muted}>Pas encore de page vue sur cette période.</span> : d.pages.map((p, i) => (
            <a key={p.path} href={`https://jasonmarinho.com${p.path}`} target="_blank" rel="noopener noreferrer" style={c.pageRow}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                <span style={{ display: 'block', height: 4, borderRadius: 4, marginTop: 5, background: tint('var(--accent-text)', 30), width: `${Math.max(6, (p.views / maxPage) * 100)}%` }} />
              </span>
              <strong style={c.num}>{nf(p.views)}</strong>
            </a>
          ))}
        </div>
      </div>

      <Link href="/dashboard/admin/provenance" style={c.more}>Voir le détail par canal, tes liens et les inscriptions <ArrowRight size={13} weight="bold" /></Link>
    </section>
  )
}

function Step({ label, value, evo, note, arrow, soft }: { label: string; value: string; evo: React.ReactNode; note?: string; arrow?: boolean; soft?: boolean }) {
  return (
    <div className={arrow ? 'ck-step ck-arrow' : 'ck-step'} style={{ ...c.step, ...(soft ? { background: 'var(--bg-2, rgba(0,76,63,0.03))' } : {}) }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <strong style={c.stepVal}>{value}</strong>
      {evo}
      {note && <span style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{note}</span>}
    </div>
  )
}

const dayShort = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function Chart({ series }: { series: AudienceSide['series'] }) {
  const W = 1000, H = 170, n = series.length
  const max = Math.max(4, ...series.map(s => Math.max(s.visitors, s.prev))) * 1.15
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2)
  const y = (v: number) => H - (v / max) * (H - 8)
  const line = (k: 'visitors' | 'prev') => series.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(s[k]).toFixed(1)}`).join(' ')
  const [hover, setHover] = useState<number | null>(null)
  const h = hover != null ? series[hover] : null
  const step = n > 14 ? 5 : 2
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
          {h ? <>{dayShort(h.date)} : <strong style={{ color: 'var(--text)' }}>{plural(h.visitors, 'visiteur')}</strong>{h.signups ? ` · ${plural(h.signups, 'inscription')}` : ''} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({n} jours avant : {h.prev})</span></> : `Visiteurs par jour, ${n} jours`}
        </span>
        <span style={c.legend}>
          <span><i style={{ ...c.legDot, background: 'var(--accent-text)' }} />Visiteurs</span>
          <span><i style={{ ...c.legDot, background: '#FFD56B', borderRadius: 99, border: '1px solid #003329' }} />Inscriptions</span>
          <span><i style={{ ...c.legDot, background: tint('var(--accent-text)', 35) }} />{n} jours d&apos;avant</span>
        </span>
      </div>
      <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 170, display: 'block', overflow: 'visible' }} aria-hidden="true">
          <defs>
            <linearGradient id="ck-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent-text)" stopOpacity="0.2" />
              <stop offset="1" stopColor="var(--accent-text)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--border)" vectorEffect="non-scaling-stroke" />)}
          <path d={line('prev')} fill="none" stroke={tint('var(--accent-text)', 40)} strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
          <path d={`${line('visitors')} L${W} ${H} L0 ${H} Z`} fill="url(#ck-area)" />
          <path d={line('visitors')} fill="none" stroke="var(--accent-text)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="var(--border)" vectorEffect="non-scaling-stroke" />}
        </svg>
        {/* Points en HTML : ronds quelle que soit la largeur */}
        {series.map((s, i) => s.signups > 0 && (
          <span key={s.date} title={plural(s.signups, 'inscription')} style={{ position: 'absolute', left: `${(x(i) / W) * 100}%`, top: y(s.visitors), width: 9 + Math.min(6, s.signups * 2), height: 9 + Math.min(6, s.signups * 2), transform: 'translate(-50%, -50%)', borderRadius: 99, background: '#FFD56B', border: '1.5px solid #003329', pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {series.map((s, i) => <span key={s.date} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />)}
        </div>
      </div>
      {/* Dates : une sur {step}, placées sous leur point (la dernière alignée à droite) */}
      <div style={{ position: 'relative', height: 16, fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
        {series.map((s, i) => (n - 1 - i) % step === 0 && (
          <span key={s.date} className={(n - 1 - i) % (step * 2) === 0 ? undefined : 'ck-xminor'} style={{ position: 'absolute', left: `${(x(i) / W) * 100}%`, transform: i === n - 1 ? 'translateX(-100%)' : i === 0 ? 'none' : 'translateX(-50%)', whiteSpace: 'nowrap' }}>{dayShort(s.date)}</span>
        ))}
      </div>
    </div>
  )
}

// ── Membres par espace ────────────────────────────────────────────────────

const SPACES: Array<{ key: MemberSpace; label: string; color: string; href: string; cta: string }> = [
  { key: 'tous', label: 'Tous', color: 'var(--accent-text)', href: '/dashboard/admin/membres', cta: 'Tous les membres' },
  { key: 'hote', label: 'Hôtes', color: 'var(--accent-text)', href: '/dashboard/admin/membres', cta: 'Tous les membres' },
  { key: 'investisseur', label: 'Investisseurs', color: AMBER, href: '/dashboard/admin/investisseurs', cta: 'Page Investisseurs' },
  { key: 'photographe', label: 'Photographes', color: PINK, href: '/dashboard/admin/photographes', cta: 'Page Photo & vidéo' },
  { key: 'menage', label: 'Ménage', color: BROWN, href: '/dashboard/admin/menage', cta: 'Page Équipes de ménage' },
  { key: 'depannage', label: 'Dépannage', color: RUST, href: '/dashboard/admin/depannage', cta: 'Page Dépannage' },
]
const PRO_LABEL = { photographe: 'Photographe', menage: 'Ménage', depannage: 'Dépannage' } as const
const PLAN_LABEL: Record<string, string> = { standard: 'Standard', driing: 'Driing', decouverte: 'Découverte' }

export function MembersCard({ spaces }: { spaces: Record<MemberSpace, SpaceSummary> }) {
  const [space, setSpace] = useState<MemberSpace>('tous')
  const cfg = SPACES.find(s => s.key === space)!
  const d = spaces[space]
  const splitTotal = d.split.reduce((n, s) => n + s.count, 0) || 1
  const growthPath = useMemo(() => {
    const W = 400, H = 90, max = Math.max(1, ...d.growth.map(g => g.total))
    return d.growth.map((g, i) => `${i ? 'L' : 'M'}${((i / (d.growth.length - 1)) * W).toFixed(1)} ${(H - (g.total / max) * (H - 6)).toFixed(1)}`).join(' ')
  }, [d])
  const yearAgo = d.growth[0]?.total ?? 0
  const monthFr = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }).replace('.', '')

  return (
    <section className="fade-up" style={c.card}>
      <header style={c.head}>
        <span style={c.label}><UsersThree size={14} /> Membres</span>
        <Link href={cfg.href} style={c.headLink}>{cfg.cta} <ArrowRight size={12} weight="bold" /></Link>
      </header>
      <div style={c.chips} role="tablist" aria-label="Espace">
        {SPACES.map(s => (
          <button key={s.key} type="button" role="tab" aria-selected={space === s.key} onClick={() => setSpace(s.key)}
            style={{ ...c.chip, ...(space === s.key ? { background: s.color, borderColor: s.color, color: '#fff' } : {}) }}>
            {s.label} <span style={{ opacity: 0.75, fontWeight: 600 }}>{nf(spaces[s.key].count)}</span>
          </button>
        ))}
      </div>

      <div className="ck-members" style={c.members}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <strong style={c.bigNum}>{nf(d.count)}</strong>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>
            {d.newThisMonth > 0 ? `+${nf(d.newThisMonth)} ce mois-ci` : 'Aucun nouveau ce mois-ci'}{d.count - yearAgo > 0 ? ` · +${nf(d.count - yearAgo)} en 12 mois` : ''}
          </span>
          {d.split.length > 0 && (
            <>
              <div style={c.stack}>
                {d.split.map((s, i) => s.count > 0 && <i key={s.label} title={`${s.label} : ${s.count}`} style={{ width: `${(s.count / splitTotal) * 100}%`, background: i === 0 ? tint(cfg.color, 35) : i === 1 ? cfg.color : GOLD }} />)}
              </div>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12.5, color: 'var(--text-2)' }}>
                {d.split.map((s, i) => <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ ...c.legDot, background: i === 0 ? tint(cfg.color, 35) : i === 1 ? cfg.color : GOLD }} />{s.label} <strong>{nf(s.count)}</strong></span>)}
              </span>
            </>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <svg viewBox="0 0 400 96" preserveAspectRatio="none" style={{ width: '100%', height: 96, display: 'block' }} aria-hidden="true">
            <path d={`${growthPath} L400 96 L0 96 Z`} fill={tint(cfg.color, 12)} />
            <path d={growthPath} fill="none" stroke={cfg.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            {d.growth.map((g, i) => <span key={g.month} style={{ visibility: i % 2 === 1 || i === d.growth.length - 1 ? 'visible' : 'hidden' }}>{monthFr(g.month)}</span>)}
          </div>
        </div>
      </div>

      <div style={{ ...c.label, margin: '18px 0 4px' }}>Derniers inscrits</div>
      {d.recent.length === 0 ? <span style={c.muted}>Personne pour l&apos;instant.</span> : (
        <div className="ck-recent" style={c.recent}>
          {d.recent.map(u => (
            <Link key={u.id} href={`/dashboard/admin/membres/${u.id}`} style={c.recentItem}>
              <span style={{ ...c.avatar, background: tint(cfg.color, 15), color: cfg.color }}>{u.name.slice(0, 1).toUpperCase()}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>
                  {u.pros.length ? u.pros.map(p => `${PRO_LABEL[p.kind]}${p.paid ? '' : ' (à payer)'}`).join(', ') : PLAN_LABEL[u.plan] ?? u.plan} · <Ago iso={u.created_at} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'aujourd’hui'
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} j`
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`
  return `il y a ${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`
}
function Ago({ iso }: { iso: string }) {
  return <time dateTime={iso} suppressHydrationWarning>{relativeDate(iso)}</time>
}

// ── Raccourcis ────────────────────────────────────────────────────────────

export interface Shortcut { href: string; title: string; info: string; Icon: React.ElementType; color: string; alert?: boolean }

export function Shortcuts({ groups }: { groups: Array<{ label: string; items: Shortcut[] }> }) {
  return (
    <section className="fade-up">
      <div className="ck-short" style={c.shortGrid}>
        {groups.map(g => (
          <div key={g.label} style={c.shortGroup}>
            <span style={c.label}>{g.label}</span>
            {g.items.map(({ href, title, info, Icon, color, alert }) => (
              <Link key={href} href={href} style={c.shortRow}>
                <span style={{ ...c.shortIcon, color, background: tint(color) }}><Icon size={17} weight="duotone" /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
                  <span style={{ display: 'block', fontSize: 12, color: alert ? 'var(--danger-text)' : 'var(--text-3)', fontWeight: alert ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info}</span>
                </span>
                <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export const COCKPIT_CSS = `
@media (max-width: 900px) {
  .ck-cols3 { grid-template-columns: 1fr !important; }
  .ck-cols3 .ck-col + .ck-col { border-left: none !important; border-top: 1px solid var(--border); }
  .ck-two, .ck-members { grid-template-columns: 1fr !important; }
  .ck-short { grid-template-columns: 1fr 1fr !important; }
  .ck-recent { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 640px) {
  .ck-funnel { grid-template-columns: 1fr 1fr !important; }
  .ck-funnel .ck-step:nth-child(3) { border-left: none !important; }
  .ck-funnel .ck-step:nth-child(n+3) { border-top: 1px solid var(--border); }
  .ck-funnel .ck-arrow:nth-child(3)::before { display: none; }
  .ck-short, .ck-recent { grid-template-columns: 1fr !important; }
  .ck-xminor { display: none; }
}
.ck-arrow::before { content: ""; position: absolute; left: -7px; top: 50%; width: 12px; height: 12px; background: var(--surface); border-top: 1px solid var(--border); border-right: 1px solid var(--border); transform: translateY(-50%) rotate(45deg); }
`

const c: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  label: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-2)' },
  headLink: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' },
  muted: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 },
  liveHead: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '14px 20px', borderBottom: '1px solid var(--border)' },
  dot: { width: 9, height: 9, borderRadius: 99, flexShrink: 0 },
  cols3: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  col: { display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 20px', borderLeft: '1px solid var(--border)', minWidth: 0 },
  colTitle: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)' },
  bigInline: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 24, color: 'var(--text)' },
  seg: { display: 'inline-flex', padding: 3, borderRadius: 10, background: 'var(--bg-2, rgba(0,76,63,0.05))', border: '1px solid var(--border)' },
  segBtn: { border: '1px solid transparent', background: 'transparent', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  segOn: { border: '1px solid var(--accent-text)', background: 'var(--accent-text)', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit' },
  funnel: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  step: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, padding: '14px 16px', borderLeft: '1px solid var(--border)', minWidth: 0 },
  stepVal: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 30, lineHeight: 1.1, color: 'var(--text)' },
  evo: { fontSize: 12, fontWeight: 600, color: 'var(--text-3)' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--text-2)' },
  legDot: { display: 'inline-block', width: 10, height: 10, borderRadius: 3, marginRight: 6, verticalAlign: '-1px' },
  two: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  srcRow: { display: 'grid', gridTemplateColumns: 'minmax(90px, 120px) 1fr 44px', alignItems: 'center', gap: 10, padding: '5px 0' },
  bar: { display: 'block', height: 8, borderRadius: 6, background: 'var(--bg-2, rgba(0,76,63,0.06))', overflow: 'hidden' },
  barFill: { display: 'block', height: '100%', borderRadius: 6 },
  num: { textAlign: 'right', fontSize: 13.5, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' },
  pageRow: { display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr) 44px', gap: 8, alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)', textDecoration: 'none' },
  more: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  members: { display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1.6fr', gap: 24, alignItems: 'center' },
  bigNum: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 44, lineHeight: 1, color: 'var(--text)' },
  stack: { display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-2, rgba(0,76,63,0.06))', marginTop: 6 },
  recent: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  recentItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, border: '1px solid var(--border)', textDecoration: 'none', minWidth: 0 },
  avatar: { width: 32, height: 32, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  shortGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 },
  shortGroup: { display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 14px 10px' },
  shortRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', borderRadius: 10, textDecoration: 'none', minWidth: 0 },
  shortIcon: { width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
}

// ── Base injoignable ──────────────────────────────────────────────────────

/** Vue d'ensemble sans aucune lecture réussie : nouvel essai tout seul, de
 *  plus en plus espacé (15 s, 30 s, 1 min, puis toutes les 2 min). Avant le
 *  18/11/2026 : toutes les 15 s sans fin, sur une base déjà saturée. */
const retryDelay = (tries: number) => Math.min(15 * 2 ** tries, 120)
export function OverviewUnavailable() {
  const router = useRouter()
  const [tries, setTries] = useState(0)
  const [left, setLeft] = useState(retryDelay(0))
  const delay = retryDelay(tries)
  useEffect(() => {
    const id = setInterval(() => {
      setLeft(l => {
        if (l <= 1) { router.refresh(); setTries(n => n + 1); return retryDelay(tries + 1) }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [router, tries])
  const retry = () => { router.refresh(); setTries(n => n + 1); setLeft(retryDelay(tries + 1)) }
  const R = 22, C = 2 * Math.PI * R

  return (
    <section role="status" aria-live="polite" style={c.down}>
      <div style={c.downIcon}>
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,213,107,0.25)" strokeWidth="3" />
          <circle cx="28" cy="28" r={R} fill="none" stroke="#FFD56B" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (left / delay)} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <span style={{ position: 'relative', fontFamily: 'var(--font-fraunces), serif', fontSize: 20, color: '#fff' }}>{left}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={c.downTag}>Base de données ralentie</span>
        <h2 style={c.downTitle}>Tes chiffres arrivent dans un instant</h2>
        <p style={c.downText}>
          La base gratuite de Supabase met parfois quelques secondes à répondre. La page réessaie toute seule
          {tries > 0 ? ` (essai ${tries + 1})` : ''} : rien n&apos;est perdu, tes données sont intactes.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          <button type="button" onClick={retry} style={c.downBtn}>Réessayer maintenant</button>
          <Link href="/dashboard/admin/qg" style={c.downLink}>Ouvrir le QG demandes <ArrowRight size={13} weight="bold" /></Link>
        </div>
      </div>
    </section>
  )
}

Object.assign(c, {
  down: { display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', padding: '26px 28px', borderRadius: 20, background: 'linear-gradient(135deg, #003329, #004C3F)', color: '#fff', maxWidth: 760, boxShadow: '0 18px 40px -24px rgba(0,51,41,0.6)' },
  downIcon: { position: 'relative', width: 56, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 99, background: 'rgba(255,255,255,0.08)' },
  downTag: { display: 'inline-block', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#FFD56B' },
  downTitle: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 24, lineHeight: 1.2, margin: '6px 0 8px', color: '#fff' },
  downText: { fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', margin: 0 },
  downBtn: { height: 42, padding: '0 18px', borderRadius: 11, border: 'none', background: '#FFD56B', color: '#003329', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  downLink: { display: 'inline-flex', alignItems: 'center', gap: 6, height: 42, padding: '0 16px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
} satisfies Record<string, React.CSSProperties>)
