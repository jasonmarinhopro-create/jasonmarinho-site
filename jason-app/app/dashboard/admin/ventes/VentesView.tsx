import Link from 'next/link'
import {
  ChartLineUp, Target, HouseLine, Camera, Broom, EnvelopeSimple, ArrowRight, UserCircle, CalendarBlank, Info,
} from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'
import { PRICES } from '@/lib/admin/revenue'
import { COTISATIONS_ESTIMATE, wakeUpMailto, type MemberActivity } from '@/lib/admin/sales'
import type { SalesData } from '@/lib/admin/sales-load'

// Page « Ventes » (05/10/2026) : où en sont les abonnements par rapport à ce
// que coûtent Supabase Pro et Vercel Pro, entonnoirs hôtes et pros, et la
// liste des membres à qui écrire cette semaine.

const eur = (n: number, digits = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + ' €'
const dateFr = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' })
  : null
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`
const SHOWN = 12

export default function VentesView({ data }: { data: SalesData }) {
  const { revenue, net, goals, hostFunnel, pros, weekly, toWake } = data
  const first = goals[0]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminHero
        section="Ventes"
        title="Ce que rapportent tes abonnements,"
        em="semaine après semaine"
        desc="Où tu en es par rapport au coût de Supabase Pro et Vercel Pro, à quelle étape les hôtes et les pros s'arrêtent, et à qui écrire cette semaine."
        aside={
          <div style={adminAsideCard}>
            <span style={s.asideLabel}><ChartLineUp size={15} weight="fill" color="var(--accent-text)" /> Par an aujourd&apos;hui</span>
            <strong style={s.asideBig}>{eur(revenue.annual, 2)}</strong>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {plural(revenue.subscriptions, 'abonnement')} · environ {eur(net, 0)} net après Stripe et cotisations
            </span>
            <div style={s.bar}><div style={{ ...s.barFill, width: `${first.pct}%` }} /></div>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{first.pct} % de {first.label} ({eur(first.annual)} par an)</span>
          </div>
        }
      />

      {/* Objectifs */}
      <div style={s.grid2}>
        {goals.map(g => (
          <section key={g.key} style={s.card}>
            <header style={s.head}>
              <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><Target size={18} weight="fill" /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={s.title}>{g.label}</h2>
                <p style={s.sub}>{eur(g.annual)} par an, TVA comprise · {g.detail}</p>
              </div>
              <strong style={{ fontSize: 20, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, color: g.pct >= 100 ? 'var(--accent-text)' : 'var(--text)' }}>{g.pct} %</strong>
            </header>
            <div style={s.bar}><div style={{ ...s.barFill, width: `${g.pct}%` }} /></div>
            {g.left > 0 ? (
              <>
                <p style={s.text}>Il manque environ <strong>{eur(g.left)}</strong> net par an, soit au choix :</p>
                <div style={s.chips}>
                  <Chip n={g.standard} label={`Standard à ${eur(PRICES.standard, 2)}`} color="var(--accent-text)" />
                  <Chip n={g.proFondateur} label={`fiches pro Fondateur à ${eur(PRICES.proFondateur, 2)}`} color={AMBER} />
                  <Chip n={g.proStandard} label={`fiches pro à ${eur(PRICES.proStandard, 2)}`} color={BROWN} />
                </div>
              </>
            ) : (
              <p style={s.text}>Objectif couvert : les abonnements paient cette offre.</p>
            )}
          </section>
        ))}
      </div>
      <p style={s.note}>
        <Info size={13} weight="bold" style={{ flexShrink: 0, marginTop: 2 }} />
        Net estimé : prix payé moins les frais Stripe (1,5 % + 0,25 €) puis environ {Math.round(COTISATIONS_ESTIMATE * 100)} % de cotisations sociales (à vérifier sur ton espace Urssaf). Coûts au cours de l&apos;euro d&apos;octobre 2026.
      </p>

      {/* Entonnoirs */}
      <div style={s.grid2}>
        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><HouseLine size={18} weight="fill" /></span>
            <h2 style={{ ...s.title, flex: 1 }}>Hôtes : où ils s&apos;arrêtent</h2>
          </header>
          <Funnel steps={[
            { label: 'Comptes hôtes', n: hostFunnel.comptes },
            { label: 'Avec un logement', n: hostFunnel.avecLogement },
            { label: 'Avec une réservation', n: hostFunnel.avecReservation },
            { label: 'Avec un contrat', n: hostFunnel.avecContrat },
            { label: 'En Standard (payant)', n: hostFunnel.payants },
          ]} />
          <p style={s.sub}>
            {hostFunnel.driing > 0 && <>{plural(hostFunnel.driing, 'membre Driing', 'membres Driing')} en plus (accès offert). </>}
            Le plus gros écart est souvent entre l&apos;inscription et le premier logement : c&apos;est la liste « Inscrits sans logement » plus bas.
          </p>
        </section>

        <section style={s.card}>
          <header style={s.head}>
            <span style={{ ...s.icon, background: tint(AMBER, 14), color: AMBER }}><Camera size={18} weight="fill" /></span>
            <h2 style={{ ...s.title, flex: 1 }}>Pros : de la prospection à la fiche payée</h2>
          </header>
          {([['photographe', 'Photographes', Camera, AMBER], ['menage', 'Équipes de ménage', Broom, PINK]] as const).map(([key, label, Icon, color]) => {
            const p = pros[key]
            return (
              <div key={key} style={s.proBlock}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                  <Icon size={15} weight="fill" color={color} /> {label}
                </span>
                {data.outreachAvailable && (
                  <div style={s.pipeline}>
                    {p.pipeline.map(st => (
                      <span key={st.key} style={s.pipeStep}>
                        <strong style={{ fontSize: 17, color: st.count > 0 ? 'var(--text)' : 'var(--text-3)' }}>{st.count}</strong>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{st.label}</span>
                      </span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {plural(p.fiches, 'fiche')} créée{p.fiches > 1 ? 's' : ''}, dont <strong>{p.payees} payée{p.payees > 1 ? 's' : ''}</strong> · {plural(p.founderLeft, 'place')} Fondateur restante{p.founderLeft > 1 ? 's' : ''}
                </span>
              </div>
            )
          })}
          <Link href="/dashboard/admin/prospection" style={s.action}>Ouvrir la prospection <ArrowRight size={13} weight="bold" /></Link>
        </section>
      </div>

      {/* Inscriptions par semaine */}
      <section style={s.card}>
        <header style={s.head}>
          <span style={{ ...s.icon, background: tint(BROWN, 14), color: BROWN }}><CalendarBlank size={18} weight="fill" /></span>
          <h2 style={{ ...s.title, flex: 1 }}>Inscriptions par semaine</h2>
          <span style={s.sub}>{plural(weekly.reduce((n, w) => n + w.count, 0), 'compte')} sur 8 semaines</span>
        </header>
        <Weekly weeks={weekly} />
      </section>

      {/* Membres à réveiller */}
      <div style={s.grid2}>
        <WakeList
          title="Ils utilisent l'app, en gratuit"
          desc="Logement, réservation ou contrat saisi : le bon moment pour leur parler du Standard."
          list={toWake.actif}
          kind="actif"
        />
        <WakeList
          title="Inscrits sans logement"
          desc="Ils n'ont pas encore commencé. Un mot de ta part suffit souvent : propose de les aider à démarrer."
          list={toWake.inactif}
          kind="inactif"
        />
      </div>
    </div>
  )
}

function Chip({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '6px 11px', borderRadius: 10, background: tint(color, 10), border: `1px solid ${tint(color, 28)}`, fontSize: 13, color: 'var(--text-2)' }}>
      <strong style={{ fontSize: 15, color }}>{n}</strong> {label}
    </span>
  )
}

function Funnel({ steps }: { steps: Array<{ label: string; n: number }> }) {
  const max = Math.max(1, steps[0]?.n ?? 1)
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((st, i) => {
        const prev = i > 0 ? steps[i - 1].n : null
        const rate = prev ? Math.round((st.n / prev) * 100) : null
        return (
          <li key={st.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)' }}>{st.label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>
                {st.n}{rate !== null && <span style={{ fontWeight: 500, color: 'var(--text-3)' }}> · {rate} %</span>}
              </span>
            </span>
            <div style={s.bar}><div style={{ ...s.barFill, width: `${Math.round((st.n / max) * 100)}%`, opacity: 1 - i * 0.12 }} /></div>
          </li>
        )
      })}
    </ol>
  )
}

function Weekly({ weeks }: { weeks: Array<{ week: string; count: number }> }) {
  const max = Math.max(1, ...weeks.map(w => w.count))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`, gap: 8, alignItems: 'end', height: 150 }}>
      {weeks.map((w, i) => (
        <div key={w.week} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: w.count ? 'var(--text)' : 'var(--text-3)' }}>{w.count}</span>
          <div style={{ width: '100%', maxWidth: 46, height: `${Math.max(4, Math.round((w.count / max) * 100))}px`, borderRadius: 6, background: i === weeks.length - 1 ? 'var(--accent-text)' : tint('var(--accent-text)', 40) }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {/* jour/mois : tient sous chaque barre, même sur téléphone */}
            {`${Number(w.week.slice(8, 10))}/${w.week.slice(5, 7)}`}
          </span>
        </div>
      ))}
    </div>
  )
}

function WakeList({ title, desc, list, kind }: { title: string; desc: string; list: MemberActivity[]; kind: 'actif' | 'inactif' }) {
  const shown = list.slice(0, SHOWN)
  const rest = list.slice(SHOWN)
  return (
    <section style={s.card}>
      <header style={s.head}>
        <span style={{ ...s.icon, background: tint(kind === 'actif' ? 'var(--accent-text)' : AMBER, 14), color: kind === 'actif' ? 'var(--accent-text)' : AMBER }}>
          <EnvelopeSimple size={18} weight="fill" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={s.title}>{title}</h2>
          <p style={s.sub}>{desc}</p>
        </div>
        <strong style={{ fontSize: 20, fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, color: 'var(--text)' }}>{list.length}</strong>
      </header>
      {list.length === 0 ? (
        <p style={s.text}>Personne pour l&apos;instant.</p>
      ) : (
        <>
          <ul style={s.list}>{shown.map(m => <WakeRow key={m.id} m={m} kind={kind} />)}</ul>
          {rest.length > 0 && (
            <details>
              <summary style={s.more}>Voir les {rest.length} autres</summary>
              <ul style={s.list}>{rest.map(m => <WakeRow key={m.id} m={m} kind={kind} />)}</ul>
            </details>
          )}
          <p style={s.sub}>« Écrire » ouvre un e-mail prêt dans ta messagerie : relis-le et envoie-le toi-même.</p>
        </>
      )}
    </section>
  )
}

function WakeRow({ m, kind }: { m: MemberActivity; kind: 'actif' | 'inactif' }) {
  const mail = wakeUpMailto(m, kind)
  const seen = dateFr(m.lastSignInAt)
  const facts = kind === 'actif'
    ? [m.logements && plural(m.logements, 'logement'), m.sejours && plural(m.sejours, 'séjour'), m.contracts && plural(m.contracts, 'contrat')].filter(Boolean).join(' · ')
    : null
  return (
    <li style={s.row}>
      <UserCircle size={22} weight="duotone" color="var(--text-3)" style={{ flexShrink: 0 }} />
      <span style={{ flex: '1 1 160px', minWidth: 0 }}>
        <span style={s.rowName}>{m.fullName || m.email || 'Sans nom'}</span>
        <span style={s.rowDetail}>
          Inscrit le {dateFr(m.createdAt)}{seen ? ` · vu le ${seen}` : ''}{facts ? ` · ${facts}` : ''}
        </span>
      </span>
      <span style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
        {mail && <a href={mail} style={s.btnPrimary}><EnvelopeSimple size={13} weight="bold" /> Écrire</a>}
        <Link href={`/dashboard/admin/membres/${m.id}`} style={s.btn}>Fiche</Link>
      </span>
    </li>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 16, alignItems: 'start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  text: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  note: { display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: '-6px 0 0', lineHeight: 1.5 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  bar: { height: 8, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, background: 'var(--accent-text)' },
  asideLabel: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  asideBig: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 28, color: 'var(--text)', lineHeight: 1.15 },
  proBlock: { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' },
  pipeline: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 6 },
  pipeStep: { display: 'flex', flexDirection: 'column', gap: 1, padding: '6px 8px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  action: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' },
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 2px', borderBottom: '1px solid var(--border)' },
  rowName: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' },
  rowDetail: { display: 'block', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none' },
  btn: { display: 'inline-flex', alignItems: 'center', padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  more: { cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', padding: '10px 2px' },
}
