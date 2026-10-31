'use client'

// Créer ma fiche Dépannage (31/10/2026) : l'essentiel pour être trouvé
// (spécialités, ville, délai, prix de base), le reste se complète ensuite
// dans l'atelier de Ma fiche (photos, formules, zone sur carte, déroulé).
import SuggestInput from '@/components/ui/SuggestInput'
import { CITY_OPTIONS } from '@/lib/ui/suggest'
import { useState, useTransition } from 'react'
import { Wrench, LockKey, Star, Clock } from '@phosphor-icons/react/dist/ssr'
import { SPECIALITES_DEPANNAGE } from '@/lib/pros/metiers'
import { DELAIS_DEPANNAGE } from '@/lib/pros/depannage'
import { submitDepannageSignup } from './actions'

interface Props {
  email: string
  defaultFullName: string
  tier: 'fondateur' | 'standard'
  /** Métier pas encore ouvert aux inscriptions */
  bientot?: boolean
}

export default function CreerFicheDepannage({ email, defaultFullName, tier, bientot = false }: Props) {
  const [form, setForm] = useState({
    fullName: defaultFullName, pseudo: '', ville: '', zoneCouverte: '', telephone: '', siret: '',
    tarifHeure: '', deplacementPrix: '', delaiIntervention: '', bio: '',
  })
  const [specialites, setSpecialites] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [busy, startBusy] = useTransition()

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }
  const toInt = (v: string) => (v.trim() ? parseInt(v, 10) : null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!specialites.length) { setErr('Coche au moins une spécialité.'); return }
    startBusy(async () => {
      const res = await submitDepannageSignup({
        fullName: form.fullName, pseudo: form.pseudo, ville: form.ville, zoneCouverte: form.zoneCouverte,
        telephone: form.telephone, siret: form.siret, tarifHeure: toInt(form.tarifHeure), deplacementPrix: toInt(form.deplacementPrix),
        delaiIntervention: form.delaiIntervention, specialites, bio: form.bio,
      })
      if (res.error) { setErr(res.error); return }
      if (res.checkoutUrl) window.location.assign(res.checkoutUrl)
    })
  }

  if (bientot) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.form, maxWidth: 620, margin: '40px auto 0', textAlign: 'center' as const, alignItems: 'center' }}>
          <Clock size={30} weight="duotone" color="var(--accent-text)" />
          <h1 style={s.title}>L&apos;annuaire <em style={s.titleEm}>dépannage et maintenance</em> ouvre très bientôt</h1>
          <p style={s.sub}>Plombiers, électriciens, serruriers, multiservices : les inscriptions ouvrent dans quelques jours. Tu retrouveras ici le même espace que les photographes et les équipes de ménage : ta fiche, tes demandes, tes clients et tes devis.</p>
        </div>
      </div>
    )
  }

  const tarifLabel = tier === 'fondateur' ? '39,98 € TTC / an à vie (place fondateur)' : '79,98 € TTC / an'

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <h1 style={s.title}><Wrench weight="duotone" size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Créer ma fiche <em style={s.titleEm}>dépannage et maintenance</em></h1>
        <p style={s.sub}>Connecté en tant que <strong style={{ color: 'var(--text)' }}>{email}</strong>. La fiche est rattachée à ton compte : tu la complètes ensuite (photos, formules, zone) depuis Ma fiche.</p>
      </div>

      <div style={s.pricingBox}>
        <Star weight="fill" size={18} style={{ color: '#FFD56B', flexShrink: 0 }} />
        <span style={{ fontSize: 13.5 }}><strong style={{ color: 'var(--text)' }}>{tarifLabel}</strong>. Paiement Stripe, résiliation libre depuis ton portail abonnement.</span>
      </div>

      {err && <div style={s.err}>{err}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <Field label="Tes spécialités" required hint="Les hôtes filtrent l'annuaire avec : coche tout ce que tu fais.">
          <div style={s.chipRow}>
            {SPECIALITES_DEPANNAGE.map(sp => {
              const on = specialites.includes(sp.id)
              return (
                <button key={sp.id} type="button" aria-pressed={on} onClick={() => setSpecialites(a => on ? a.filter(x => x !== sp.id) : [...a, sp.id])} style={{ ...s.chip, ...(on ? s.chipOn : {}) }}>
                  {sp.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Row>
          <Field label="Ton nom" required>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required maxLength={100} placeholder="Karim Benali" style={s.input} />
          </Field>
          <Field label="Nom de ton entreprise" hint="Affiché à la place de ton nom s'il est rempli">
            <input value={form.pseudo} onChange={e => set('pseudo', e.target.value)} maxLength={100} placeholder="KB Dépannage" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Ville principale" required>
            <SuggestInput kind="ville" value={form.ville} onChange={v => set('ville', v)} options={CITY_OPTIONS} required maxLength={80} placeholder="Nantes" ariaLabel="Ville" style={s.input} />
          </Field>
          <Field label="Zone couverte" hint="Un rayon (+ 30 km), des communes ou un département : ta fiche les montre sur une carte.">
            <input value={form.zoneCouverte} onChange={e => set('zoneCouverte', e.target.value)} maxLength={200} placeholder="Nantes + 25 km" style={s.input} />
          </Field>
        </Row>

        <Field label="Tu peux intervenir">
          <div style={s.chipRow}>
            {DELAIS_DEPANNAGE.map(d => {
              const on = form.delaiIntervention === d.id
              return <button key={d.id} type="button" aria-pressed={on} onClick={() => set('delaiIntervention', on ? '' : d.id)} style={{ ...s.chip, ...(on ? s.chipOn : {}) }}>{d.label}</button>
            })}
          </div>
        </Field>

        <Row>
          <Field label="Tarif horaire (€, facultatif)">
            <input type="number" min={0} max={500} value={form.tarifHeure} onChange={e => set('tarifHeure', e.target.value)} placeholder="45" style={s.input} />
          </Field>
          <Field label="Déplacement (€, facultatif)" hint="0 si le déplacement est offert">
            <input type="number" min={0} max={500} value={form.deplacementPrix} onChange={e => set('deplacementPrix', e.target.value)} placeholder="30" style={s.input} />
          </Field>
        </Row>

        <Row>
          <Field label="Téléphone">
            <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} maxLength={30} placeholder="06 12 34 56 78" style={s.input} />
          </Field>
          <Field label="SIRET (facultatif)">
            <input value={form.siret} onChange={e => set('siret', e.target.value)} maxLength={14} inputMode="numeric" placeholder="14 chiffres" style={s.input} />
          </Field>
        </Row>

        <Field label="Présentation (600 caractères au plus)" hint={`${form.bio.length}/600`}>
          <textarea value={form.bio} onChange={e => set('bio', e.target.value.slice(0, 600))} maxLength={600} placeholder="Quelques lignes : ton métier, depuis quand, ce que tu répares le plus souvent entre deux voyageurs." style={{ ...s.input, minHeight: 110, resize: 'vertical' as const }} />
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
  chipOn: { background: 'var(--accent-text)', color: 'var(--bg)', border: '1px solid var(--accent-text)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 22px', background: 'var(--accent-text)', color: 'var(--bg)', fontWeight: 600, fontSize: 14.5, border: 'none', borderRadius: 10, marginTop: 8 },
}
