'use client'

// Fenêtre « Mes infos pour les devis » (devis des pros, 04/10/2026).
// Rendue en portail : un parent animé (fade-up, transform) confinerait le
// position: fixed.

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, IdentificationCard, Receipt, Percent, CalendarBlank } from '@phosphor-icons/react/dist/ssr'
import { saveBillingProfile } from '@/lib/pros/billing-actions'
import type { BillingProfile, ProKind } from '@/lib/pros/billing'

export default function BillingSettings({ kind, initial, onClose, onSaved }: {
  kind: ProKind
  initial: BillingProfile
  onClose: () => void
  onSaved: (p: BillingProfile) => void
}) {
  const [p, setP] = useState<BillingProfile>(initial)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof BillingProfile>(k: K, v: BillingProfile[K]) => setP(x => ({ ...x, [k]: v }))

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const r = await saveBillingProfile(kind, p)
      if (!r.ok) { setError(r.error); return }
      onSaved(p)
      onClose()
    })
  }

  if (!mounted) return null
  return createPortal(
    <div style={s.overlay} role="dialog" aria-modal="true" aria-label="Mes infos pour les devis">
      <form onSubmit={save} style={s.modal}>
        <div style={s.head}>
          <div>
            <div style={s.title}>Mes infos pour les devis</div>
            <div style={s.sub}>Elles apparaissent sur chaque devis. Tu ne les remplis qu&apos;une fois.</div>
          </div>
          <button type="button" onClick={onClose} style={s.close} aria-label="Fermer"><X size={18} /></button>
        </div>

        <div style={s.body}>
          <Section icon={<IdentificationCard size={16} weight="bold" />} title="Identité">
            <div style={s.seg}>
              {(['EI', 'societe'] as const).map(f => (
                <button type="button" key={f} onClick={() => set('legal_form', f)} style={{ ...s.segBtn, ...(p.legal_form === f ? s.segOn : {}) }}>
                  {f === 'EI' ? 'Micro-entreprise / EI' : 'Société (SASU, EURL…)'}
                </button>
              ))}
            </div>
            <Field label={p.legal_form === 'EI' ? 'Prénom et nom' : 'Raison sociale'} hint={p.legal_form === 'EI' ? '« EI » est ajouté automatiquement après ton nom, c\'est obligatoire.' : undefined}>
              <input className="input-field" style={s.input} value={p.legal_name ?? ''} onChange={e => set('legal_name', e.target.value)} required />
            </Field>
            <Field label="Nom commercial (facultatif)">
              <input className="input-field" style={s.input} value={p.trade_name ?? ''} onChange={e => set('trade_name', e.target.value)} placeholder="Ex. Studio Lumière" />
            </Field>
            <div style={s.grid2}>
              <Field label="SIRET">
                <input className="input-field" style={s.input} value={p.siret ?? ''} onChange={e => set('siret', e.target.value)} inputMode="numeric" placeholder="14 chiffres" required />
              </Field>
              <Field label="Téléphone">
                <input className="input-field" style={s.input} value={p.phone ?? ''} onChange={e => set('phone', e.target.value)} />
              </Field>
            </div>
            <Field label="Adresse">
              <textarea className="input-field" style={{ ...s.input, resize: 'vertical' as const }} rows={2} value={p.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="N°, rue, code postal, ville" required />
            </Field>
            <Field label="E-mail (les clients te répondent ici)">
              <input className="input-field" style={s.input} type="email" value={p.email ?? ''} onChange={e => set('email', e.target.value)} />
            </Field>
          </Section>

          <Section icon={<Percent size={16} weight="bold" />} title="TVA">
            <div style={s.seg}>
              <button type="button" onClick={() => set('vat_mode', 'franchise')} style={{ ...s.segBtn, ...(p.vat_mode === 'franchise' ? s.segOn : {}) }}>Pas de TVA (franchise)</button>
              <button type="button" onClick={() => set('vat_mode', 'tva')} style={{ ...s.segBtn, ...(p.vat_mode === 'tva' ? s.segOn : {}) }}>Je facture la TVA</button>
            </div>
            {p.vat_mode === 'franchise' ? (
              <p style={s.note}>La mention « TVA non applicable, art. 293 B du CGI » est ajoutée sur tes documents. Possible en micro-entreprise comme en société tant que le chiffre d&apos;affaires reste sous 37 500 € par an pour des prestations de services.</p>
            ) : (
              <div style={s.grid2}>
                <Field label="Taux par défaut">
                  <select className="input-field" style={s.input} value={p.default_vat_rate} onChange={e => set('default_vat_rate', Number(e.target.value))}>
                    <option value={20}>20 %</option><option value={10}>10 %</option><option value={5.5}>5,5 %</option>
                  </select>
                </Field>
                <Field label="N° de TVA intracommunautaire">
                  <input className="input-field" style={s.input} value={p.vat_number ?? ''} onChange={e => set('vat_number', e.target.value)} placeholder="FR…" />
                </Field>
              </div>
            )}
          </Section>

          <Section icon={<CalendarBlank size={16} weight="bold" />} title="Validité et mentions">
            <Field label="Validité des devis">
              <select className="input-field" style={s.input} value={p.quote_validity_days} onChange={e => set('quote_validity_days', Number(e.target.value))}>
                <option value={15}>15 jours</option><option value={30}>30 jours</option><option value={60}>60 jours</option><option value={90}>90 jours</option>
              </select>
            </Field>
            <Field label="Note en bas de chaque devis (facultatif)">
              <input className="input-field" style={s.input} value={p.footer_note ?? ''} onChange={e => set('footer_note', e.target.value)} placeholder="Ex. Assurance RC Pro : MAAF, contrat n°…" />
            </Field>
          </Section>
          <Section icon={<Receipt size={16} weight="bold" />} title="Tes factures">
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={p.has_invoicing_tool} onChange={e => set('has_invoicing_tool', e.target.checked)} style={{ marginTop: 3 }} />
              <span>J&apos;ai déjà un outil de facturation. <span style={{ color: 'var(--text-muted)' }}>Les suggestions d&apos;outils (Tiime, Indy) ne s&apos;affichent plus.</span></span>
            </label>
            {p.has_invoicing_tool && (
              <Field label="Lequel ? (facultatif)">
                <input className="input-field" style={s.input} value={p.invoicing_tool ?? ''} onChange={e => set('invoicing_tool', e.target.value)} placeholder="Ex. Abby, Freebe, mon expert-comptable…" />
              </Field>
            )}
          </Section>
        </div>

        <div style={s.foot}>
          {error && <span style={s.error}>{error}</span>}
          <button type="button" onClick={onClose} style={s.ghost}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={pending}>
            <Check size={15} weight="bold" /> {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={s.section}>
      <div style={s.sectionTitle}><span style={s.sectionIcon}>{icon}</span>{title}</div>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.label}>{label}</span>
      {children}
      {hint && <span style={s.hint}>{hint}</span>}
    </label>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,20,14,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,.25)', overflow: 'hidden' },
  head: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '20px 22px 14px', borderBottom: '1px solid var(--border)' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 21, color: 'var(--text)' },
  sub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 },
  close: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, alignSelf: 'flex-start' },
  body: { padding: '6px 22px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  section: { display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderBottom: '1px solid var(--border)' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: 'var(--text)' },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' },
  hint: { fontSize: 11.5, color: 'var(--text-muted)' },
  input: { width: '100%', fontSize: 14 },
  seg: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  segBtn: { flex: '1 1 160px', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2, var(--bg))', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  segOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  note: { fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 },
  foot: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' },
  ghost: { background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 12px' },
  error: { fontSize: 13, color: '#B4462F', marginRight: 'auto' },
}
