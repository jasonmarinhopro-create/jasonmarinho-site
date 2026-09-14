'use client'

import { useState } from 'react'
import { SIGN_UI, type UiLang } from '@/lib/sign-ui-i18n'

interface Props {
  iban: string
  bic: string | null
  beneficiary: string
  primaryLang: UiLang
}

/** Coordonnées bancaires affichées directement dans le corps du contrat
 *  (Article 4), avant même la signature — pas seulement dans le bloc de
 *  paiement post-signature (IbanSection). Bilingue comme le reste du corps. */
export default function ContractIbanBlock({ iban, bic, beneficiary, primaryLang }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const tp = SIGN_UI[primaryLang]
  const te = SIGN_UI.en

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const label = primaryLang === 'en' ? tp.bankDetails : `${tp.bankDetails} / ${te.bankDetails}`
  const beneficiaryLabel = primaryLang === 'en' ? tp.beneficiary : `${tp.beneficiary} / ${te.beneficiary}`

  return (
    <div style={box}>
      <p style={boxLabel}>{label}</p>
      <div style={fields}>
        <Row label={beneficiaryLabel} value={beneficiary} field="beneficiary" copiedField={copiedField} onCopy={copy} tp={tp} />
        <Row label="IBAN" value={iban} field="iban" copiedField={copiedField} onCopy={copy} mono tp={tp} />
        {bic && <Row label="BIC / SWIFT" value={bic} field="bic" copiedField={copiedField} onCopy={copy} mono tp={tp} />}
      </div>
    </div>
  )
}

function Row({
  label, value, field, copiedField, onCopy, mono = false, tp,
}: {
  label: string
  value: string
  field: string
  copiedField: string | null
  onCopy: (value: string, field: string) => void
  mono?: boolean
  tp: typeof SIGN_UI['fr']
}) {
  const copied = copiedField === field
  return (
    <div style={row}>
      <div style={{ flex: 1 }}>
        <p style={rowLabel}>{label}</p>
        <p style={{ ...rowValue, fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.5px' : 'normal' }}>
          {value}
        </p>
      </div>
      <button onClick={() => onCopy(value, field)} style={{ ...copyBtn, ...(copied ? copyBtnCopied : {}) }} title={tp.copy}>
        {copied ? `✓ ${tp.copied}` : tp.copy}
      </button>
    </div>
  )
}

const box: React.CSSProperties = {
  background: 'var(--surface, #0a1a14)',
  border: '1px solid var(--border, #1e3d2f)',
  borderRadius: '12px',
  padding: '16px 18px',
  marginTop: '14px',
}

const boxLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const,
  color: 'var(--text-muted, #6b9a7e)', margin: '0 0 10px',
}

const fields: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' }

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
  padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
}

const rowLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const,
  color: '#6b9a7e', margin: '0 0 2px',
}

const rowValue: React.CSSProperties = { fontSize: '13px', color: 'var(--text, #f0ebe1)', margin: 0, wordBreak: 'break-all' as const }

const copyBtn: React.CSSProperties = {
  flexShrink: 0, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: 600,
  color: 'var(--accent-text)', cursor: 'pointer', whiteSpace: 'nowrap' as const,
}

const copyBtnCopied: React.CSSProperties = {
  background: 'var(--success-border)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--success-1)',
}
