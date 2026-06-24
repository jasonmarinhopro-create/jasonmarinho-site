'use client'

import { useState, useTransition } from 'react'
import { Sparkle, LockKey, Star } from '@phosphor-icons/react/dist/ssr'
import { submitCleanerSignup } from './actions'

interface Props {
  email: string
  defaultFullName: string
  tier: 'fondateur' | 'standard'
}

const PRESTATIONS = [
  { value: 'menage_standard', label: 'Ménage standard' },
  { value: 'gestion_linge', label: 'Gestion du linge' },
  { value: 'repassage', label: 'Repassage' },
  { value: 'reapprovisionnement', label: 'Réapprovisionnement' },
  { value: 'etat_des_lieux_photo', label: 'État des lieux photo' },
  { value: 'petite_maintenance', label: 'Petite maintenance' },
  { value: 'nettoyage_exterieur', label: 'Nettoyage extérieur' },
  { value: 'gestion_dechets', label: 'Gestion des déchets' },
]
const LANGUES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'it', label: 'Italien' },
  { value: 'de', label: 'Allemand' },
  { value: 'pt', label: 'Portugais' },
  { value: 'ar', label: 'Arabe' },
  { value: 'zh', label: 'Mandarin' },
]

export default function CreerFicheMenage({ email, defaultFullName, tier }: Props) {
  const [form, setForm] = useState({
    fullName: defaultFullName,
    pseudo: '',
    ville: '',
    zoneCouverte: '',
    siteUrl: '',
    instagramHandle: '',
    telephone: '',
    tarifForfaitMin: '',
    tarifForfaitMax: '',
    tarifHeure: '',
    equipeType: '',
    logementsGeres: '',
    delaiReservation: '',
    siret: '',
    bio: '',
    assuranceRcPro: false,
  })
  const [prestations, setPrestations] = useState<string[]>([])
  const [langues, setLangues] = useState<string[]>(['fr'])
  const [err, setErr] = useState<string | null>(null)
  const [busy, startBusy] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }
  function toggleArr(arr: string[], v: string, setter: (a: string[]) => void) {
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    startBusy(async () => {
      const res = await submitCleanerSignup({
        fullName: form.fullName,
        pseudo: form.pseudo,
        ville: form.ville,
        zoneCouverte: form.zoneCouverte,
        siteUrl: form.siteUrl,
        instagramHandle: form.instagramHandle,
        telephone: form.telephone,
        tarifForfaitMin: form.tarifForfaitMin ? parseInt(form.tarifForfaitMin, 10) : null,
        tarifForfaitMax: form.tarifForfaitMax ? parseInt(form.tarifForfaitMax, 10) : null,
        tarifHeure: form.tarifHeure ? parseInt(form.tarifHeure, 10) : null,
        equipeType: form.equipeType,
        logementsGeres: form.logementsGeres ? parseInt(form.logementsGeres, 10) : null,
        delaiReservation: form.delaiReservation,
        assuranceRcPro: form.assuranceRcPro,
        siret: form.siret,
        bio: form.bio,
        prestations,
        langues,
      })
      if (res.error) { setErr(res.error); return }
      if (res.checkoutUrl) window.location.assign(res.checkoutUrl)
    })
  }

  const tarifLabel = tier === 'fondateur'
    ? '39,98 € TTC / an à vie (place fondateur)'
    : '79,98 € TTC / an'

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <h1 style={s.title}><Sparkle weight="duotone" size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Créer ma fiche <em style={s.titleEm}>équipe ménage LCD</em></h1>
        <p style={s.sub}>Connecté en tant que <strong style={{ color: 'var(--text)' }}>{email}</strong>. Pas besoin de remettre tes identifiants — on rattache la fiche à ton compte existant.</p>
      </div>

      <div style={s.pricingBox}>
        <Star weight="fill" size={18} style={{ color: '#FFD56B', flexShrink: 0 }} />
        <span style={{ fontSize: 13.5 }}><strong style={{ color: 'var(--text)' }}>{tarifLabel}</strong>. Paiement Stripe, résiliation libre depuis ton portail abonnement.</span>
      </div>

      {err && <div style={s.err}>{err}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <Row>
          <Field label="Nom complet du contact" required>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required maxLength={100} placeholder="Marie Dupont" style={s.input} />
          </Field>
          <Field label="Nom de l'équipe / entreprise" hint="Affiché publiquement à la place du nom si renseigné">
            <input value={form.pseudo} onChange={e => set('pseudo', e.target.value)} maxLength={100} placeholder="Éclat Ménage Bordeaux" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Ville principale" required>
            <input value={form.ville} onChange={e => set('ville', e.target.value)} required maxLength={80} placeholder="Bordeaux" style={s.input} />
          </Field>
          <Field label="Zone couverte">
            <input value={form.zoneCouverte} onChange={e => set('zoneCouverte', e.target.value)} maxLength={200} placeholder="Bordeaux + 30 km" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Site web (optionnel)">
            <input type="url" value={form.siteUrl} onChange={e => set('siteUrl', e.target.value)} maxLength={300} placeholder="https://..." style={s.input} />
          </Field>
          <Field label="Instagram">
            <input value={form.instagramHandle} onChange={e => set('instagramHandle', e.target.value)} maxLength={50} placeholder="eclat.menage (sans @)" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Téléphone">
            <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} maxLength={30} placeholder="06 12 34 56 78" style={s.input} />
          </Field>
          <Field label="SIRET (optionnel)">
            <input value={form.siret} onChange={e => set('siret', e.target.value)} maxLength={14} placeholder="14 chiffres" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Tarif forfait min (€)">
            <input type="number" min={0} max={5000} value={form.tarifForfaitMin} onChange={e => set('tarifForfaitMin', e.target.value)} placeholder="60" style={s.input} />
          </Field>
          <Field label="Tarif forfait max (€)">
            <input type="number" min={0} max={5000} value={form.tarifForfaitMax} onChange={e => set('tarifForfaitMax', e.target.value)} placeholder="180" style={s.input} />
          </Field>
          <Field label="Tarif horaire (€)">
            <input type="number" min={0} max={500} value={form.tarifHeure} onChange={e => set('tarifHeure', e.target.value)} placeholder="22" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Type d'équipe">
            <select value={form.equipeType} onChange={e => set('equipeType', e.target.value)} style={s.input}>
              <option value="">— Choisir —</option>
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
              <option value="equipe_3_5">Équipe 3-5</option>
              <option value="equipe_6_plus">Équipe 6+</option>
            </select>
          </Field>
          <Field label="Logements gérés (estim.)">
            <input type="number" min={0} max={500} value={form.logementsGeres} onChange={e => set('logementsGeres', e.target.value)} placeholder="12" style={s.input} />
          </Field>
          <Field label="Délai de réservation">
            <select value={form.delaiReservation} onChange={e => set('delaiReservation', e.target.value)} style={s.input}>
              <option value="">— Choisir —</option>
              <option value="jour_meme">Jour même</option>
              <option value="24h">24h</option>
              <option value="48h">48h</option>
              <option value="72h">72h</option>
            </select>
          </Field>
        </Row>

        <Field label="Prestations proposées">
          <div style={s.chipRow}>
            {PRESTATIONS.map(p => (
              <button key={p.value} type="button" onClick={() => toggleArr(prestations, p.value, setPrestations)} style={{ ...s.chip, ...(prestations.includes(p.value) ? s.chipOn : {}) }}>
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Langues parlées">
          <div style={s.chipRow}>
            {LANGUES.map(l => (
              <button key={l.value} type="button" onClick={() => toggleArr(langues, l.value, setLangues)} style={{ ...s.chip, ...(langues.includes(l.value) ? s.chipOn : {}) }}>
                {l.label}
              </button>
            ))}
          </div>
        </Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.assuranceRcPro} onChange={e => set('assuranceRcPro', e.target.checked)} />
          J'ai une assurance RC Pro
        </label>

        <Field label="Présentation (max 600 chars)" hint={`${form.bio.length}/600`}>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value.slice(0, 600))} maxLength={600} placeholder="Quelques lignes sur ton équipe, ton approche, ce qui te différencie." style={{ ...s.input, minHeight: 110, resize: 'vertical' as const }} />
        </Field>

        <button type="submit" disabled={busy} style={{ ...s.btn, opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer' }}>
          <LockKey size={16} />
          {busy ? 'Redirection vers Stripe…' : 'Continuer vers le paiement sécurisé'}
        </button>
      </form>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={s.row}>{children}</div>
}
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.lbl}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</span>
      {children}
      {hint && <span style={s.hint}>{hint}</span>}
    </label>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'clamp(20px, 3vw, 44px)', width: '100%', fontFamily: 'var(--font-outfit), sans-serif' },
  head: { marginBottom: 22 },
  title: { fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-fraunces), serif', color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' },
  titleEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  sub: { fontSize: 13.5, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.6 },
  pricingBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 18, color: 'var(--text-2)' },
  err: { padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 14 },
  form: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 'clamp(18px, 2.5vw, 26px)', display: 'flex', flexDirection: 'column' as const, gap: 14 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  lbl: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  input: { padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, width: '100%' },
  hint: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  chipRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  chip: { padding: '6px 11px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' },
  chipOn: { background: 'var(--accent-text)', color: 'var(--bg)', borderColor: 'var(--accent-text)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 22px', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600, fontSize: 14.5, border: 'none', borderRadius: 10, marginTop: 8 },
}
