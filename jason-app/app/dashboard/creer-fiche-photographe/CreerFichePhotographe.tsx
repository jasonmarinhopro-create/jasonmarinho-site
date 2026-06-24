'use client'

import { useState, useTransition } from 'react'
import { Camera, LockKey, Star } from '@phosphor-icons/react/dist/ssr'
import { submitPhotographerSignup } from './actions'

interface Props {
  email: string
  defaultFullName: string
  tier: 'fondateur' | 'standard'
}

export default function CreerFichePhotographe({ email, defaultFullName, tier }: Props) {
  const [form, setForm] = useState({
    fullName: defaultFullName,
    ville: '',
    zoneCouverte: '',
    portfolioUrl: '',
    instagramHandle: '',
    telephone: '',
    specialite: '',
    tarifMin: '',
    tarifMax: '',
    bio: '',
  })
  const [err, setErr] = useState<string | null>(null)
  const [busy, startBusy] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    startBusy(async () => {
      const res = await submitPhotographerSignup({
        fullName: form.fullName,
        ville: form.ville,
        zoneCouverte: form.zoneCouverte,
        portfolioUrl: form.portfolioUrl,
        instagramHandle: form.instagramHandle,
        telephone: form.telephone,
        specialite: form.specialite,
        tarifMin: form.tarifMin ? parseInt(form.tarifMin, 10) : null,
        tarifMax: form.tarifMax ? parseInt(form.tarifMax, 10) : null,
        bio: form.bio,
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
        <h1 style={s.title}><Camera weight="duotone" size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Créer ma fiche <em style={s.titleEm}>photographe LCD</em></h1>
        <p style={s.sub}>Connecté en tant que <strong style={{ color: 'var(--text)' }}>{email}</strong>. Pas besoin de remettre tes identifiants — on rattache la fiche à ton compte existant.</p>
      </div>

      <div style={s.pricingBox}>
        <Star weight="fill" size={18} style={{ color: '#FFD56B', flexShrink: 0 }} />
        <span style={{ fontSize: 13.5 }}><strong style={{ color: 'var(--text)' }}>{tarifLabel}</strong>. Paiement Stripe, résiliation libre depuis ton portail abonnement.</span>
      </div>

      {err && <div style={s.err}>{err}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <Field label="Nom complet" required>
          <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required maxLength={100} placeholder="Marie Dupont" style={s.input} />
        </Field>

        <Row>
          <Field label="Ville principale" required>
            <input value={form.ville} onChange={e => set('ville', e.target.value)} required maxLength={80} placeholder="Lyon" style={s.input} />
          </Field>
          <Field label="Zone couverte">
            <input value={form.zoneCouverte} onChange={e => set('zoneCouverte', e.target.value)} maxLength={200} placeholder="Lyon + 60 km" style={s.input} />
          </Field>
        </Row>

        <Field label="Lien portfolio" required hint="Site web pro OU Instagram pro. URL complète avec https://">
          <input type="url" value={form.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)} required maxLength={300} placeholder="https://..." style={s.input} />
        </Field>

        <Row>
          <Field label="Compte Instagram">
            <input value={form.instagramHandle} onChange={e => set('instagramHandle', e.target.value)} maxLength={50} placeholder="marie.photo (sans @)" style={s.input} />
          </Field>
          <Field label="Téléphone (optionnel)">
            <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} maxLength={30} placeholder="06 12 34 56 78" style={s.input} />
          </Field>
        </Row>

        <Field label="Spécialité">
          <select value={form.specialite} onChange={e => set('specialite', e.target.value)} style={s.input}>
            <option value="">— Choisir —</option>
            <option value="Intérieurs LCD">Intérieurs LCD (le plus courant)</option>
            <option value="Intérieurs + drone extérieur">Intérieurs + drone extérieur</option>
            <option value="Intérieurs + vidéo / Reels">Intérieurs + vidéo / Reels</option>
            <option value="Visite virtuelle Matterport 3D">Visite virtuelle Matterport 3D</option>
            <option value="Hôtels et gîtes de charme">Hôtels et gîtes de charme</option>
            <option value="Architecture + mise en scène">Architecture + mise en scène</option>
          </select>
        </Field>

        <Row>
          <Field label="Tarif min session (€)">
            <input type="number" min={0} max={5000} value={form.tarifMin} onChange={e => set('tarifMin', e.target.value)} placeholder="350" style={s.input} />
          </Field>
          <Field label="Tarif max session (€)">
            <input type="number" min={0} max={5000} value={form.tarifMax} onChange={e => set('tarifMax', e.target.value)} placeholder="800" style={s.input} />
          </Field>
        </Row>

        <Field label="Présentation (max 600 chars)" hint={`${form.bio.length}/600`}>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value.slice(0, 600))} maxLength={600} placeholder="Quelques lignes sur toi, ton expérience LCD." style={{ ...s.input, minHeight: 110, resize: 'vertical' as const }} />
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
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  lbl: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  input: { padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, width: '100%' },
  hint: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 22px', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600, fontSize: 14.5, border: 'none', borderRadius: 10, marginTop: 8 },
}
