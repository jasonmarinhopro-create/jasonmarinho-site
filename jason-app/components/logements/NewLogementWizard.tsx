'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, ArrowRight, ArrowLeft, Minus, Plus } from '@phosphor-icons/react/dist/ssr'
import { createLogement, type LogementData } from '@/app/dashboard/logements/actions'
import { COUNTRIES, ACTIVE_COUNTRIES, type CountryCode } from '@/lib/countries'

/**
 * Création d'un logement en 3 écrans (19/11/2026, maquette validée par Jason :
 * « un énorme formulaire horrible, reprendre le principe des pros »).
 * 1. Nom, type, adresse, pays  2. Capacité  3. Calendriers (on peut passer).
 * Le reste (accès, tarifs, règles, contrat…) se complète ensuite dans la fiche
 * du logement, ouverte juste après la création. Même action createLogement
 * qu'avant : mêmes champs en base, liens iCal synchronisés à la création.
 */
export default function NewLogementWizard({ base, typeLabels, onClose }: {
  base: LogementData
  typeLabels: Record<string, string>
  onClose: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [f, setF] = useState<LogementData>({ ...base, capacite_max: base.capacite_max > 1 ? base.capacite_max : 2, nb_chambres: base.nb_chambres ?? 1, nb_lits: base.nb_lits ?? 1, nb_sdb: base.nb_sdb ?? 1 })
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  const set = <K extends keyof LogementData>(k: K, v: LogementData[K]) => setF(prev => ({ ...prev, [k]: v }))

  function next() {
    setError('')
    if (step === 0) {
      if (!f.nom.trim()) { setError('Donne un nom à ton logement.'); return }
      if (!f.adresse.trim()) { setError('Indique son adresse.'); return }
    }
    if (step === 1 && f.capacite_max < 1) { setError('Au moins 1 personne.'); return }
    setStep(s => s + 1)
  }

  function create(withCalendars: boolean) {
    setError('')
    const icals = ['ical_airbnb', 'ical_booking', 'ical_vrbo', 'ical_autre'] as const
    const data: LogementData = { ...f }
    for (const k of icals) {
      const v = (withCalendars ? (f[k] ?? '') : '').trim()
      if (v && !/^https?:\/\//i.test(v)) { setError('Un lien de calendrier doit commencer par https://'); return }
      data[k] = v || null
    }
    start(async () => {
      const res = await createLogement(data)
      if (res.error || !res.id) { setError(res.error ?? 'Création impossible pour le moment.'); return }
      router.push(`/dashboard/logements/${res.id}`)
    })
  }

  const stepper = (label: string, k: 'capacite_max' | 'nb_chambres' | 'nb_lits' | 'nb_sdb', min: number) => {
    const v = (f[k] as number | null) ?? min
    return (
      <div style={s.stepRow}>
        <span style={{ fontSize: 14.5, color: 'var(--text)' }}>{label}</span>
        <span style={s.ctl}>
          <button type="button" aria-label={`${label} : moins`} disabled={v <= min} onClick={() => set(k, Math.max(min, v - 1) as never)} style={{ ...s.round, opacity: v <= min ? 0.4 : 1 }}><Minus size={14} weight="bold" /></button>
          <strong style={{ minWidth: 22, textAlign: 'center', fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{v}</strong>
          <button type="button" aria-label={`${label} : plus`} onClick={() => set(k, Math.min(50, v + 1) as never)} style={s.round}><Plus size={14} weight="bold" /></button>
        </span>
      </div>
    )
  }

  const icalField = (label: string, k: 'ical_airbnb' | 'ical_booking' | 'ical_vrbo' | 'ical_autre', placeholder: string) => (
    <label style={s.fld}>
      <span style={s.lbl}>{label}</span>
      <input style={s.input} type="url" inputMode="url" value={f[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder={placeholder} />
    </label>
  )

  return (
    <div style={s.overlay} onClick={() => { if (!pending) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label="Nouveau logement" style={s.box} onClick={e => e.stopPropagation()}>
        <div style={s.top}>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Nouveau logement · étape {step + 1} sur 3</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', gap: 5 }} aria-hidden="true">
              {[0, 1, 2].map(i => <i key={i} style={{ width: 22, height: 5, borderRadius: 9, background: i <= step ? 'var(--accent-text)' : 'var(--border)' }} />)}
            </span>
            <button type="button" onClick={onClose} aria-label="Fermer" style={s.close} disabled={pending}><X size={17} /></button>
          </span>
        </div>

        {step === 0 && (
          <div style={s.body}>
            <h2 style={s.q}>Comment s’appelle <em style={s.em}>ton logement</em>{'\u00a0'}?</h2>
            <label style={s.fld}>
              <span style={s.lbl}>Nom</span>
              <input style={s.input} autoFocus value={f.nom} onChange={e => set('nom', e.target.value)} placeholder="Villa les Pins, Appartement Paris 11…" />
            </label>
            <div style={s.fld}>
              <span style={s.lbl}>Type</span>
              <div style={s.tiles}>
                {Object.entries(typeLabels).map(([key, lbl]) => {
                  const on = f.type_logement === key
                  return (
                    <button key={key} type="button" onClick={() => set('type_logement', key as LogementData['type_logement'])} aria-pressed={on}
                      style={{ ...s.tile, border: on ? '1.5px solid var(--accent-text)' : '1px solid var(--border)', background: on ? 'var(--accent-bg)' : 'var(--surface)', color: on ? 'var(--accent-text)' : 'var(--text-2)' }}>
                      {lbl}
                    </button>
                  )
                })}
              </div>
            </div>
            <label style={s.fld}>
              <span style={s.lbl}>Adresse</span>
              <input style={s.input} value={f.adresse} onChange={e => set('adresse', e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" autoComplete="street-address" />
            </label>
            {ACTIVE_COUNTRIES.length > 1 && (
              <div style={s.fld}>
                <span style={s.lbl}>Pays</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ACTIVE_COUNTRIES.map((code: CountryCode) => {
                    const on = (f.pays ?? 'FR') === code
                    return (
                      <button key={code} type="button" onClick={() => set('pays', code)} aria-pressed={on}
                        style={{ ...s.chip, border: on ? '1.5px solid var(--accent-text)' : '1px solid var(--border)', background: on ? 'var(--accent-bg)' : 'var(--surface)', color: on ? 'var(--accent-text)' : 'var(--text-2)' }}>
                        {COUNTRIES[code].name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div style={s.body}>
            <h2 style={s.q}>Combien de <em style={s.em}>voyageurs</em> peut-il{'\u00a0'}accueillir{'\u00a0'}?</h2>
            {stepper('Personnes', 'capacite_max', 1)}
            {stepper('Chambres', 'nb_chambres', 0)}
            {stepper('Lits', 'nb_lits', 0)}
            {stepper('Salles de bain', 'nb_sdb', 0)}
          </div>
        )}

        {step === 2 && (
          <div style={s.body}>
            <h2 style={s.q}>Connecte ton <em style={s.em}>calendrier</em></h2>
            <p style={s.cap}>Tes réservations arrivent toutes seules, et les ménages se planifient. Colle le lien d’export de chaque plateforme.</p>
            {icalField('Lien du calendrier Airbnb', 'ical_airbnb', 'https://www.airbnb.fr/calendar/ical/…')}
            {icalField('Lien du calendrier Booking.com', 'ical_booking', 'https://ical.booking.com/v1/…')}
            {more ? (
              <>
                {icalField('Lien du calendrier Vrbo / Abritel', 'ical_vrbo', 'https://www.vrbo.com/icalendar/…')}
                {icalField('Lien d’une autre plateforme', 'ical_autre', 'https://…')}
              </>
            ) : (
              <button type="button" onClick={() => setMore(true)} style={s.textBtn}>+ Vrbo / Abritel ou une autre plateforme</button>
            )}
            <p style={s.help}>
              <strong>Où le trouver ?</strong> Airbnb : Calendrier, ton annonce, Disponibilités, Synchroniser les calendriers, Exporter le calendrier. Booking.com : extranet, Tarifs et disponibilités, Synchroniser les calendriers, Exporter.{' '}
              <Link href="/dashboard/aide/logements-voyageurs/synchroniser-airbnb-ical" target="_blank" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Le guide pas à pas</Link>
            </p>
          </div>
        )}

        {error && <p role="alert" style={s.error}>{error}</p>}

        <div style={s.foot}>
          {step === 0
            ? <span />
            : <button type="button" onClick={() => { setError(''); setStep(st => st - 1) }} disabled={pending} style={s.back}><ArrowLeft size={14} weight="bold" /> Retour</button>}
          {step < 2 ? (
            <button type="button" onClick={next} style={s.primary}>Continuer <ArrowRight size={14} weight="bold" /></button>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => create(false)} disabled={pending} style={{ ...s.textBtn, alignSelf: 'center' }}>Plus tard</button>
              <button type="button" onClick={() => create(true)} disabled={pending} style={{ ...s.primary, opacity: pending ? 0.7 : 1 }}>{pending ? 'Création…' : 'Créer le logement'}</button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  box: { width: '100%', maxWidth: 520, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: 'var(--floating-surface)', border: '1px solid var(--floating-border)', borderRadius: 20, padding: 'clamp(18px, 3vw, 26px)', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  close: { width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  body: { display: 'flex', flexDirection: 'column', gap: 14 },
  q: { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 'clamp(22px, 3vw, 26px)', lineHeight: 1.2, margin: 0, color: 'var(--text)' },
  em: { color: 'var(--accent-text)', fontStyle: 'italic' },
  fld: { display: 'flex', flexDirection: 'column', gap: 6 },
  lbl: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' },
  input: { width: '100%', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 7 },
  tile: { padding: '10px 8px', borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  chip: { padding: '7px 13px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  stepRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' },
  ctl: { display: 'inline-flex', alignItems: 'center', gap: 12, color: 'var(--text)' },
  round: { width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  cap: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 },
  help: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.55 },
  textBtn: { background: 'none', border: 'none', padding: 0, color: 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3, alignSelf: 'flex-start' },
  error: { margin: 0, fontSize: 13, color: 'var(--danger)', fontWeight: 600 },
  foot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 4 },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  primary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
}
