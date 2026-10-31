import Link from 'next/link'
import { EnvelopeSimple, Users, CursorClick, UserPlus, Eye, Info, Warning, CalendarBlank, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'
import { EDITIONS, EDITION_CONFIG, type Edition } from '@/lib/newsletter/editions'
import { NEWSLETTER_NAME } from '@/lib/newsletter/template'
import type { NewsletterTabData } from '@/lib/newsletter/stats'
import type { IssueReport } from '@/lib/newsletter/stats-parse'

// Onglet « Newsletter » de Provenance (11/10/2026, demande de Jason : voir le
// contenu de « Le Check-in » et ses statistiques). Chiffres Brevo (envoyés,
// ouvertures, clics, désinscriptions, liens cliqués) + nos mesures (visiteurs,
// inscriptions et clients venus d'une lettre).

const nf = (n: number) => n.toLocaleString('fr-FR')
const rate = (r: number | null) => (r === null ? '–' : `${r.toLocaleString('fr-FR')} %`)
const dayFr = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const monthFr = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const EDITION_COLOR: Record<Edition, string> = { hote: 'var(--accent-text)', investisseur: BROWN, photographe: PINK, menage: AMBER, depannage: '#A4502A' }

export default function NewsletterTab({ data, edition, periode }: { data: NewsletterTabData; edition: Edition; periode: string }) {
  const sent = data.reports.filter(r => r.sent)
  const last = sent[0]
  const base = `/dashboard/admin/provenance?onglet=newsletter&periode=${periode}`
  const totalRecipients = data.subscribers.byEdition ? EDITIONS.reduce((n, e) => n + (data.subscribers.byEdition![e] ?? 0), 0) : null

  return (
    <>
      {data.error && (
        <div style={s.warn}><Warning size={18} weight="fill" color={AMBER} style={{ flexShrink: 0 }} /><span>{data.error}</span></div>
      )}

      {/* Chiffres clés */}
      <div style={s.grid4}>
        <Kpi icon={<Users size={15} weight="fill" />} label="Destinataires" value={totalRecipients === null ? '–' : nf(totalRecipients)}
          sub={data.subscribers.byEdition ? EDITIONS.filter(e => data.subscribers.byEdition![e] > 0).map(e => `${EDITION_CONFIG[e].label} ${data.subscribers.byEdition![e]}`).join(' · ') : 'Brevo indisponible'} />
        <Kpi icon={<EnvelopeSimple size={15} weight="fill" />} label="Inscrits à la lettre" value={data.subscribers.brevo === null ? '–' : nf(data.subscribers.brevo)}
          sub={data.subscribers.optIns === null ? 'liste Brevo' : `dont ${nf(data.subscribers.optIns)} compte${data.subscribers.optIns > 1 ? 's' : ''} de l'app (case cochée)`} />
        <Kpi icon={<CursorClick size={15} weight="fill" />} label="Dernière lettre" value={last?.stats ? rate(last.clickRate) : '–'}
          sub={last?.stats ? `de clics · ${rate(last.openRate)} d'ouvertures · ${last.stats.unsubscribed} désinscription${last.stats.unsubscribed > 1 ? 's' : ''}` : 'Pas encore de lettre envoyée'} />
        <Kpi icon={<UserPlus size={15} weight="fill" />} label="Venus des lettres" value={nf(data.totals.signups)}
          sub={`inscription${data.totals.signups > 1 ? 's' : ''} · ${nf(data.totals.clients)} client${data.totals.clients > 1 ? 's' : ''} · ${nf(data.totals.visitors)} visiteur${data.totals.visitors > 1 ? 's' : ''}`} />
      </div>

      {/* Contenu d'une lettre envoyée */}
      {data.viewing && (
        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><Eye size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={s.title}>{data.viewing.subject}</h2>
              <p style={s.sub}>La lettre telle qu&apos;elle est partie ({labelOfKey(data.viewing.key)}).</p>
            </div>
            <Link href={base} style={s.btn}>Fermer</Link>
          </header>
          <iframe title="Lettre envoyée" srcDoc={data.viewing.html} sandbox="" style={s.frame} />
        </section>
      )}

      {/* Lettres envoyées */}
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint(AMBER, 14), color: AMBER }}><EnvelopeSimple size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>Les lettres envoyées</h2>
            <p style={s.sub}>Une ligne par lettre et par édition. Chiffres d&apos;ouverture et de clics fournis par Brevo ; visiteurs et inscriptions mesurés sur le site et dans l&apos;app.</p>
          </div>
        </header>
        {data.reports.length === 0 ? (
          <p style={s.text}>Aucune lettre programmée pour l&apos;instant. La première partira le {dayFr(data.next.date)} à 9 h 30 ; tu recevras un aperçu de chaque édition la veille.</p>
        ) : (
          <ul style={s.list}>{data.reports.map(r => <IssueRowView key={r.key} r={r} base={base} />)}</ul>
        )}
        <p style={s.note}><Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          Apple Mail ouvre les e-mails tout seul pour protéger la vie privée : le taux d&apos;ouverture est gonflé. Fie-toi surtout aux clics, aux visiteurs et aux inscriptions.
        </p>
      </section>

      {/* Prochaine lettre */}
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><CalendarBlank size={18} weight="fill" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={s.title}>La prochaine lettre</h2>
            <p style={s.sub}>Programmée toute seule pour le {dayFr(data.next.date)} à 9 h 30. Voici chaque édition composée avec ce qui est publié aujourd&apos;hui : elle s&apos;enrichira d&apos;ici là.</p>
          </div>
        </header>
        <div style={s.chips}>
          {EDITIONS.map(e => (
            <Link key={e} href={`${base}&edition=${e}`} style={e === edition ? { ...s.chipOn, background: EDITION_COLOR[e], borderColor: EDITION_COLOR[e] } : s.chip}>
              {EDITION_CONFIG[e].label}{data.subscribers.byEdition ? ` · ${data.subscribers.byEdition[e]}` : ''}
            </Link>
          ))}
        </div>
        {data.next.html ? (
          <>
            <p style={{ ...s.text, margin: 0 }}><strong>Objet :</strong> {data.next.subject}</p>
            <iframe title={`${NEWSLETTER_NAME}, édition ${EDITION_CONFIG[edition].label}`} srcDoc={data.next.html} sandbox="" style={s.frame} />
          </>
        ) : (
          <p style={s.text}>Pas encore assez de contenu publié ce mois-ci pour composer la lettre (il faut au moins 3 actualités ou articles).</p>
        )}
      </section>
    </>
  )
}

function labelOfKey(key: string) {
  const [month, ed] = key.split('#')
  return `${monthFr(month)}, édition ${EDITION_CONFIG[(ed as Edition) ?? 'hote']?.label ?? 'Hôtes'}`
}

function IssueRowView({ r, base }: { r: IssueReport; base: string }) {
  return (
    <li style={{ ...s.row, alignItems: 'flex-start' }}>
      <div style={{ flex: '2 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ ...s.tag, background: tint(EDITION_COLOR[r.edition], 14), color: EDITION_COLOR[r.edition] }}>{EDITION_CONFIG[r.edition].label}</span>
          <span style={s.rowDetail}>{monthFr(r.month)}{r.scheduledAt ? ` · ${r.sent ? 'envoyée le' : 'programmée pour le'} ${dayFr(r.scheduledAt)}` : ''}</span>
        </span>
        <span style={s.rowName}>{r.subject}</span>
        <Link href={`${base}&voir=${encodeURIComponent(r.key)}`} style={s.action}>Voir le contenu <ArrowRight size={13} weight="bold" /></Link>
        {r.links.length > 0 && (
          <details>
            <summary style={s.more}>Liens les plus cliqués</summary>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {r.links.map(l => (
                <li key={l.url} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                  <strong style={{ minWidth: 22, textAlign: 'right', color: 'var(--text)' }}>{l.clicks}</strong>
                  <span style={{ overflowWrap: 'anywhere' }}>{l.label}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div style={{ flex: '3 1 360px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 8 }}>
        <Stat label="Envoyés" value={r.stats ? nf(r.stats.sent) : r.recipients !== null ? nf(r.recipients) : '–'} />
        <Stat label="Ouvertures" value={rate(r.openRate)} sub={r.stats ? nf(r.stats.opens) : undefined} />
        <Stat label="Clics" value={rate(r.clickRate)} sub={r.stats ? nf(r.stats.clicks) : undefined} />
        <Stat label="Visiteurs" value={nf(r.visitors)} />
        <Stat label="Inscriptions" value={nf(r.signups)} sub={r.clients ? `${r.clients} client${r.clients > 1 ? 's' : ''}` : undefined} />
        <Stat label="Désinscrits" value={r.stats ? nf(r.stats.unsubscribed) : '–'} />
      </div>
    </li>
  )
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div style={s.kpi}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--text-3)' }}>{icon} {label}</span>
      <span style={{ fontSize: 28, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', lineHeight: 1.15 }}>{value}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45 }}>{sub}</span>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', minWidth: 0 }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 18, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)' }}>{value}{sub && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'inherit' }}> · {sub}</span>}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 12 },
  kpi: { display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'hidden' },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  text: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  note: { display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  chipOn: { padding: '6px 12px', borderRadius: 99, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  frame: { width: '100%', height: 900, border: '1px solid var(--border)', borderRadius: 12, background: '#EDF3EF' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' },
  row: { display: 'flex', gap: 14, flexWrap: 'wrap', padding: '14px 2px', borderBottom: '1px solid var(--border)' },
  rowName: { display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' },
  rowDetail: { fontSize: 12.5, color: 'var(--text-3)' },
  tag: { padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 },
  action: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  more: { cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', padding: '4px 0' },
  btn: { display: 'inline-flex', alignItems: 'center', padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  warn: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 35)}`, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 },
}
