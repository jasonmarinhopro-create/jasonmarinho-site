'use client'

// Check-in en ligne public (inspiré Partee) : le voyageur remplit lui-même
// son identité avant l'arrivée. Mobile-first, FR/EN, aucune auth requise —
// le token du lien fait office de clé.

import { useState, useEffect } from 'react'
import {
  IdentificationCard, CheckCircle, CalendarBlank, House,
  User, MapPin, Globe, PaperPlaneTilt, WarningCircle,
} from '@phosphor-icons/react/dist/ssr'
import Select from '@/components/ui/Select'
import { NATIONALITES } from '@/lib/nationalites'

interface SejourInfo {
  logement: string | null
  date_arrivee: string
  date_depart: string
}

export interface CheckinInitial {
  prenom: string
  nom: string
  email: string
  telephone: string
  date_naissance: string
  nationalite: string
  adresse: string
  code_postal: string
  ville: string
  pays: string
  id_type: string
  id_numero: string
  id_pays_emetteur: string
}

interface Props {
  token: string
  hostName: string | null
  sejour: SejourInfo | null
  alreadyCompletedAt: string | null
  initial: CheckinInitial
}

type Lang = 'fr' | 'en'

const T: Record<Lang, Record<string, string>> = {
  fr: {
    title: 'Check-in en ligne',
    intro: 'vous demande de compléter vos informations voyageur avant votre arrivée. Cela ne prend que 2 minutes et facilite votre accueil (et les déclarations obligatoires).',
    introNoHost: 'Merci de compléter vos informations voyageur avant votre arrivée. Cela ne prend que 2 minutes.',
    stay: 'Votre séjour',
    identity: 'Votre identité',
    firstName: 'Prénom',
    lastName: 'Nom',
    birthDate: 'Date de naissance',
    nationality: 'Nationalité',
    contact: 'Vos coordonnées',
    email: 'E-mail',
    phone: 'Téléphone',
    address: 'Adresse (résidence principale)',
    addressLine: 'Adresse',
    postalCode: 'Code postal',
    city: 'Ville',
    country: 'Pays',
    document: "Pièce d'identité",
    docNote: 'Requis dans certains pays pour la déclaration obligatoire des voyageurs (Portugal, Espagne…). Vos données ne sont utilisées que pour votre séjour.',
    docType: 'Type de document',
    docTypeCni: "Carte d'identité",
    docTypePasseport: 'Passeport',
    docTypePermis: 'Permis de conduire',
    docTypeAutre: 'Autre',
    docNumber: 'Numéro du document',
    docCountry: "Pays d'émission",
    consent: "J'accepte que ces informations soient transmises à mon hôte pour la gestion de mon séjour et les déclarations légales obligatoires.",
    submit: 'Envoyer mes informations',
    submitting: 'Envoi…',
    successTitle: 'Merci, tout est bon !',
    successBody: 'Vos informations ont bien été transmises. Bon séjour !',
    alreadyDone: 'Fiche déjà complétée le',
    alreadyDoneEdit: 'Vous pouvez corriger vos informations ci-dessous si besoin.',
    required: 'Ce champ est requis',
    errConsent: 'Merci de cocher la case de consentement.',
    errGeneric: "Une erreur est survenue. Réessayez dans un instant.",
    select: 'Sélectionner…',
    nights: 'nuits',
    arrival: 'Arrivée',
    departure: 'Départ',
  },
  en: {
    title: 'Online check-in',
    intro: 'asks you to complete your guest details before your arrival. It only takes 2 minutes and makes your welcome easier (and covers mandatory guest declarations).',
    introNoHost: 'Please complete your guest details before your arrival. It only takes 2 minutes.',
    stay: 'Your stay',
    identity: 'Your identity',
    firstName: 'First name',
    lastName: 'Last name',
    birthDate: 'Date of birth',
    nationality: 'Nationality',
    contact: 'Contact details',
    email: 'E-mail',
    phone: 'Phone',
    address: 'Address (main residence)',
    addressLine: 'Address',
    postalCode: 'Postal code',
    city: 'City',
    country: 'Country',
    document: 'Identity document',
    docNote: 'Required in some countries for the mandatory guest declaration (Portugal, Spain…). Your data is only used for your stay.',
    docType: 'Document type',
    docTypeCni: 'ID card',
    docTypePasseport: 'Passport',
    docTypePermis: 'Driving licence',
    docTypeAutre: 'Other',
    docNumber: 'Document number',
    docCountry: 'Issuing country',
    consent: 'I agree that this information is shared with my host for the management of my stay and mandatory legal declarations.',
    submit: 'Send my details',
    submitting: 'Sending…',
    successTitle: 'Thank you, all set!',
    successBody: 'Your details have been sent. Enjoy your stay!',
    alreadyDone: 'Form already completed on',
    alreadyDoneEdit: 'You can correct your details below if needed.',
    required: 'This field is required',
    errConsent: 'Please tick the consent box.',
    errGeneric: 'Something went wrong. Please try again shortly.',
    select: 'Select…',
    nights: 'nights',
    arrival: 'Arrival',
    departure: 'Departure',
  },
}

const NAT_OPTIONS = NATIONALITES.map(n => ({ value: n.code, label: n.name }))

function fmtDate(d: string, lang: Lang) {
  return new Date(d + 'T12:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function nights(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

export default function CheckinForm({ token, hostName, sejour, alreadyCompletedAt, initial }: Props) {
  const [lang, setLang] = useState<Lang>('fr')
  const [form, setForm] = useState<CheckinInitial>(initial)
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  // Auto-détection langue navigateur (une seule fois, modifiable via toggle)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.language?.toLowerCase().startsWith('fr')) {
      setLang('en')
    }
  }, [])

  const t = T[lang]
  const set = (k: keyof CheckinInitial, v: string) => setForm(f => ({ ...f, [k]: v }))

  const missing = (v: string) => touched && !v.trim()
  const requiredOk =
    form.prenom.trim() && form.nom.trim() && form.date_naissance.trim() &&
    form.nationalite.trim() && form.id_type.trim() && form.id_numero.trim()

  async function submit() {
    setTouched(true)
    setError('')
    if (!requiredOk) return
    if (!consent) { setError(t.errConsent); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        setError(typeof json.error === 'string' ? json.error : t.errGeneric)
        return
      }
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError(t.errGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', padding: '32px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <CheckCircle size={56} weight="fill" color="var(--success-1, #34d399)" />
            <h1 style={{ ...s.title, margin: 0 }}>{t.successTitle}</h1>
            <p style={s.introText}>{t.successBody}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headBadge}>
            <IdentificationCard size={13} weight="fill" />
            {t.title}
          </div>
          <div style={s.langToggle}>
            <button onClick={() => setLang('fr')} style={{ ...s.langBtn, ...(lang === 'fr' ? s.langBtnActive : {}) }}>FR</button>
            <button onClick={() => setLang('en')} style={{ ...s.langBtn, ...(lang === 'en' ? s.langBtnActive : {}) }}>EN</button>
          </div>
        </div>

        <p style={s.introText}>
          {hostName
            ? <><strong style={{ color: 'var(--text)' }}>{hostName}</strong> {t.intro}</>
            : t.introNoHost}
        </p>

        {alreadyCompletedAt && (
          <div style={s.alreadyBanner}>
            <CheckCircle size={15} weight="fill" />
            <span>
              {t.alreadyDone} {fmtDate(alreadyCompletedAt.slice(0, 10), lang)}. {t.alreadyDoneEdit}
            </span>
          </div>
        )}

        {/* Séjour */}
        {sejour && (
          <div style={s.stayCard}>
            <div style={s.sectionLabel}><CalendarBlank size={13} weight="fill" /> {t.stay}</div>
            <div style={s.stayRow}>
              {sejour.logement && (
                <span style={s.stayItem}><House size={13} /> {sejour.logement}</span>
              )}
              <span style={s.stayItem}>
                {t.arrival} : <strong>{fmtDate(sejour.date_arrivee, lang)}</strong>
              </span>
              <span style={s.stayItem}>
                {t.departure} : <strong>{fmtDate(sejour.date_depart, lang)}</strong>
              </span>
              <span style={{ ...s.stayItem, color: 'var(--text-muted)' }}>
                {nights(sejour.date_arrivee, sejour.date_depart)} {t.nights}
              </span>
            </div>
          </div>
        )}

        {/* Identité */}
        <div style={s.section}>
          <div style={s.sectionLabel}><User size={13} weight="fill" /> {t.identity}</div>
          <div style={s.row2} className="ck-row">
            <Field label={t.firstName} required value={form.prenom} onChange={v => set('prenom', v)} invalid={missing(form.prenom)} msg={t.required} />
            <Field label={t.lastName} required value={form.nom} onChange={v => set('nom', v)} invalid={missing(form.nom)} msg={t.required} />
          </div>
          <div style={s.row2} className="ck-row">
            <Field label={t.birthDate} required type="date" value={form.date_naissance} onChange={v => set('date_naissance', v)} invalid={missing(form.date_naissance)} msg={t.required} />
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>{t.nationality} *</label>
              <Select
                value={form.nationalite}
                onChange={v => set('nationalite', v)}
                options={NAT_OPTIONS}
                placeholder={t.select}
                ariaLabel={t.nationality}
                triggerStyle={{ ...s.input, ...(missing(form.nationalite) ? s.inputInvalid : {}) }}
              />
              {missing(form.nationalite) && <span style={s.errMsg}>{t.required}</span>}
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div style={s.section}>
          <div style={s.sectionLabel}><Globe size={13} weight="fill" /> {t.contact}</div>
          <div style={s.row2} className="ck-row">
            <Field label={t.email} type="email" value={form.email} onChange={v => set('email', v)} />
            <Field label={t.phone} type="tel" value={form.telephone} onChange={v => set('telephone', v)} />
          </div>
        </div>

        {/* Adresse */}
        <div style={s.section}>
          <div style={s.sectionLabel}><MapPin size={13} weight="fill" /> {t.address}</div>
          <Field label={t.addressLine} value={form.adresse} onChange={v => set('adresse', v)} />
          <div style={s.row3} className="ck-row">
            <Field label={t.postalCode} value={form.code_postal} onChange={v => set('code_postal', v)} />
            <Field label={t.city} value={form.ville} onChange={v => set('ville', v)} />
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>{t.country}</label>
              <Select
                value={form.pays}
                onChange={v => set('pays', v)}
                options={NAT_OPTIONS}
                placeholder={t.select}
                ariaLabel={t.country}
                triggerStyle={s.input}
              />
            </div>
          </div>
        </div>

        {/* Document */}
        <div style={s.section}>
          <div style={s.sectionLabel}><IdentificationCard size={13} weight="fill" /> {t.document}</div>
          <p style={s.note}>{t.docNote}</p>
          <div style={s.row3} className="ck-row">
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>{t.docType} *</label>
              <Select
                value={form.id_type}
                onChange={v => set('id_type', v)}
                options={[
                  { value: 'cni', label: t.docTypeCni },
                  { value: 'passeport', label: t.docTypePasseport },
                  { value: 'permis', label: t.docTypePermis },
                  { value: 'autre', label: t.docTypeAutre },
                ]}
                placeholder={t.select}
                ariaLabel={t.docType}
                triggerStyle={{ ...s.input, ...(missing(form.id_type) ? s.inputInvalid : {}) }}
              />
              {missing(form.id_type) && <span style={s.errMsg}>{t.required}</span>}
            </div>
            <Field label={t.docNumber} required value={form.id_numero} onChange={v => set('id_numero', v)} invalid={missing(form.id_numero)} msg={t.required} />
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>{t.docCountry}</label>
              <Select
                value={form.id_pays_emetteur}
                onChange={v => set('id_pays_emetteur', v)}
                options={NAT_OPTIONS}
                placeholder={t.select}
                ariaLabel={t.docCountry}
                triggerStyle={s.input}
              />
            </div>
          </div>
        </div>

        {/* Consentement + submit */}
        <label style={s.consentRow}>
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            style={{ marginTop: '3px', accentColor: 'var(--accent-text)' }}
          />
          <span style={s.consentText}>{t.consent}</span>
        </label>

        {error && (
          <div style={s.errorBanner}>
            <WarningCircle size={15} weight="fill" />
            {error}
          </div>
        )}

        <button onClick={submit} disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}>
          <PaperPlaneTilt size={16} weight="fill" />
          {submitting ? t.submitting : t.submit}
        </button>
      </div>
      <Footer />
      <style>{`
        @media (max-width: 560px) {
          .ck-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, invalid = false, msg }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  invalid?: boolean
  msg?: string
}) {
  return (
    <div style={s.fieldWrap}>
      <label style={s.fieldLabel}>{label}{required ? ' *' : ''}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...s.input, ...(invalid ? s.inputInvalid : {}) }}
      />
      {invalid && msg && <span style={s.errMsg}>{msg}</span>}
    </div>
  )
}

function Footer() {
  return (
    <p style={s.footer}>
      Check-in sécurisé · <a href="https://jasonmarinho.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>jasonmarinho.com</a>
    </p>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100svh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'clamp(16px, 4vw, 40px) clamp(12px, 3vw, 24px)',
    gap: '16px',
  },
  card: {
    width: '100%',
    maxWidth: '640px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '18px',
    padding: 'clamp(18px, 4vw, 30px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  headBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px',
    padding: '5px 12px',
  },
  langToggle: { display: 'flex', gap: '4px' },
  langBtn: {
    padding: '5px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-2)',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  langBtnActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px, 4vw, 28px)',
    fontWeight: 400,
    color: 'var(--text)',
  },
  introText: {
    fontSize: '14px',
    color: 'var(--text-2)',
    lineHeight: 1.6,
    margin: 0,
  },
  alreadyBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12.5px',
    color: 'var(--success-1, #34d399)',
    background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: '10px',
    padding: '10px 12px',
    lineHeight: 1.5,
  },
  stayCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  stayRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px 16px',
  },
  stayItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '13px',
    color: 'var(--text-2)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
  },
  note: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.5,
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 },
  fieldLabel: { fontSize: '12px', fontWeight: 500, color: 'var(--text-3)' },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    color: 'var(--text)',
    fontFamily: 'var(--font-outfit), sans-serif',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  inputInvalid: { borderColor: 'var(--danger, #dc2626)' },
  errMsg: { fontSize: '11px', color: 'var(--danger, #dc2626)' },
  consentRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
  },
  consentText: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55 },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--danger, #dc2626)',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '13px 20px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#0B1D0F',
    background: 'var(--accent-text, #FFD56B)',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  footer: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    margin: 0,
  },
}
