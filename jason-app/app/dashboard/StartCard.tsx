import Link from 'next/link'
import { Check, ArrowRight } from '@phosphor-icons/react/dist/ssr'

// Carte « Démarrage » de l'Accueil (19/11/2026, maquette validée par Jason) :
// 3 étapes au lieu de la liste de 7 et du parcours flottant de 7 thèmes
// (0 terminé, 32 fermés). Chaque étape se coche toute seule ; la carte
// disparaît quand la première réservation apparaît. Le reste (contrat,
// ménage, prix, objectif) devient facultatif : « Pour aller plus loin ».

export interface StartExtra { key: string; label: string; href: string }

export default function StartCard({ hasLogement, logementNom, hasCalendar, hasReservation, extras }: {
  hasLogement: boolean
  logementNom: string | null
  hasCalendar: boolean
  hasReservation: boolean
  extras: StartExtra[]
}) {
  const steps = [
    {
      key: 'logement', done: hasLogement,
      label: 'Ajoute ton logement',
      sub: hasLogement ? (logementNom ?? 'Logement ajouté') : 'Son nom et son adresse : tous les outils se préremplissent ensuite',
      cta: { label: 'Ajouter', href: '/dashboard/logements' },
    },
    {
      key: 'calendrier', done: hasCalendar || hasReservation,
      label: 'Connecte ton calendrier Airbnb ou Booking',
      sub: 'Tes réservations, le planning ménage et tes revenus se remplissent tout seuls',
      cta: { label: 'Connecter', href: '/dashboard/logements' },
    },
    {
      key: 'regarder', done: hasReservation,
      label: 'Regarde ce qui arrive',
      sub: 'Tes prochaines arrivées, les ménages à prévoir, ce qu’il te reste à déclarer : ici, dès ta première réservation',
      cta: null,
    },
  ]
  const doneCount = steps.filter(s => s.done).length
  const current = steps.find(s => !s.done)?.key
  const left = 3 - doneCount

  return (
    <section style={s.card} aria-label="Démarrage">
      <span style={s.tag}>Démarrage · quelques minutes</span>
      <h2 style={s.title}>
        {left === 3 ? <>3 étapes et l’app <em style={s.em}>travaille pour toi</em></> : <>Encore {left} étape{left > 1 ? 's' : ''} et l’app <em style={s.em}>travaille pour toi</em></>}
      </h2>
      <div style={s.prog}>
        <span style={s.bar}><i style={{ ...s.barFill, width: `${(doneCount / 3) * 100}%` }} /></span>
        <span style={s.progTxt}>{doneCount} sur 3</span>
      </div>
      <ol style={s.steps}>
        {steps.map((st, i) => {
          const now = st.key === current
          return (
            <li key={st.key} style={{ ...s.step, border: now ? '1.5px solid var(--accent-text)' : '1px solid var(--border)' }}>
              <span style={{
                ...s.num,
                background: st.done ? 'var(--accent-text)' : 'transparent',
                color: st.done ? 'var(--bg)' : now ? 'var(--accent-text)' : 'var(--text-3)',
                border: st.done || now ? '1.5px solid var(--accent-text)' : '1.5px solid var(--border-2)',
              }}>
                {st.done ? <Check size={14} weight="bold" /> : i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ ...s.stepLabel, color: st.done ? 'var(--text-3)' : 'var(--text)', textDecoration: st.done ? 'line-through' : 'none' }}>{st.label}</strong>
                <span style={s.stepSub}>{st.sub}</span>
              </span>
              {now && st.cta && (
                <Link href={st.cta.href} style={s.cta}>{st.cta.label} <ArrowRight size={13} weight="bold" /></Link>
              )}
            </li>
          )
        })}
      </ol>
      {extras.length > 0 && (
        <div style={s.extras}>
          <span style={s.extrasTitle}>Pour aller plus loin, quand tu veux</span>
          <span style={s.extrasList}>
            {extras.map(x => <Link key={x.key} href={x.href} style={s.extra}>{x.label}</Link>)}
          </span>
        </div>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: 'clamp(18px, 2.5vw, 26px)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 },
  tag: { fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(22px, 2.6vw, 28px)', lineHeight: 1.2, margin: '4px 0 0', color: 'var(--text)' },
  em: { color: 'var(--accent-text)', fontStyle: 'italic' },
  prog: { display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' },
  bar: { flex: 1, height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', display: 'block' },
  barFill: { display: 'block', height: '100%', background: 'var(--accent-text)', borderRadius: 99, transition: 'width .3s' },
  progTxt: { fontSize: 12.5, color: 'var(--text-3)', whiteSpace: 'nowrap' },
  steps: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  step: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', borderRadius: 14, padding: '12px 14px', flexWrap: 'wrap' },
  num: { width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  stepLabel: { display: 'block', fontSize: 14.5, fontWeight: 600 },
  stepSub: { display: 'block', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45 },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 'auto' },
  extras: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', marginTop: 12 },
  extrasTitle: { fontSize: 12.5, color: 'var(--text-3)' },
  extrasList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  extra: { fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none', padding: '4px 10px', borderRadius: 99, border: '1px solid var(--accent-border)', background: 'var(--surface)' },
}
