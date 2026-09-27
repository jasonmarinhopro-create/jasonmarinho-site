'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Broom, CheckCircle, Circle, Copy, Check, Lightning, MapPin, Camera, UsersThree, FilePdf, Warning, LinkSimple,
} from '@phosphor-icons/react/dist/ssr'
import { setMenageDone, generateIcalToken } from '../actions'

export type HostMenageSlot = {
  id: string
  date: string
  startTime: string
  endTime: string
  logementName: string
  adresse: string | null
  notes: string | null
  sameDay: boolean
  voyageurSortant: string | null
  voyageurEntrant: string | null
  fraisMenage: number | null
  /** by = nom de l'équipe (null : coché par l'hôte lui-même) */
  done: { by: string | null; completionId: string | null; photos: number } | null
}

export type HostTeam = { name: string; active: boolean }

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function dayLabel(date: string, today: string) {
  if (date === today) return "Aujourd'hui"
  if (date === addDays(today, 1)) return 'Demain'
  if (date === addDays(today, -1)) return 'Hier'
  const s = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function MenageHostView({ slots, teams, icalToken, appUrl, today }: {
  slots: HostMenageSlot[]
  teams: HostTeam[]
  icalToken: string | null
  appUrl: string
  today: string
}) {
  // État « fait » optimiste (coché par l'hôte), rollback si erreur serveur.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [token, setToken] = useState(icalToken)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  const isDone = (s: HostMenageSlot) => overrides[s.id] ?? !!s.done

  // Hier : seulement les ménages restés « à faire » (oubli à vérifier).
  const visible = useMemo(
    () => slots.filter(s => s.date >= today || !s.done),
    [slots, today],
  )
  const groups = useMemo(() => {
    const m = new Map<string, HostMenageSlot[]>()
    for (const s of visible) {
      if (!m.has(s.date)) m.set(s.date, [])
      m.get(s.date)!.push(s)
    }
    return Array.from(m.entries())
  }, [visible])

  const weekEnd = addDays(today, 6)
  const todayCount = slots.filter(s => s.date === today).length
  const weekCount = slots.filter(s => s.date >= today && s.date <= weekEnd).length
  const tightCount = slots.filter(s => s.date >= today && s.date <= weekEnd && s.sameDay).length
  const activeTeams = teams.filter(t => t.active)

  const shareUrl = token ? `${appUrl}/api/calendar/menage-feed?token=${token}` : null

  function toggle(s: HostMenageSlot) {
    const next = !isDone(s)
    setError('')
    setOverrides(o => ({ ...o, [s.id]: next }))
    startTransition(async () => {
      const res = await setMenageDone({ date: s.date, logementName: s.logementName, done: next, startTime: s.startTime, endTime: s.endTime })
      if (!res.ok) {
        setOverrides(o => ({ ...o, [s.id]: !next }))
        setError(res.error)
      }
    })
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* presse-papiers indisponible */ }
  }

  function generate() {
    setError('')
    startTransition(async () => {
      const res = await generateIcalToken()
      if ('token' in res && res.token) setToken(res.token)
      else setError(('error' in res && res.error) || 'Impossible de générer le lien')
    })
  }

  return (
    <div style={s.page}>
      <div style={s.head}>
        <div>
          <h1 style={s.title}>Ménage</h1>
          <p style={s.desc}>
            Créés automatiquement à chaque départ (Airbnb, Booking, contrats, séjours saisis).
            Ton équipe voit le même planning et le marque « terminé » avec photos.
          </p>
        </div>
        <Link href="/dashboard/calendrier?menage=1" style={s.ghostBtn}>
          <FilePdf size={14} weight="bold" /> PDF, WhatsApp, horaires
        </Link>
      </div>

      {/* Grand écran : jours à gauche, compteurs + partage à droite (collant).
          En dessous de 1200 px : une seule colonne, compteurs en tête. */}
      <div className="mh-layout">
        <aside className="mh-side">
          <div style={s.kpis} className="mh-kpis">
            <Kpi label="Aujourd'hui" value={todayCount} />
            <Kpi label="7 prochains jours" value={weekCount} />
            <Kpi label="Arrivée le jour même" value={tightCount} warn={tightCount > 0} />
          </div>

          {/* Partage avec l'équipe */}
          <div style={s.share}>
            <span style={s.shareIcon}><UsersThree size={18} weight="duotone" /></span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={s.shareTitle}>
                {activeTeams.length > 0
                  ? `${activeTeams.map(t => t.name).join(', ')} ${activeTeams.length > 1 ? 'suivent' : 'suit'} ce planning`
                  : 'Partage ce planning avec ton équipe de ménage'}
              </div>
              <div style={s.shareSub}>
                {shareUrl
                  ? "Envoie ce lien : elle l'ajoute à son agenda ou le colle dans son espace Jason Marinho (gratuit) pour cocher « terminé » et t'envoyer les photos."
                  : 'Un lien privé, sans compte partagé. Tu peux le régénérer à tout moment pour couper l’accès.'}
              </div>
            </div>
            {shareUrl ? (
              <button type="button" onClick={copyLink} style={s.primaryBtn}>
                {copied ? <><Check size={14} weight="bold" /> Lien copié</> : <><Copy size={14} weight="bold" /> Copier le lien</>}
              </button>
            ) : (
              <button type="button" onClick={generate} style={s.primaryBtn}>
                <LinkSimple size={14} weight="bold" /> Générer le lien
              </button>
            )}
          </div>
        </aside>

        <div className="mh-main">
          {error && <p style={s.error}>{error}</p>}

          {groups.length === 0 ? (
            <div style={s.empty}>
              <Broom size={28} weight="duotone" color="var(--accent-text)" />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Aucun ménage dans les 2 prochaines semaines</div>
              <div>
                Les ménages apparaissent ici dès qu&apos;un départ est prévu. Connecte ton calendrier Airbnb ou Booking
                dans le <Link href="/dashboard/calendrier" style={s.link}>Calendrier</Link> pour qu&apos;ils se créent tout seuls.
              </div>
            </div>
          ) : (
            <div style={s.days}>
              {groups.map(([date, list]) => (
                <section key={date}>
                  <h2 style={{ ...s.dayTitle, ...(date === today ? { color: 'var(--accent-text)' } : {}) }}>
                    {dayLabel(date, today)} <span style={s.dayCount}>{list.length}</span>
                  </h2>
                  <div style={s.list}>
                    {list.map(slot => {
                      const done = isDone(slot)
                      const late = !done && slot.date < today
                      return (
                        <div key={slot.id} style={{ ...s.card, ...(done ? s.cardDone : {}), ...(late ? s.cardLate : {}) }}>
                          <div style={s.time}>
                            <strong>{slot.startTime}</strong>
                            <span>{slot.endTime}</span>
                          </div>
                          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                            <div style={s.name}>
                              {slot.logementName}
                              {slot.sameDay && (
                                <span style={s.badgeTight}><Lightning size={11} weight="fill" /> Arrivée le jour même</span>
                              )}
                              {late && <span style={s.badgeLate}><Warning size={11} weight="fill" /> Pas marqué fait</span>}
                            </div>
                            <div style={s.meta}>
                              {slot.voyageurSortant && <span>Départ : {slot.voyageurSortant}</span>}
                              {slot.voyageurEntrant && <span>Arrivée : {slot.voyageurEntrant}</span>}
                              {slot.adresse && (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(slot.adresse)}`} target="_blank" rel="noopener noreferrer" style={s.metaLink}>
                                  <MapPin size={11} weight="fill" /> {slot.adresse}
                                </a>
                              )}
                            </div>
                            {slot.notes && <div style={s.notes}>{slot.notes}</div>}
                          </div>
                          <div style={s.actions}>
                            {slot.done?.completionId && overrides[slot.id] !== false ? (
                              <Link href={`/dashboard/menages/${slot.done.completionId}`} style={s.doneTeam}>
                                <CheckCircle size={14} weight="fill" />
                                Fait par {slot.done.by}
                                {slot.done.photos > 0 && <span style={s.photos}><Camera size={12} weight="fill" /> {slot.done.photos}</span>}
                              </Link>
                            ) : (
                              <button type="button" onClick={() => toggle(slot)} style={done ? s.doneBtn : s.todoBtn} aria-pressed={done}>
                                {done ? <CheckCircle size={14} weight="fill" /> : <Circle size={14} weight="bold" />}
                                {done ? 'Fait' : 'Marquer fait'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .mh-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 28px; }
        .mh-side { order: 0; }
        .mh-main { order: 1; min-width: 0; }
        @media (min-width: 1200px) {
          .mh-layout { grid-template-columns: minmax(0, 1fr) 360px; align-items: start; }
          .mh-side { order: 1; position: sticky; top: calc(var(--header-h, 64px) + 16px); }
          .mh-main { order: 0; }
          .mh-side .mh-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </div>
  )
}

function Kpi({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div style={s.kpi}>
      <div style={{ ...s.kpiValue, color: warn ? '#d97706' : 'var(--text)' }}>{value}</div>
      <div style={s.kpiLabel}>{label}</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,40px)', width: '100%' },
  head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  desc: { fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.6, maxWidth: 640 },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
    fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 6,
  },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 },
  kpi: { padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 },
  kpiValue: { fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', lineHeight: 1.1 },
  kpiLabel: { fontSize: 12, color: 'var(--text-3)', marginTop: 2 },
  share: {
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 16px', marginBottom: 22,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 14,
  },
  shareIcon: {
    width: 36, height: 36, borderRadius: 10, background: 'var(--surface)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  shareTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  shareSub: { fontSize: 12.5, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.5 },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  error: { fontSize: 13, color: 'var(--danger)', margin: '-10px 0 16px' },
  days: { display: 'flex', flexDirection: 'column', gap: 22 },
  dayTitle: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-2)',
    textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px',
  },
  dayCount: {
    fontSize: 11, minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'var(--surface)',
    border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '12px 14px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
  },
  cardDone: { opacity: 0.75 },
  cardLate: { borderColor: 'rgba(217,119,6,0.45)' },
  time: { display: 'flex', flexDirection: 'column', minWidth: 52, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.35 },
  name: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14.5, fontWeight: 600, color: 'var(--text)' },
  badgeTight: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
    fontSize: 11, fontWeight: 600, color: '#d97706', background: 'rgba(217,119,6,0.12)',
  },
  badgeLate: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
    fontSize: 11, fontWeight: 600, color: 'var(--danger)', background: 'rgba(220,38,38,0.10)',
  },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 },
  metaLink: { display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-3)', textDecoration: 'none' },
  notes: { fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' },
  actions: { display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  todoBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)',
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  doneBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9,
    border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.10)', color: '#10b981',
    fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  doneTeam: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9,
    border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.10)', color: '#10b981',
    fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
  },
  photos: { display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 4, fontWeight: 600 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', padding: '36px 20px',
    background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 14, fontSize: 13.5, color: 'var(--text-3)',
  },
  link: { color: 'var(--accent-text)' },
}
