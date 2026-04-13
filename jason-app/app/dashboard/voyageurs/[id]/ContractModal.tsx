'use client'

import { useState, useTransition } from 'react'
import { X, FileText, Check, Copy, Envelope } from '@phosphor-icons/react'
import { createContract, type ContractData } from '../contract-actions'

const DEFAULT_ANNULATION =
  `En cas d'annulation par le locataire plus de 30 jours avant l'arrivée, l'acompte versé est remboursé intégralement. En cas d'annulation moins de 30 jours avant l'arrivée, l'acompte reste acquis au bailleur.`

const DEFAULT_REGLEMENT =
  `- Respecter le calme et la tranquillité du voisinage.\n- Interdiction de fumer à l'intérieur du logement.\n- Les animaux de compagnie ne sont pas admis sauf accord préalable du bailleur.\n- Toute fête ou rassemblement est interdit sans autorisation écrite du bailleur.\n- Le locataire s'engage à laisser le logement dans l'état dans lequel il l'a trouvé.`

type Sejour = {
  id: string
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
}

type Voyageur = {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
}

type BailleurProfile = {
  prenom: string
  nom: string
  email: string
}

interface Props {
  sejour: Sejour
  voyageur: Voyageur
  bailleur: BailleurProfile
  onClose: () => void
  onSuccess: () => void
}

type Step = 'bailleur' | 'locataire' | 'bien' | 'financier' | 'clauses' | 'done'

const STEPS: Step[] = ['bailleur', 'locataire', 'bien', 'financier', 'clauses']

const STEP_LABELS: Record<Step, string> = {
  bailleur:  '1. Vous (bailleur)',
  locataire: '2. Locataire',
  bien:      '3. Logement',
  financier: '4. Financier',
  clauses:   '5. Clauses',
  done:      'Terminé',
}

export default function ContractModal({ sejour, voyageur, bailleur, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('bailleur')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [contractToken, setContractToken] = useState('')
  const [copied, setCopied] = useState(false)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

  // Form state
  const [form, setForm] = useState({
    // Bailleur
    bailleur_prenom: bailleur.prenom,
    bailleur_nom: bailleur.nom,
    bailleur_email: bailleur.email,
    bailleur_telephone: '',
    bailleur_adresse: '',

    // Locataire
    locataire_prenom: voyageur.prenom,
    locataire_nom: voyageur.nom,
    locataire_email: voyageur.email ?? '',
    locataire_telephone: voyageur.telephone ?? '',

    // Bien
    logement_adresse: sejour.logement ?? '',
    logement_description: '',
    capacite_max: 1,

    // Séjour
    date_arrivee: sejour.date_arrivee,
    date_depart: sejour.date_depart,
    heure_arrivee: '16:00',
    heure_depart: '11:00',

    // Financier
    montant_loyer: sejour.montant ?? 0,
    montant_caution: 0,
    modalites_paiement: 'Virement bancaire',
    stripe_payment_enabled: false,

    // Clauses
    conditions_annulation: DEFAULT_ANNULATION,
    reglement_interieur: DEFAULT_REGLEMENT,
    animaux_acceptes: false,
    fumeur_accepte: false,
  })

  function set(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function nextStep() {
    const idx = STEPS.indexOf(step as Step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else handleSubmit()
  }

  function prevStep() {
    const idx = STEPS.indexOf(step as Step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function validateStep(): string {
    if (step === 'bailleur') {
      if (!form.bailleur_prenom.trim() || !form.bailleur_nom.trim()) return 'Prénom et nom du bailleur sont requis.'
      if (!form.bailleur_email.trim()) return 'Email du bailleur requis.'
    }
    if (step === 'locataire') {
      if (!form.locataire_prenom.trim() || !form.locataire_nom.trim()) return 'Prénom et nom du locataire sont requis.'
    }
    if (step === 'bien') {
      if (!form.logement_adresse.trim()) return 'L\'adresse du logement est requise.'
      if (form.capacite_max < 1) return 'La capacité doit être d\'au moins 1 personne.'
    }
    if (step === 'financier') {
      if (form.montant_loyer <= 0) return 'Le montant du loyer doit être supérieur à 0.'
    }
    if (step === 'clauses') {
      if (!form.conditions_annulation.trim()) return 'Les conditions d\'annulation sont requises.'
    }
    return ''
  }

  function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    nextStep()
  }

  function handleSubmit() {
    const contractData: ContractData = {
      sejour_id: sejour.id,
      voyageur_id: voyageur.id,
      bailleur_prenom: form.bailleur_prenom.trim(),
      bailleur_nom: form.bailleur_nom.trim(),
      bailleur_email: form.bailleur_email.trim(),
      bailleur_telephone: form.bailleur_telephone.trim() || undefined,
      bailleur_adresse: form.bailleur_adresse.trim() || undefined,
      locataire_prenom: form.locataire_prenom.trim(),
      locataire_nom: form.locataire_nom.trim(),
      locataire_email: form.locataire_email.trim() || undefined,
      locataire_telephone: form.locataire_telephone.trim() || undefined,
      logement_adresse: form.logement_adresse.trim(),
      logement_description: form.logement_description.trim() || undefined,
      capacite_max: form.capacite_max,
      date_arrivee: form.date_arrivee,
      date_depart: form.date_depart,
      heure_arrivee: form.heure_arrivee,
      heure_depart: form.heure_depart,
      montant_loyer: form.montant_loyer,
      montant_caution: form.montant_caution,
      modalites_paiement: form.modalites_paiement,
      stripe_payment_enabled: form.stripe_payment_enabled,
      conditions_annulation: form.conditions_annulation.trim(),
      reglement_interieur: form.reglement_interieur.trim(),
      animaux_acceptes: form.animaux_acceptes,
      fumeur_accepte: form.fumeur_accepte,
    }

    startTransition(async () => {
      const res = await createContract(contractData)
      if (res.error) {
        setError(res.error)
        return
      }
      setContractToken(res.token!)
      setStep('done')
      onSuccess()
    })
  }

  function copyLink() {
    const url = `${APP_URL}/sign/${contractToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const currentStepIndex = STEPS.indexOf(step as Step)
  const isLastStep = step === 'clauses'
  const signUrl = contractToken ? `${APP_URL}/sign/${contractToken}` : ''

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={modalHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileText size={18} color="#FFD56B" weight="fill" />
              <span style={modalTag}>Nouveau contrat</span>
            </div>
            <h3 style={modalTitle}>
              {step === 'done' ? 'Contrat créé avec succès !' : STEP_LABELS[step]}
            </h3>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {/* Progress bar (steps 1-5) */}
        {step !== 'done' && (
          <div style={progressBar}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  ...progressDot,
                  background: i <= currentStepIndex ? '#FFD56B' : 'var(--surface-2, #1e3d2f)',
                  border: i === currentStepIndex ? '2px solid #FFD56B' : '2px solid transparent',
                  transform: i === currentStepIndex ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}

        <div style={formBody}>
          {/* ── Step: Bailleur ─────────────────────────────────────────────── */}
          {step === 'bailleur' && (
            <>
              <p style={stepHint}>Vos informations en tant que propriétaire-bailleur.</p>
              <div style={row}>
                <Field label="Prénom *" value={form.bailleur_prenom} onChange={v => set('bailleur_prenom', v)} placeholder="Jason" />
                <Field label="Nom *" value={form.bailleur_nom} onChange={v => set('bailleur_nom', v)} placeholder="Marinho" />
              </div>
              <Field label="Email *" value={form.bailleur_email} onChange={v => set('bailleur_email', v)} placeholder="jason@email.com" type="email" />
              <Field label="Téléphone" value={form.bailleur_telephone} onChange={v => set('bailleur_telephone', v)} placeholder="+33 6 12 34 56 78" type="tel" />
              <Field label="Adresse postale" value={form.bailleur_adresse} onChange={v => set('bailleur_adresse', v)} placeholder="12 rue de la Paix, 75001 Paris" />
            </>
          )}

          {/* ── Step: Locataire ────────────────────────────────────────────── */}
          {step === 'locataire' && (
            <>
              <p style={stepHint}>Les informations de votre voyageur.</p>
              <div style={row}>
                <Field label="Prénom *" value={form.locataire_prenom} onChange={v => set('locataire_prenom', v)} placeholder="Martin" />
                <Field label="Nom *" value={form.locataire_nom} onChange={v => set('locataire_nom', v)} placeholder="Dupont" />
              </div>
              <Field label="Email" value={form.locataire_email} onChange={v => set('locataire_email', v)} placeholder="martin@email.com" type="email" />
              <Field label="Téléphone" value={form.locataire_telephone} onChange={v => set('locataire_telephone', v)} placeholder="+33 6 12 34 56 78" type="tel" />
              {!form.locataire_email && (
                <p style={warnText}>⚠️ Sans email, le lien de signature ne pourra pas être envoyé automatiquement.</p>
              )}
            </>
          )}

          {/* ── Step: Bien ─────────────────────────────────────────────────── */}
          {step === 'bien' && (
            <>
              <p style={stepHint}>Description du logement mis en location.</p>
              <Field label="Adresse complète du logement *" value={form.logement_adresse} onChange={v => set('logement_adresse', v)} placeholder="12 rue de la Paix, 75001 Paris" />
              <Field label="Description (type, superficie, équipements)" value={form.logement_description} onChange={v => set('logement_description', v)} placeholder="Studio de 25m², 1 pièce, cuisine équipée, Wi-Fi" />
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Arrivée</label>
                  <input style={inputStyle} type="date" value={form.date_arrivee} onChange={e => set('date_arrivee', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Heure arrivée</label>
                  <input style={inputStyle} type="time" value={form.heure_arrivee} onChange={e => set('heure_arrivee', e.target.value)} />
                </div>
              </div>
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Départ</label>
                  <input style={inputStyle} type="date" value={form.date_depart} onChange={e => set('date_depart', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Heure départ</label>
                  <input style={inputStyle} type="time" value={form.heure_depart} onChange={e => set('heure_depart', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Capacité maximale (personnes) *</label>
                <input
                  style={inputStyle} type="number" min={1} max={20}
                  value={form.capacite_max}
                  onChange={e => set('capacite_max', parseInt(e.target.value) || 1)}
                />
              </div>
            </>
          )}

          {/* ── Step: Financier ────────────────────────────────────────────── */}
          {step === 'financier' && (
            <>
              <p style={stepHint}>Montants et modalités de paiement.</p>
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Loyer total (€) *</label>
                  <input
                    style={inputStyle} type="number" min={0} step={0.01}
                    value={form.montant_loyer}
                    onChange={e => set('montant_loyer', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Dépôt de garantie (€)</label>
                  <input
                    style={inputStyle} type="number" min={0} step={0.01}
                    value={form.montant_caution}
                    onChange={e => set('montant_caution', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Modalités de paiement</label>
                <select
                  style={inputStyle}
                  value={form.modalites_paiement}
                  onChange={e => set('modalites_paiement', e.target.value)}
                >
                  <option>Virement bancaire</option>
                  <option>Espèces</option>
                  <option>Chèque</option>
                  <option>Airbnb / Booking (plateforme)</option>
                  <option>PayPal</option>
                  <option>Carte bancaire</option>
                  <option>Paiement en ligne (Stripe)</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={form.stripe_payment_enabled}
                  onChange={e => set('stripe_payment_enabled', e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0, width: '16px', height: '16px', cursor: 'pointer', accentColor: '#34D399' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '2px' }}>Payer la réservation en ligne via Stripe</strong>
                  Le voyageur pourra régler le loyer directement après la signature, depuis son téléphone ou ordinateur.
                  Nécessite que votre compte Stripe soit connecté dans les paramètres.
                </span>
              </label>
            </>
          )}

          {/* ── Step: Clauses ──────────────────────────────────────────────── */}
          {step === 'clauses' && (
            <>
              <p style={stepHint}>Ces clauses sont pré-remplies selon les bonnes pratiques françaises. Modifiez-les si besoin.</p>
              <div>
                <label style={fieldLabel}>Conditions d&apos;annulation * <span style={{ color: '#6b9a7e', fontWeight: 400 }}>(obligatoire)</span></label>
                <textarea
                  style={{ ...inputStyle, height: '90px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.conditions_annulation}
                  onChange={e => set('conditions_annulation', e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Règlement intérieur</label>
                <textarea
                  style={{ ...inputStyle, height: '110px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.reglement_interieur}
                  onChange={e => set('reglement_interieur', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
                <ToggleField
                  label="Animaux admis"
                  value={form.animaux_acceptes}
                  onChange={v => set('animaux_acceptes', v)}
                />
                <ToggleField
                  label="Tabac autorisé"
                  value={form.fumeur_accepte}
                  onChange={v => set('fumeur_accepte', v)}
                />
              </div>
            </>
          )}

          {/* ── Step: Done ─────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div style={doneBox}>
              <div style={{ fontSize: '48px', textAlign: 'center' as const, marginBottom: '16px' }}>📄</div>
              <p style={doneText}>
                Le contrat a été créé avec succès.
                {form.locataire_email ? (
                  <> Un email avec le lien de signature a été envoyé à <strong style={{ color: 'var(--accent-text)' }}>{form.locataire_email}</strong>.</>
                ) : (
                  <> Partagez le lien ci-dessous avec le locataire pour qu&apos;il puisse signer.</>
                )}
              </p>

              {/* Lien de signature */}
              <div style={linkBox}>
                <p style={linkLabel}>Lien de signature</p>
                <div style={linkRow}>
                  <a href={signUrl} target="_blank" rel="noopener noreferrer" style={linkText}>
                    {signUrl}
                  </a>
                  <button onClick={copyLink} style={copyBtn}>
                    {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                <a
                  href={signUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={previewBtn}
                >
                  <FileText size={14} />
                  Voir le contrat
                </a>
                {form.locataire_email && (
                  <div style={sentNotice}>
                    <Envelope size={14} color="#34D399" />
                    Email envoyé à {form.locataire_email}
                  </div>
                )}
              </div>

              <p style={legalNotice}>
                Ce contrat constitue une signature électronique simple valide selon le règlement eIDAS (UE) 910/2014
                et l&apos;article 1366 du Code civil français. Le lien expire dans 30 jours.
              </p>
            </div>
          )}

          {error && <p style={errorStyle}>{error}</p>}
        </div>

        {/* Footer buttons */}
        {step !== 'done' && (
          <div style={footer}>
            <button
              type="button"
              onClick={currentStepIndex === 0 ? onClose : prevStep}
              style={ghostBtn}
            >
              {currentStepIndex === 0 ? 'Annuler' : '← Retour'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              style={primaryBtn}
            >
              {isPending ? 'Création…' : isLastStep ? (
                <><FileText size={14} /> Créer le contrat</>
              ) : (
                'Suivant →'
              )}
            </button>
          </div>
        )}
        {step === 'done' && (
          <div style={footer}>
            <button type="button" onClick={onClose} style={primaryBtn}>
              <Check size={14} />
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={fieldLabel}>{label}</label>
      <input
        style={inputStyle}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function ToggleField({
  label, value, onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: '#FFD56B' }}
      />
      <span style={{ fontSize: '14px', color: 'var(--text-2, #a5c4b0)' }}>{label}</span>
    </label>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 400,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

const modal: React.CSSProperties = {
  background: 'var(--bg-2, #0f2018)',
  border: '1px solid var(--border-2, #1e3d2f)',
  borderRadius: '22px',
  width: '100%', maxWidth: '580px',
  boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
  maxHeight: '90vh', overflowY: 'auto',
}

const modalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '22px 24px 16px',
  borderBottom: '1px solid var(--border, #1e3d2f)',
}

const modalTag: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px',
  textTransform: 'uppercase', color: '#FFD56B',
}

const modalTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '20px', fontWeight: 400,
  color: 'var(--text, #f0ebe1)', margin: 0,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-3, #6b9a7e)', padding: '4px',
}

const progressBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '8px', padding: '14px 24px 0',
}

const progressDot: React.CSSProperties = {
  width: '10px', height: '10px',
  borderRadius: '50%',
  transition: 'all 0.2s',
}

const formBody: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex', flexDirection: 'column', gap: '14px',
}

const row: React.CSSProperties = {
  display: 'flex', gap: '12px', flexWrap: 'wrap' as const,
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '12px', fontWeight: 500,
  color: 'var(--text-2, #a5c4b0)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box' as const,
  background: 'var(--surface, #0a1a14)',
  border: '1px solid var(--border, #1e3d2f)',
  borderRadius: '10px', padding: '10px 12px',
  fontSize: '14px', color: 'var(--text, #f0ebe1)',
  outline: 'none',
}

const stepHint: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-muted, #6b9a7e)',
  margin: '0 0 4px', lineHeight: 1.5,
}

const warnText: React.CSSProperties = {
  fontSize: '13px', color: '#FFD56B',
  background: 'rgba(255,213,107,0.08)',
  border: '1px solid rgba(255,213,107,0.2)',
  borderRadius: '8px', padding: '10px 14px', margin: 0,
}

const errorStyle: React.CSSProperties = {
  color: '#ef4444', fontSize: '13px', margin: 0,
}

const footer: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 24px 20px',
  borderTop: '1px solid var(--border, #1e3d2f)',
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '14px', color: 'var(--text-muted, #6b9a7e)',
  padding: '8px 0',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: '#FFD56B', color: '#0a1a14',
  border: 'none', borderRadius: '12px',
  padding: '10px 20px', fontSize: '14px', fontWeight: 600,
  cursor: 'pointer',
}

// Done step styles

const doneBox: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '16px',
}

const doneText: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-2, #a5c4b0)',
  lineHeight: 1.7, margin: 0,
}

const linkBox: React.CSSProperties = {
  background: 'var(--surface, #0a1a14)',
  border: '1px solid var(--border, #1e3d2f)',
  borderRadius: '12px', padding: '14px 16px',
}

const linkLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600,
  letterSpacing: '1px', textTransform: 'uppercase' as const,
  color: 'var(--text-muted, #6b9a7e)', margin: '0 0 8px',
}

const linkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
}

const linkText: React.CSSProperties = {
  flex: 1, fontSize: '13px', color: '#FFD56B',
  textDecoration: 'none', wordBreak: 'break-all' as const,
}

const copyBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: 'none', border: '1px solid var(--border, #1e3d2f)',
  borderRadius: '8px', padding: '5px 12px',
  fontSize: '12px', color: 'var(--text-2, #a5c4b0)',
  cursor: 'pointer', flexShrink: 0,
}

const previewBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'rgba(255,213,107,0.1)',
  border: '1px solid rgba(255,213,107,0.25)',
  borderRadius: '10px', padding: '8px 16px',
  fontSize: '13px', color: '#FFD56B',
  textDecoration: 'none', cursor: 'pointer',
}

const sentNotice: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '10px', padding: '8px 16px',
  fontSize: '13px', color: '#34D399',
}

const legalNotice: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-muted, #4a7260)',
  lineHeight: 1.6, margin: 0,
}
