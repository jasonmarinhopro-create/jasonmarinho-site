import Link from 'next/link'
import {
  SignIn, SignOut, Broom, PenNib, CurrencyEur, LockKey, IdentificationCard, CheckCircle, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'

// Bloc « À faire aujourd'hui » de l'accueil (sept. 2026), inspiré du tableau
// de bord d'Hospitable (arrivées, départs, tâches du jour en tête) : ce qui
// se passe aujourd'hui puis ce qui attend une action, chaque ligne menant
// à la page où on la traite. Le reste de l'accueil passe en dessous.

export type TodayItem = { key: string; label: string; sub?: string | null; done?: boolean }

export type TodayAction = {
  key: 'signer' | 'loyer' | 'caution' | 'declarations'
  count: number
  href: string
  names: string[]
}

const ACTIONS: Record<TodayAction['key'], { label: (n: number) => string; Icon: React.ElementType; color: string }> = {
  signer:       { label: n => `contrat${n > 1 ? 's' : ''} à faire signer`,        Icon: PenNib,             color: '#B7791F' },
  loyer:        { label: n => `loyer${n > 1 ? 's' : ''} pas encore encaissé${n > 1 ? 's' : ''}`, Icon: CurrencyEur, color: '#B7791F' },
  caution:      { label: n => `caution${n > 1 ? 's' : ''} à traiter`,             Icon: LockKey,            color: 'var(--accent-text)' },
  declarations: { label: n => `déclaration${n > 1 ? 's' : ''} voyageur à faire`,  Icon: IdentificationCard, color: '#B7791F' },
}

export default function TodayBoard({ arrivals, departures, menages, actions }: {
  arrivals: TodayItem[]
  departures: TodayItem[]
  menages: TodayItem[] | null   // null : planning ménage indisponible
  actions: TodayAction[]
}) {
  const pending = actions.filter(a => a.count > 0)
  return (
    <section style={s.wrap} className="fade-up" aria-label="À faire aujourd'hui">
      <h2 style={s.title}>À faire aujourd&apos;hui</h2>

      <div style={{ ...s.cols, gridTemplateColumns: `repeat(${menages ? 3 : 2}, minmax(0, 1fr))` }} className="today-cols">
        <Column
          Icon={SignIn} color="var(--accent-text)" title="Arrivées" href="/dashboard/calendrier"
          items={arrivals} empty="Aucune arrivée"
        />
        <Column
          Icon={SignOut} color="#B7791F" title="Départs" href="/dashboard/calendrier"
          items={departures} empty="Aucun départ"
        />
        {menages && (
          <Column
            Icon={Broom} color="#DB4F96" title="Ménages" href="/dashboard/calendrier/menage"
            items={menages} empty="Aucun ménage"
            badge={menages.length > 0 ? `${menages.filter(m => m.done).length}/${menages.length} faits` : undefined}
          />
        )}
      </div>

      <div style={s.actions}>
        {pending.length === 0 ? (
          <div style={s.allGood}>
            <CheckCircle size={16} weight="fill" /> Rien en attente : contrats, paiements, cautions et déclarations sont à jour.
          </div>
        ) : pending.map(a => {
          const meta = ACTIONS[a.key]
          return (
            <Link key={a.key} href={a.href} style={s.action}>
              <span style={{ ...s.actionIcon, color: meta.color, background: `color-mix(in srgb, ${meta.color} 13%, transparent)` }}>
                <meta.Icon size={15} weight="fill" />
              </span>
              <span style={s.actionText}>
                <strong style={{ color: 'var(--text)' }}>{a.count}</strong> {meta.label(a.count)}
                {a.names.length > 0 && (
                  <span style={s.actionNames}>
                    {' · '}{a.names.slice(0, 3).join(', ')}{a.names.length > 3 ? '…' : ''}
                  </span>
                )}
              </span>
              <ArrowRight size={13} weight="bold" color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </Link>
          )
        })}
      </div>

      <style>{`@media (max-width: 760px) { .today-cols { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  )
}

function Column({ Icon, color, title, href, items, empty, badge }: {
  Icon: React.ElementType; color: string; title: string; href: string
  items: TodayItem[]; empty: string; badge?: string
}) {
  const shown = items.slice(0, 3)
  return (
    <Link href={href} style={s.col}>
      <div style={s.colHead}>
        <span style={{ ...s.colIcon, color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}><Icon size={15} weight="bold" /></span>
        <span style={s.colTitle}>{title}</span>
        <span style={{ ...s.colCount, color: items.length ? color : 'var(--text-muted)' }}>{items.length}</span>
      </div>
      {badge && <div style={s.colBadge}>{badge}</div>}
      {items.length === 0 ? (
        <div style={s.colEmpty}>{empty}</div>
      ) : (
        <ul style={s.list}>
          {shown.map(it => (
            <li key={it.key} style={s.item}>
              {it.done !== undefined && (
                <CheckCircle size={13} weight={it.done ? 'fill' : 'regular'} color={it.done ? "var(--accent-text)" : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
              )}
              <span style={s.itemLabel}>{it.label}</span>
              {it.sub && <span style={s.itemSub}>{it.sub}</span>}
            </li>
          ))}
          {items.length > shown.length && <li style={s.more}>+ {items.length - shown.length} autre{items.length - shown.length > 1 ? 's' : ''}</li>}
        </ul>
      )}
    </Link>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(16px, 2.2vw, 22px)', borderRadius: 'var(--r-xl, 18px)',
    background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0,
  },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: '0 0 14px' },
  cols: { display: 'grid', gap: '10px', marginBottom: '12px' },
  col: {
    display: 'block', padding: '12px 14px', borderRadius: '12px', textDecoration: 'none',
    background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 0,
  },
  colHead: { display: 'flex', alignItems: 'center', gap: '8px' },
  colIcon: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  colTitle: { flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  colCount: { fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif' },
  colBadge: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '4px' },
  colEmpty: { fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px' },
  list: { listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '5px' },
  item: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', minWidth: 0 },
  itemLabel: { color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  itemSub: { color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  more: { fontSize: '12px', color: 'var(--text-muted)' },
  actions: { display: 'flex', flexDirection: 'column', gap: '6px' },
  action: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px',
    background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none',
  },
  actionIcon: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionText: { flex: 1, minWidth: 0, fontSize: '13.5px', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  actionNames: { color: 'var(--text-3)' },
  allGood: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px',
    fontSize: '13px', color: 'var(--accent-text)', fontWeight: 600, background: 'var(--accent-bg)',
  },
}
