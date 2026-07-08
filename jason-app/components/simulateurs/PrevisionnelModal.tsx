'use client'

// Modal de génération du PDF « Prévisionnel bancaire » depuis l'estimateur.
// Collecte les hypothèses qui ne sont pas dans l'estimateur (porteur de
// projet, financement optionnel, charges ajustables), puis génère le PDF
// côté client (jsPDF) et le télécharge.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, FilePdf, CaretDown, CaretUp, FloppyDisk, Check } from '@phosphor-icons/react/dist/ssr'
import type { EstimateRevenueResult } from '@/lib/lcd/market-benchmarks'
import { DEFAULT_CHARGES, type ChargeAssumptions } from '@/lib/lcd/previsionnel-pdf-types'
import { saveInvestorProject } from '@/lib/investor/actions'

interface Props {
  result: EstimateRevenueResult
  paysLabel: string
  typeLabel: string
  /** clé brute du type (studio/t1/t2/t3/maison) pour la sauvegarde + regen */
  typeKey: string
  nbChambres: number
  modeLabel: string
  /** clé brute du mode (toute-annee/…) pour la sauvegarde + regen */
  modeKey: string
  onClose: () => void
}

export default function PrevisionnelModal({ result, paysLabel, typeLabel, typeKey, nbChambres, modeLabel, modeKey, onClose }: Props) {
  const [porteur, setPorteur] = useState('')
  const [prixAchat, setPrixAchat] = useState('')
  const [mensualite, setMensualite] = useState('')
  const [showCharges, setShowCharges] = useState(false)
  const [charges, setCharges] = useState<ChargeAssumptions>(DEFAULT_CHARGES)
  const [generating, setGenerating] = useState(false)
  const [projectName, setProjectName] = useState(
    `${result.city} · ${typeLabel}`.trim(),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const num = (s: string): number | null => {
    const n = parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(n) ? null : n
  }
  const setCharge = (k: keyof ChargeAssumptions, v: string) => {
    const n = num(v)
    setCharges(c => ({ ...c, [k]: n ?? 0 }))
  }

  async function saveProject() {
    setSaving(true); setSaveErr('')
    try {
      // computePrevisionnel est pur (pas de jsPDF chargé), mais vit dans le
      // module builder → import dynamique pour ne pas alourdir l'estimateur.
      const { computePrevisionnel } = await import('@/lib/lcd/previsionnel-pdf')
      const comp = computePrevisionnel({
        result, paysLabel, typeLabel, nbChambres, modeLabel, charges,
        financing: { prixAchatEur: num(prixAchat), apportEur: null, mensualiteEur: num(mensualite) },
      })
      const res = await saveInvestorProject({
        nom: projectName.trim() || result.city,
        pays: result.bench?.pays ?? 'FR',
        ville: result.bench?.ville ?? null,
        typeLogement: typeKey,
        nbChambres,
        mode: modeKey,
        prixAchat: num(prixAchat),
        mensualite: num(mensualite),
        snapshot: {
          revenuAnnuel: result.revenuAnnuel,
          revenuLow: result.revenuLow,
          revenuHigh: result.revenuHigh,
          adr: result.adr,
          occupation: result.occupation,
          resultatExploitation: comp.resultatExploitation,
          cashFlow: comp.cashFlow,
          rentabiliteNette: comp.rentabiliteNette,
          source: result.source,
        },
      })
      if (res.error) { setSaveErr(res.error); return }
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function generate() {
    setGenerating(true)
    try {
      // jsPDF (~380 KB) chargé à la demande, pas au montage de l'estimateur.
      const { buildPrevisionnelPdf, previsionnelFileName } = await import('@/lib/lcd/previsionnel-pdf')
      const doc = buildPrevisionnelPdf({
        result,
        paysLabel, typeLabel, nbChambres, modeLabel,
        charges,
        financing: {
          prixAchatEur: num(prixAchat),
          apportEur: null,
          mensualiteEur: num(mensualite),
        },
        porteurProjet: porteur.trim() || null,
      })
      doc.save(previsionnelFileName(result.city))
      onClose()
    } finally {
      setGenerating(false)
    }
  }

  const body = (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.head}>
          <div style={s.headTitle}><FilePdf size={18} weight="fill" /> Prévisionnel PDF pour la banque</div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>

        <div style={s.content}>
          <div style={s.infoBox}>
            Document prêt pour un dossier de prêt : revenus escomptés, prévisionnel d&apos;exploitation,
            saisonnalité et sources. Tous les champs ci-dessous sont <strong>optionnels</strong> — sans eux,
            le PDF sort avec le revenu et les charges standard du secteur.
          </div>

          <div style={s.recap}>
            <strong>{result.city}</strong> · {typeLabel}{nbChambres > 0 ? ` · ${nbChambres} ch.` : ''} · {modeLabel}
            <span style={{ float: 'right', color: 'var(--accent-text)', fontWeight: 700 }}>
              {result.revenuAnnuel.toLocaleString('fr-FR')} € / an
            </span>
          </div>

          <Field label="Nom du porteur de projet" value={porteur} onChange={setPorteur} placeholder="Ex. M. Dupont (facultatif)" />

          <div style={s.grid2}>
            <Field label="Prix d'acquisition (€)" value={prixAchat} onChange={setPrixAchat} placeholder="Ex. 180000" hint="pour la rentabilité" />
            <Field label="Mensualité de crédit (€)" value={mensualite} onChange={setMensualite} placeholder="Ex. 850" hint="pour le cash-flow" />
          </div>

          <button onClick={() => setShowCharges(v => !v)} style={s.chargesToggle}>
            {showCharges ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
            Ajuster les charges d&apos;exploitation (hypothèses standard pré-remplies)
          </button>

          {showCharges && (
            <div style={s.chargesGrid}>
              <ChargeField label="Commissions plateformes (%)" value={charges.commissionsPct} onChange={v => setCharge('commissionsPct', v)} />
              <ChargeField label="Ménage (% du CA)" value={charges.menagePct} onChange={v => setCharge('menagePct', v)} />
              <ChargeField label="Gestion / conciergerie (%)" value={charges.gestionPct} onChange={v => setCharge('gestionPct', v)} />
              <ChargeField label="Assurance PNO+RC (%)" value={charges.assurancePct} onChange={v => setCharge('assurancePct', v)} />
              <ChargeField label="Énergie/eau/internet (%)" value={charges.energiePct} onChange={v => setCharge('energiePct', v)} />
              <ChargeField label="Entretien (%)" value={charges.entretienPct} onChange={v => setCharge('entretienPct', v)} />
              <ChargeField label="Comptabilité (€/an)" value={charges.comptaEur} onChange={v => setCharge('comptaEur', v)} />
              <ChargeField label="Taxe foncière (€/an)" value={charges.taxeFonciereEur} onChange={v => setCharge('taxeFonciereEur', v)} />
              <ChargeField label="Charges copro (€/an)" value={charges.coproEur} onChange={v => setCharge('coproEur', v)} />
            </div>
          )}

          {/* Sauvegarde du projet dans l'espace investisseur */}
          <div style={s.saveBox}>
            <label style={s.label}>Nom du projet (pour le retrouver dans « Mes projets »)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={projectName}
                onChange={e => { setProjectName(e.target.value); setSaved(false) }}
                style={{ ...s.input, flex: 1 }}
                placeholder="Ex. T2 Cité Carcassonne"
              />
              <button onClick={saveProject} disabled={saving || saved} style={saved ? s.savedBtn : s.saveBtn}>
                {saved
                  ? <><Check size={14} weight="bold" /> Sauvegardé</>
                  : <><FloppyDisk size={14} weight="bold" /> {saving ? '…' : 'Sauvegarder'}</>}
              </button>
            </div>
            {saveErr && <p style={s.errText}>{saveErr}</p>}
            {saved && <p style={s.savedText}>Projet ajouté à ton espace investisseur.</p>}
          </div>

          <div style={s.footer}>
            <button onClick={onClose} style={s.secondaryBtn}>Fermer</button>
            <button onClick={generate} disabled={generating} style={s.primaryBtn}>
              <FilePdf size={15} weight="bold" /> {generating ? 'Génération…' : 'Télécharger le PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(body, document.body)
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label style={s.label}>{label} {hint && <span style={s.hint}>· {hint}</span>}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s.input} inputMode="decimal" />
    </div>
  )
}

function ChargeField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={s.chargeLabel}>{label}</label>
      <input value={String(value)} onChange={e => onChange(e.target.value)} style={s.input} inputMode="decimal" />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  },
  modal: {
    width: '540px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
    background: 'var(--floating-surface)', border: '1px solid var(--accent-border)',
    borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, background: 'var(--floating-surface)', zIndex: 1,
  },
  headTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' },
  closeBtn: {
    width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  content: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '13px' },
  infoBox: {
    padding: '10px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '10px', fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5,
  },
  recap: {
    padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '12.5px', color: 'var(--text)',
  },
  saveBox: {
    padding: '12px', borderRadius: '10px', background: 'rgba(99,214,131,0.05)',
    border: '1px solid rgba(99,214,131,0.22)',
  },
  saveBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px',
    border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  savedBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px',
    border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981',
    fontSize: '12.5px', fontWeight: 600, cursor: 'default', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  errText: { fontSize: '12px', color: 'var(--danger)', margin: '8px 0 0' },
  savedText: { fontSize: '11.5px', color: '#10b981', margin: '8px 0 0' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '5px' },
  hint: { fontWeight: 400, color: 'var(--text-muted)', fontStyle: 'italic' },
  chargeLabel: { display: 'block', fontSize: '10.5px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' },
  input: {
    width: '100%', padding: '9px 11px', borderRadius: '9px', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  },
  chargesToggle: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 0',
    background: 'transparent', border: 'none', color: 'var(--accent-text)',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
  },
  chargesGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
    padding: '12px', background: 'var(--bg-2)', borderRadius: '10px', border: '1px solid var(--border)',
  },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px',
    border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  secondaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '9px',
    border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: '13px',
    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
}
