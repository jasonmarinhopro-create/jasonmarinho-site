import Link from 'next/link'
import {
  Heartbeat, CheckCircle, Warning, WarningOctagon, Question, ArrowSquareOut, ArrowRight, ArrowClockwise,
  CreditCard, LockKey, Bank, CalendarBlank, EnvelopeSimple, Bug, Robot, Database, GearSix,
} from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, tint } from '../_ui/theme'
import { overallSummary, type HealthCheck, type HealthLevel } from '@/lib/admin/health'

// Page « État de santé » (05/10/2026) : paiements, cautions, comptes Stripe,
// calendriers, e-mails, tâches automatiques, migrations et configuration au
// même endroit. Chaque bloc dit ce qui se passe et quoi faire.

const LEVEL: Record<HealthLevel, { color: string; label: string; Icon: typeof CheckCircle }> = {
  ok: { color: 'var(--accent-text)', label: 'OK', Icon: CheckCircle },
  warn: { color: AMBER, label: 'À surveiller', Icon: Warning },
  alert: { color: 'var(--danger)', label: 'À régler', Icon: WarningOctagon },
  unknown: { color: 'var(--text-3)', label: 'Indisponible', Icon: Question },
}

const ICONS: Record<string, typeof CheckCircle> = {
  loyers: CreditCard, cautions: LockKey, stripe: Bank, ical: CalendarBlank, emails: EnvelopeSimple,
  erreurs: Bug, taches: Robot, migrations: Database, config: GearSix,
}

export default function SanteView({ checks, checkedAt }: { checks: HealthCheck[]; checkedAt: string }) {
  const overall = overallSummary(checks)
  const o = LEVEL[overall.level === 'unknown' ? 'ok' : overall.level]
  // Les blocs à traiter d'abord, puis à surveiller, puis ceux qui vont bien.
  const order: HealthLevel[] = ['alert', 'warn', 'unknown', 'ok']
  const sorted = [...checks].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminHero
        section="État de santé"
        title="Tout ce qui doit marcher,"
        em="au même endroit"
        desc="Paiements, cautions, comptes Stripe des hôtes, calendriers, e-mails, sauvegarde et migrations : chaque bloc dit ce qui se passe et quoi faire."
        aside={
          <div style={adminAsideCard}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              <Heartbeat size={15} weight="fill" color={o.color} /> En ce moment
            </span>
            <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 24, color: o.color, lineHeight: 1.2 }}>{overall.text}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {checks.filter(c => c.level === 'ok').length} bloc{checks.filter(c => c.level === 'ok').length > 1 ? 's' : ''} sur {checks.length} sans souci
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Vérifié à {checkedAt} · Stripe relu toutes les 10 min, GitHub toutes les 15 min</span>
          </div>
        }
      >
        <Link href="/dashboard/admin/sante" prefetch={false} style={s.refresh}>
          <ArrowClockwise size={14} weight="bold" /> Revérifier
        </Link>
      </AdminHero>

      <div style={s.grid}>
        {sorted.map(c => <CheckCard key={c.key} check={c} />)}
      </div>
    </div>
  )
}

function CheckCard({ check: c }: { check: HealthCheck }) {
  const lv = LEVEL[c.level]
  const Icon = ICONS[c.key] ?? Heartbeat
  return (
    <section id={c.key} style={{ ...s.card, border: `1px solid ${c.level === 'ok' ? 'var(--border)' : tint(lv.color, 35)}` }}>
      <header style={s.head}>
        <span style={{ ...s.icon, background: tint(lv.color, 14), color: lv.color }}><Icon size={18} weight="fill" /></span>
        <h2 style={s.title}>{c.title}</h2>
        <span style={{ ...s.pill, color: lv.color, background: tint(lv.color, 12), border: `1px solid ${tint(lv.color, 30)}` }}>
          <lv.Icon size={13} weight="fill" /> {lv.label}
        </span>
      </header>
      <p style={s.summary}>{c.summary}</p>

      {c.items.length > 0 && (
        <ul style={s.list}>
          {c.items.map((it, i) => {
            const il = LEVEL[it.level ?? 'ok']
            const body = (
              <>
                <span style={{ ...s.dot, background: il.color }} aria-label={il.label} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={s.itemLabel}>{it.label}</span>
                  {it.detail && <span style={s.itemDetail}>{it.detail}</span>}
                </span>
                {it.href && <ArrowRight size={13} style={{ flexShrink: 0, color: 'var(--text-3)', marginTop: 3 }} />}
              </>
            )
            return (
              <li key={i}>
                {it.href
                  ? it.href.startsWith('http')
                    ? <a href={it.href} target="_blank" rel="noopener noreferrer" style={s.item}>{body}</a>
                    : <Link href={it.href} style={s.item}>{body}</Link>
                  : <div style={s.item}>{body}</div>}
              </li>
            )
          })}
        </ul>
      )}

      {c.advice && <p style={s.advice}>{c.advice}</p>}

      {c.action && (
        c.action.external
          ? <a href={c.action.href} target="_blank" rel="noopener noreferrer" style={s.action}>{c.action.label} <ArrowSquareOut size={13} weight="bold" /></a>
          : <Link href={c.action.href} style={s.action}>{c.action.label} <ArrowRight size={13} weight="bold" /></Link>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', gap: 16, alignItems: 'start' },
  card: { background: 'var(--surface)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, scrollMarginTop: 80 },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)', flex: 1, minWidth: 140 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99 },
  summary: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--border)', paddingTop: 6 },
  item: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 6px', borderRadius: 8, textDecoration: 'none', color: 'inherit' },
  dot: { width: 8, height: 8, borderRadius: 99, flexShrink: 0, marginTop: 6 },
  itemLabel: { display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' },
  itemDetail: { display: 'block', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, overflowWrap: 'anywhere' },
  advice: { fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.55, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' },
  action: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  refresh: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none', padding: '8px 14px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--surface)' },
}
