'use client'

// Check-in en ligne public (inspiré Partee) : le voyageur remplit lui-même
// son identité avant l'arrivée. Mobile-first, FR/EN, aucune auth requise —
// le token du lien fait office de clé.

import { useState, useEffect, useRef } from 'react'
import {
  IdentificationCard, CheckCircle, CalendarBlank, House,
  User, MapPin, Globe, PaperPlaneTilt, WarningCircle,
  Signature, Eraser, UsersThree, Plus, Trash,
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
  lieu_naissance: string
  nationalite: string
  adresse: string
  code_postal: string
  ville: string
  pays: string
  id_type: string
  id_numero: string
  id_pays_emetteur: string
}

export interface Companion {
  prenom: string
  nom: string
  date_naissance: string
  lieu_naissance: string
  nationalite: string
  id_type: string
  id_numero: string
  id_pays_emetteur: string
}

const EMPTY_COMPANION: Companion = {
  prenom: '', nom: '', date_naissance: '', lieu_naissance: '',
  nationalite: '', id_type: '', id_numero: '', id_pays_emetteur: '',
}

const MAX_COMPANIONS = 8

const CK_CSS = `
  @media (max-width: 560px) {
    .ck-row { grid-template-columns: 1fr !important; }
  }
  /* iOS Safari : input[type=date] a une largeur intrinsèque qui fait
     déborder la carte (grid blowout). appearance:none + min-width:0
     le force à respecter width:100%. text-align pour garder la valeur
     à gauche une fois l'apparence native retirée. */
  .ckin-page input[type="date"] {
    -webkit-appearance: none;
    appearance: none;
    min-width: 0;
    max-width: 100%;
    text-align: left;
    min-height: 42px;
  }
`

/** Âge à aujourd'hui — pour distinguer les moins de 15 ans (document facultatif) */
function ageOf(dateNaissance: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateNaissance)) return null
  const d = new Date(dateNaissance + 'T12:00:00')
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

interface Props {
  token: string
  hostName: string | null
  sejour: SejourInfo | null
  alreadyCompletedAt: string | null
  initial: CheckinInitial
  initialCompanions?: Companion[]
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
    birthPlace: 'Lieu de naissance',
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
    signature: 'Signature',
    signatureHint: 'Signez dans le cadre ci-dessous (au doigt ou à la souris) pour certifier l\'exactitude de vos informations.',
    signatureClear: 'Effacer',
    errSignature: 'Merci de signer dans le cadre.',
    companions: 'Autres voyageurs',
    companionsHint: 'La réglementation impose de déclarer CHAQUE voyageur (enfants compris). Ajoutez ici les personnes qui séjournent avec vous — ou partagez-leur ce lien : chacun peut s\'y ajouter lui-même.',
    companionN: 'Voyageur',
    addCompanion: 'Ajouter un voyageur',
    removeCompanion: 'Retirer',
    docOptionalChild: 'Document facultatif pour les moins de 15 ans — votre signature couvre la déclaration de cet enfant.',
    adultCompanionHint: 'Adulte : l\'idéal est qu\'il s\'ajoute lui-même en ouvrant ce lien (bouton « Je m\'ajoute au groupe ») pour signer sa propre fiche. Si vous l\'ajoutez ici, il signera à l\'arrivée.',
    shareTitle: 'Les autres voyageurs peuvent s\'ajouter',
    shareBody: 'Partagez ce lien : chaque adulte du groupe s\'y ajoute et signe sa propre fiche en 1 minute.',
    shareBtn: 'Partager le lien du groupe',
    shareCopied: 'Lien copié !',
    submit: 'Envoyer mes informations',
    submitting: 'Envoi…',
    successTitle: 'Merci, tout est bon !',
    successBody: 'Vos informations ont bien été transmises. Bon séjour !',
    successCompanion: 'Vos informations ont été ajoutées au groupe. Bon séjour !',
    notYou: 'Vous n\'êtes pas',
    notYouCta: 'Je m\'ajoute comme voyageur du groupe',
    companionModeTitle: 'Je m\'ajoute au groupe',
    companionModeHint: 'Remplissez votre identité : elle sera ajoutée au groupe de',
    backToMain: 'Revenir à la fiche principale',
    submitCompanion: 'M\'ajouter au groupe',
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
    birthPlace: 'Place of birth',
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
    signature: 'Signature',
    signatureHint: 'Sign in the frame below (finger or mouse) to certify that your details are accurate.',
    signatureClear: 'Clear',
    errSignature: 'Please sign in the frame.',
    companions: 'Other travellers',
    companionsHint: 'Regulations require EVERY traveller to be declared (children included). Add the people staying with you here — or share this link with them: each person can add themselves.',
    companionN: 'Traveller',
    addCompanion: 'Add a traveller',
    removeCompanion: 'Remove',
    docOptionalChild: 'Document optional for children under 15 — your signature covers this child\'s declaration.',
    adultCompanionHint: 'Adult: ideally they should add themselves by opening this link ("Add myself to the group") to sign their own form. If you add them here, they will sign on arrival.',
    shareTitle: 'Other travellers can add themselves',
    shareBody: 'Share this link: each adult in the group adds themselves and signs their own form in 1 minute.',
    shareBtn: 'Share the group link',
    shareCopied: 'Link copied!',
    submit: 'Send my details',
    submitting: 'Sending…',
    successTitle: 'Thank you, all set!',
    successBody: 'Your details have been sent. Enjoy your stay!',
    successCompanion: 'Your details have been added to the group. Enjoy your stay!',
    notYou: 'Not',
    notYouCta: 'Add myself as a traveller of this group',
    companionModeTitle: 'Add myself to the group',
    companionModeHint: 'Fill in your identity: it will be added to the group of',
    backToMain: 'Back to the main form',
    submitCompanion: 'Add me to the group',
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

export default function CheckinForm({ token, hostName, sejour, alreadyCompletedAt, initial, initialCompanions }: Props) {
  const [lang, setLang] = useState<Lang>('fr')
  const [form, setForm] = useState<CheckinInitial>(initial)
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  // Partage du lien de groupe depuis l'écran de succès
  const [shareCopied, setShareCopied] = useState(false)
  async function shareGroupLink() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) return
    // navigator.share : natif mobile (WhatsApp, SMS…) ; repli presse-papiers
    if (navigator.share) {
      try { await navigator.share({ url }); return } catch { /* annulé */ }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch { /* clipboard bloqué */ }
  }

  // Signature électronique (même mécanique que la page contrat /sign)
  const sigCanvasRef = useRef<HTMLCanvasElement>(null)
  const [hasSignature, setHasSignature] = useState(false)
  // Accompagnants — la réglementation impose de déclarer chaque voyageur
  // (SIBA : un boletim par personne, mineurs inclus ; FR : une fiche par
  // voyageur, enfants <15 ans sur la fiche d'un adulte).
  const [companions, setCompanions] = useState<Companion[]>(initialCompanions ?? [])
  // Mode « je m'ajoute au groupe » : le lien est partageable — un ami du
  // groupe l'ouvre et remplit SA fiche, ajoutée côté serveur sans toucher
  // à la fiche du voyageur principal (sinon il l'écraserait).
  const [mode, setMode] = useState<'main' | 'companion'>('main')
  const [selfC, setSelfC] = useState<Companion>({ ...EMPTY_COMPANION })
  const [selfConsent, setSelfConsent] = useState(false)
  const [companionDone, setCompanionDone] = useState(false)
  const setSelf = (k: keyof Companion, v: string) => setSelfC(c => ({ ...c, [k]: v }))
  // Signature de l'accompagnant qui s'ajoute lui-même (ref séparée : le
  // canvas du mode principal est démonté quand on bascule de mode).
  const selfSigCanvasRef = useRef<HTMLCanvasElement>(null)
  const [selfHasSignature, setSelfHasSignature] = useState(false)

  // Auto-détection langue navigateur (une seule fois, modifiable via toggle)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.language?.toLowerCase().startsWith('fr')) {
      setLang('en')
    }
  }, [])

  const t = T[lang]
  const set = (k: keyof CheckinInitial, v: string) => setForm(f => ({ ...f, [k]: v }))

  const missing = (v: string) => touched && !v.trim()

  function setCompanion(i: number, k: keyof Companion, v: string) {
    setCompanions(prev => prev.map((c, idx) => idx === i ? { ...c, [k]: v } : c))
  }

  // Requis par accompagnant : identité toujours ; document + lieu de
  // naissance seulement à partir de 15 ans (les enfants figurent sur la
  // fiche de l'adulte en FR, et peuvent ne pas avoir de document).
  function companionOk(c: Companion): boolean {
    if (!c.prenom.trim() || !c.nom.trim() || !c.date_naissance.trim() || !c.nationalite.trim()) return false
    const age = ageOf(c.date_naissance)
    if (age !== null && age >= 15) {
      if (!c.lieu_naissance.trim() || !c.id_type.trim() || !c.id_numero.trim()) return false
    }
    return true
  }

  // Ville requise : c'est le Local_Residencia_Origem du boletim SIBA — sans
  // elle l'envoi automatique à l'État ne peut pas partir.
  const requiredOk =
    form.prenom.trim() && form.nom.trim() && form.date_naissance.trim() &&
    form.lieu_naissance.trim() &&
    form.nationalite.trim() && form.id_type.trim() && form.id_numero.trim() &&
    form.ville.trim() &&
    companions.every(companionOk)

  async function submit() {
    setTouched(true)
    setError('')
    if (!requiredOk) return
    if (!hasSignature) { setError(t.errSignature); return }
    if (!consent) { setError(t.errConsent); return }

    // Export de la signature avec fond blanc (visible sur tous les fonds),
    // même mécanique que la page contrat.
    const canvas = sigCanvasRef.current
    if (!canvas || canvas.width === 0) { setError(t.errSignature); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { setError(t.errSignature); return }
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    const signatureImage = canvas.toDataURL('image/png')

    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form, signature_image: signatureImage, companions }),
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

  // Soumission du mode « je m'ajoute au groupe » : n'écrit QUE l'accompagnant.
  async function submitCompanionSelf() {
    setTouched(true)
    setError('')
    if (!companionOk(selfC)) return
    if (!selfHasSignature) { setError(t.errSignature); return }
    if (!selfConsent) { setError(t.errConsent); return }

    // Export signature fond blanc — même mécanique que le mode principal.
    const canvas = selfSigCanvasRef.current
    if (!canvas || canvas.width === 0) { setError(t.errSignature); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { setError(t.errSignature); return }
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    const signatureImage = canvas.toDataURL('image/png')

    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mode: 'companion', companion: selfC, signature_image: signatureImage }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        setError(typeof json.error === 'string' ? json.error : t.errGeneric)
        return
      }
      setCompanionDone(true)
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
      <div className="ckin-page" style={s.page}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', padding: '32px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <CheckCircle size={56} weight="fill" color="var(--success-1, #34d399)" />
            <h1 style={{ ...s.title, margin: 0 }}>{t.successTitle}</h1>
            <p style={s.introText}>{companionDone ? t.successCompanion : t.successBody}</p>
            {!companionDone && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                background: 'var(--accent-bg)', border: '1px dashed var(--accent-border)',
                borderRadius: '12px', padding: '16px', marginTop: '6px', maxWidth: '420px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UsersThree size={15} weight="fill" /> {t.shareTitle}
                </span>
                <p style={{ ...s.introText, fontSize: '12.5px', textAlign: 'center' }}>{t.shareBody}</p>
                <button onClick={shareGroupLink} style={{ ...s.submitBtn, padding: '10px 18px', fontSize: '13.5px' }}>
                  {shareCopied ? <><CheckCircle size={15} weight="fill" /> {t.shareCopied}</> : <><PaperPlaneTilt size={15} weight="fill" /> {t.shareBtn}</>}
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ── Mode « je m'ajoute au groupe » (lien partagé par l'organisateur) ──
  if (mode === 'companion') {
    const age = ageOf(selfC.date_naissance)
    const isChild = age !== null && age < 15
    const cMissing = (v: string, req: boolean) => touched && req && !v.trim()
    return (
      <div className="ckin-page" style={s.page}>
        <div style={s.card}>
          <div style={s.header}>
            <div style={s.headBadge}>
              <UsersThree size={13} weight="fill" />
              {t.companionModeTitle}
            </div>
            <div style={s.langToggle}>
              <button onClick={() => setLang('fr')} style={{ ...s.langBtn, ...(lang === 'fr' ? s.langBtnActive : {}) }}>FR</button>
              <button onClick={() => setLang('en')} style={{ ...s.langBtn, ...(lang === 'en' ? s.langBtnActive : {}) }}>EN</button>
            </div>
          </div>
          <p style={s.introText}>
            {t.companionModeHint} <strong style={{ color: 'var(--text)' }}>{initial.prenom} {initial.nom}</strong>.
          </p>

          <div style={s.section}>
            <div style={s.sectionLabel}><User size={13} weight="fill" /> {t.identity}</div>
            <div style={s.row2} className="ck-row">
              <Field label={t.firstName} required value={selfC.prenom} onChange={v => setSelf('prenom', v)} invalid={cMissing(selfC.prenom, true)} msg={t.required} />
              <Field label={t.lastName} required value={selfC.nom} onChange={v => setSelf('nom', v)} invalid={cMissing(selfC.nom, true)} msg={t.required} />
            </div>
            <div style={s.row2} className="ck-row">
              <Field label={t.birthDate} required type="date" value={selfC.date_naissance} onChange={v => setSelf('date_naissance', v)} invalid={cMissing(selfC.date_naissance, true)} msg={t.required} />
              <Field label={t.birthPlace} required={!isChild} value={selfC.lieu_naissance} onChange={v => setSelf('lieu_naissance', v)} invalid={cMissing(selfC.lieu_naissance, !isChild)} msg={t.required} />
            </div>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>{t.nationality} *</label>
              <Select
                value={selfC.nationalite}
                onChange={v => setSelf('nationalite', v)}
                options={NAT_OPTIONS}
                placeholder={t.select}
                ariaLabel={t.nationality}
                triggerStyle={{ ...s.input, ...(cMissing(selfC.nationalite, true) ? s.inputInvalid : {}) }}
              />
              {cMissing(selfC.nationalite, true) && <span style={s.errMsg}>{t.required}</span>}
            </div>
          </div>

          <div style={s.section}>
            <div style={s.sectionLabel}><IdentificationCard size={13} weight="fill" /> {t.document}</div>
            <p style={s.note}>{t.docNote}</p>
            {isChild && <p style={{ ...s.note, fontStyle: 'italic' }}>{t.docOptionalChild}</p>}
            <div style={s.row3} className="ck-row">
              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>{t.docType}{isChild ? '' : ' *'}</label>
                <Select
                  value={selfC.id_type}
                  onChange={v => setSelf('id_type', v)}
                  options={[
                    { value: 'cni', label: t.docTypeCni },
                    { value: 'passeport', label: t.docTypePasseport },
                    { value: 'permis', label: t.docTypePermis },
                    { value: 'autre', label: t.docTypeAutre },
                  ]}
                  placeholder={t.select}
                  ariaLabel={t.docType}
                  triggerStyle={{ ...s.input, ...(cMissing(selfC.id_type, !isChild) ? s.inputInvalid : {}) }}
                />
                {cMissing(selfC.id_type, !isChild) && <span style={s.errMsg}>{t.required}</span>}
              </div>
              <Field label={t.docNumber} required={!isChild} value={selfC.id_numero} onChange={v => setSelf('id_numero', v)} invalid={cMissing(selfC.id_numero, !isChild)} msg={t.required} />
              <div style={s.fieldWrap}>
                <label style={s.fieldLabel}>{t.docCountry}</label>
                <Select
                  value={selfC.id_pays_emetteur}
                  onChange={v => setSelf('id_pays_emetteur', v)}
                  options={NAT_OPTIONS}
                  placeholder={t.select}
                  ariaLabel={t.docCountry}
                  triggerStyle={s.input}
                />
              </div>
            </div>
          </div>

          {/* Signature de l'accompagnant : apparaît sur SA fiche de police */}
          <div style={s.section}>
            <div style={s.sectionLabel}><Signature size={13} weight="fill" /> {t.signature} *</div>
            <p style={s.note}>{t.signatureHint}</p>
            <SignaturePad
              canvasRef={selfSigCanvasRef}
              onInk={() => setSelfHasSignature(true)}
              onClear={() => setSelfHasSignature(false)}
              clearLabel={t.signatureClear}
              invalid={touched && !selfHasSignature}
            />
          </div>

          <label style={s.consentRow}>
            <input
              type="checkbox"
              checked={selfConsent}
              onChange={e => setSelfConsent(e.target.checked)}
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

          <button onClick={submitCompanionSelf} disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.6 : 1 }}>
            <PaperPlaneTilt size={16} weight="fill" />
            {submitting ? t.submitting : t.submitCompanion}
          </button>

          <button
            type="button"
            onClick={() => { setMode('main'); setError(''); setTouched(false) }}
            style={s.backLink}
          >
            ← {t.backToMain}
          </button>
        </div>
        <Footer />
        <style dangerouslySetInnerHTML={{ __html: CK_CSS }} />
      </div>
    )
  }

  return (
    <div className="ckin-page" style={s.page}>
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

        {/* Lien partagé par l'organisateur : un membre du groupe s'ajoute
            lui-même sans toucher à la fiche du voyageur principal. */}
        {(initial.prenom || initial.nom) && (
          <button type="button" onClick={() => { setMode('companion'); setError(''); setTouched(false) }} style={s.notYouBanner}>
            <UsersThree size={15} weight="fill" style={{ flexShrink: 0 }} />
            <span>
              {t.notYou} <strong>{initial.prenom} {initial.nom}</strong> ?{' '}
              <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>{t.notYouCta}</span> →
            </span>
          </button>
        )}

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
            {/* Lieu de naissance : exigé par la fiche individuelle de police (FR) */}
            <Field label={t.birthPlace} required value={form.lieu_naissance} onChange={v => set('lieu_naissance', v)} invalid={missing(form.lieu_naissance)} msg={t.required} />
          </div>
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
            <Field label={t.city} required value={form.ville} onChange={v => set('ville', v)} invalid={missing(form.ville)} msg={t.required} />
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

        {/* Autres voyageurs (groupe sur le même lien) */}
        <div style={s.section}>
          <div style={s.sectionLabel}><UsersThree size={13} weight="fill" /> {t.companions}</div>
          <p style={s.note}>{t.companionsHint}</p>
          {companions.map((c, i) => {
            const age = ageOf(c.date_naissance)
            const isChild = age !== null && age < 15
            const cMissing = (v: string, req: boolean) => touched && req && !v.trim()
            return (
              <div key={i} style={s.companionCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)' }}>
                    {t.companionN} {i + 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompanions(prev => prev.filter((_, idx) => idx !== i))}
                    style={s.removeBtn}
                  >
                    <Trash size={11} /> {t.removeCompanion}
                  </button>
                </div>
                <div style={s.row2} className="ck-row">
                  <Field label={t.firstName} required value={c.prenom} onChange={v => setCompanion(i, 'prenom', v)} invalid={cMissing(c.prenom, true)} msg={t.required} />
                  <Field label={t.lastName} required value={c.nom} onChange={v => setCompanion(i, 'nom', v)} invalid={cMissing(c.nom, true)} msg={t.required} />
                </div>
                <div style={s.row2} className="ck-row">
                  <Field label={t.birthDate} required type="date" value={c.date_naissance} onChange={v => setCompanion(i, 'date_naissance', v)} invalid={cMissing(c.date_naissance, true)} msg={t.required} />
                  <Field label={t.birthPlace} required={!isChild} value={c.lieu_naissance} onChange={v => setCompanion(i, 'lieu_naissance', v)} invalid={cMissing(c.lieu_naissance, !isChild)} msg={t.required} />
                </div>
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>{t.nationality} *</label>
                  <Select
                    value={c.nationalite}
                    onChange={v => setCompanion(i, 'nationalite', v)}
                    options={NAT_OPTIONS}
                    placeholder={t.select}
                    ariaLabel={`${t.nationality} ${t.companionN} ${i + 2}`}
                    triggerStyle={{ ...s.input, ...(cMissing(c.nationalite, true) ? s.inputInvalid : {}) }}
                  />
                  {cMissing(c.nationalite, true) && <span style={s.errMsg}>{t.required}</span>}
                </div>
                {isChild && <p style={{ ...s.note, fontStyle: 'italic' }}>{t.docOptionalChild}</p>}
                {!isChild && age !== null && (
                  <p style={{ ...s.note, fontStyle: 'italic' }}>{t.adultCompanionHint}</p>
                )}
                <div style={s.row3} className="ck-row">
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>{t.docType}{isChild ? '' : ' *'}</label>
                    <Select
                      value={c.id_type}
                      onChange={v => setCompanion(i, 'id_type', v)}
                      options={[
                        { value: 'cni', label: t.docTypeCni },
                        { value: 'passeport', label: t.docTypePasseport },
                        { value: 'permis', label: t.docTypePermis },
                        { value: 'autre', label: t.docTypeAutre },
                      ]}
                      placeholder={t.select}
                      ariaLabel={`${t.docType} ${t.companionN} ${i + 2}`}
                      triggerStyle={{ ...s.input, ...(cMissing(c.id_type, !isChild) ? s.inputInvalid : {}) }}
                    />
                    {cMissing(c.id_type, !isChild) && <span style={s.errMsg}>{t.required}</span>}
                  </div>
                  <Field label={t.docNumber} required={!isChild} value={c.id_numero} onChange={v => setCompanion(i, 'id_numero', v)} invalid={cMissing(c.id_numero, !isChild)} msg={t.required} />
                  <div style={s.fieldWrap}>
                    <label style={s.fieldLabel}>{t.docCountry}</label>
                    <Select
                      value={c.id_pays_emetteur}
                      onChange={v => setCompanion(i, 'id_pays_emetteur', v)}
                      options={NAT_OPTIONS}
                      placeholder={t.select}
                      ariaLabel={`${t.docCountry} ${t.companionN} ${i + 2}`}
                      triggerStyle={s.input}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {companions.length < MAX_COMPANIONS && (
            <button
              type="button"
              onClick={() => setCompanions(prev => [...prev, { ...EMPTY_COMPANION }])}
              style={s.addCompanionBtn}
            >
              <Plus size={13} weight="bold" /> {t.addCompanion}
            </button>
          )}
        </div>

        {/* Signature électronique */}
        <div style={s.section}>
          <div style={s.sectionLabel}><Signature size={13} weight="fill" /> {t.signature} *</div>
          <p style={s.note}>{t.signatureHint}</p>
          <SignaturePad
            canvasRef={sigCanvasRef}
            onInk={() => setHasSignature(true)}
            onClear={() => setHasSignature(false)}
            clearLabel={t.signatureClear}
            invalid={touched && !hasSignature}
          />
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
      <style dangerouslySetInnerHTML={{ __html: CK_CSS }} />
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

// Pad de signature tactile/souris — même mécanique éprouvée que la page
// contrat /sign/[token] (ratio Retina, touch + mouse, trait arrondi).
// Fond blanc visuel : une signature s'écrit sur du papier, pas sur du sombre.
function SignaturePad({ canvasRef, onInk, onClear, clearLabel, invalid }: {
  canvasRef: React.RefObject<HTMLCanvasElement>
  onInk: () => void
  onClear: () => void
  clearLabel: string
  invalid: boolean
}) {
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    // Couleur fixe : canvas ne résout pas les variables CSS
    ctx.strokeStyle = '#14532d'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [canvasRef])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    lastPos.current = pos
    onInk()
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    setIsDrawing(false)
    lastPos.current = null
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        style={{
          width: '100%',
          height: '140px',
          background: '#ffffff',
          border: `1.5px ${invalid ? 'solid var(--danger, #dc2626)' : 'dashed var(--border-2)'}`,
          borderRadius: '12px',
          touchAction: 'none',
          cursor: 'crosshair',
          boxSizing: 'border-box' as const,
        }}
      />
      <button
        type="button"
        onClick={clear}
        style={{
          alignSelf: 'flex-end',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', fontSize: '12px', fontWeight: 500,
          color: 'var(--text-muted)', background: 'transparent',
          border: '1px solid var(--border-2)', borderRadius: '8px',
          cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
        }}
      >
        <Eraser size={12} />
        {clearLabel}
      </button>
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
  notYouBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '9px',
    fontSize: '12.5px',
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px dashed var(--accent-border)',
    borderRadius: '10px',
    padding: '10px 12px',
    lineHeight: 1.5,
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  backLink: {
    alignSelf: 'center',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '12.5px',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    padding: '4px 8px',
  },
  companionCard: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  removeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 9px',
    fontSize: '11.5px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: '1px solid var(--border-2)',
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  addCompanionBtn: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px dashed var(--accent-border)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
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
