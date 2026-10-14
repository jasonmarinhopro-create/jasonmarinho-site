'use client'

// Carte « Montée en charge automatique » de l'onglet Réglages : décision du
// jour (ou prévision), signaux des 7 derniers jours, réglages et journal.
// Règles : lib/outreach/warmup.ts.

import { TrendUp, TrendDown, Minus, WarningCircle, Hourglass } from '@phosphor-icons/react/dist/ssr'
import { AMBER, tint } from '../_ui/theme'
import { WARMUP, type WarmupLevel, type WarmupAction, type WarmupStats } from '@/lib/outreach/warmup'
import { ui, type WarmupView } from './shared'

const LEVEL: Record<WarmupLevel, { label: string; color: string }> = {
  vert: { label: 'Tout va bien', color: 'var(--accent-text)' },
  orange: { label: 'À surveiller', color: AMBER },
  rouge: { label: 'Mauvais signaux', color: 'var(--danger)' },
  attente: { label: 'Pas encore assez d\'envois', color: 'var(--text-3)' },
}

const ACTION_ICON: Record<WarmupAction, React.ReactNode> = {
  monter: <TrendUp size={14} weight="bold" />,
  baisser: <TrendDown size={14} weight="bold" />,
  garder: <Minus size={14} weight="bold" />,
}

const frDate = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${m}`
}
const pct = (n: number, d: number) => (d ? `${(Math.round((n / d) * 1000) / 10).toString().replace('.', ',')} %` : '–')

export default function WarmupCard({ warmup, cap, enabled, setEnabled, ceiling, setCeiling, today }: {
  warmup: WarmupView
  cap: number
  enabled: boolean
  setEnabled: (v: boolean) => void
  ceiling: number
  setCeiling: (v: number) => void
  today: string
}) {
  if (!warmup.supported) {
    return (
      <div style={ui.notice}>
        <WarningCircle size={16} weight="fill" style={{ color: AMBER, flexShrink: 0, marginTop: '1px' }} />
        <span>Montée en charge automatique : la migration <code>20261014_135_prospection_montee_en_charge.sql</code> n&apos;est pas encore passée. Le plafond reste celui que tu choisis.</span>
      </div>
    )
  }

  const todayEntry = warmup.log[0]?.date === today ? warmup.log[0] : null
  const decision = todayEntry
    ? { level: todayEntry.level, action: todayEntry.action, cap: todayEntry.to, reasons: todayEntry.reasons }
    : warmup.preview
  const lvl = decision ? LEVEL[decision.level] : null
  const st: WarmupStats | null = warmup.live

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {decision && lvl && (
        <div style={{ ...s.status, borderColor: tint(lvl.color, 35), background: tint(lvl.color, 8) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ ...s.pill, color: lvl.color, borderColor: tint(lvl.color, 40) }}>{decision.level === 'attente' ? <Hourglass size={13} weight="bold" /> : ACTION_ICON[decision.action]} {lvl.label}</span>
            <strong style={{ fontSize: '13.5px', color: 'var(--text)' }}>
              {todayEntry
                ? (todayEntry.action === 'garder' ? `Aujourd'hui : plafond gardé à ${todayEntry.to}` : `Aujourd'hui : plafond ${todayEntry.action === 'monter' ? 'monté' : 'baissé'} de ${todayEntry.from} à ${todayEntry.to}`)
                : enabled
                  ? `Au prochain jour d'envoi : ${decision.action === 'garder' ? `plafond gardé à ${cap}` : `plafond ${decision.action === 'monter' ? 'monté' : 'baissé'} à ${decision.cap}`}`
                  : 'Montée en charge coupée : voici ce qu\'elle ferait'}
            </strong>
          </div>
          <ul style={s.reasons}>{decision.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      {st && (
        <div>
          <div style={s.kicker}>Les 7 derniers jours</div>
          <div style={s.stats}>
            <Tile label="Envoyés" value={`${st.sent}`} />
            <Tile label="Rebonds" value={`${st.bounces}`} sub={pct(st.bounces, st.sent)} warn={st.sent >= WARMUP.minSample && st.bounces / Math.max(1, st.sent) > 0.02} />
            <Tile label="Refus du serveur" value={`${st.blocks}`} sub="spam, débit" warn={st.blocks > 0} />
            <Tile label="Désinscriptions" value={`${st.unsubscribes + st.complaints}`} sub={st.complaints ? `dont ${st.complaints} plainte${st.complaints > 1 ? 's' : ''}` : pct(st.unsubscribes, st.sent)} warn={st.complaints > 0} />
            <Tile label="Autres erreurs" value={`${st.otherErrors}`} sub="réseau, connexion" />
            <Tile label="Réponses" value={`${st.replies}`} sub="le meilleur signe" />
          </div>
        </div>
      )}

      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13.5px', color: 'var(--text-2)', cursor: 'pointer' }}>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ accentColor: 'var(--accent-text)' }} />
        Laisser l&apos;app ajuster le plafond chaque jour d&apos;envoi
      </label>
      <label style={ui.label}>
        Plafond maximum
        <input type="number" min={WARMUP.floor} max={WARMUP.maxCeiling} value={ceiling} onChange={e => setCeiling(parseInt(e.target.value) || WARMUP.floor)} style={{ ...ui.input, maxWidth: '140px' }} disabled={!enabled} />
      </label>
      <p style={ui.sub}>
        Monte de {WARMUP.step} au plus tous les {WARMUP.minDaysBetweenRaises} jours si le plafond est vraiment utilisé, avec moins de 2 % de rebonds, aucun refus du serveur et peu de désinscriptions.
        Reste en place entre 2 et 5 % de rebonds ou après 1 refus. Baisse de 40 % (jamais sous {WARMUP.floor}) au-delà de 5 % de rebonds, à partir de 2 refus ou sur un signalement, puis {WARMUP.coolDownAfterCut} jours de prudence.
        Hostinger gratuit : 100 e-mails par jour, les tiens compris, d&apos;où un maximum de {WARMUP.defaultCeiling} par défaut.
      </p>
      <p style={ui.sub}>Ce que l&apos;app ne peut pas voir : un e-mail rangé dans les indésirables sans rebond. Si les réponses chutent alors que les envois montent, baisse le maximum.</p>

      {warmup.log.length > 0 && (
        <div>
          <div style={s.kicker}>Journal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {warmup.log.slice(0, 10).map(e => (
              <div key={e.date} style={s.logRow}>
                <span style={{ width: 44, color: 'var(--text-3)', flexShrink: 0 }}>{frDate(e.date)}</span>
                <span style={{ color: LEVEL[e.level].color, display: 'inline-flex', flexShrink: 0 }}>{ACTION_ICON[e.action]}</span>
                <strong style={{ width: 64, flexShrink: 0, color: 'var(--text)' }}>{e.from === e.to ? `${e.to}` : `${e.from} → ${e.to}`}</strong>
                <span style={{ color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.reasons.join(' · ')}>{e.reasons[e.reasons.length - 1] ?? ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Tile({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div style={{ ...s.tile, ...(warn ? { border: `1px solid ${tint(AMBER, 45)}`, background: tint(AMBER, 7) } : {}) }}>
      <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', color: warn ? AMBER : 'var(--text)', lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{sub}</span>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  status: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, background: 'var(--surface)' },
  reasons: { margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  kicker: { fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: '8px' },
  tile: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px 12px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--bg)' },
  logRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', padding: '5px 0', borderBottom: '1px solid var(--border)' },
}
