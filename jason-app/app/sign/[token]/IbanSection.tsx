'use client'

import { useState } from 'react'
import { SIGN_UI, type UiLang } from '@/lib/sign-ui-i18n'

interface Props {
  iban: string
  bic: string | null
  amount: number
  /** Solde restant après l'acompte ci-dessus, à régler séparément (ex: à l'arrivée). */
  soldeAmount?: number
  reference: string
  beneficiary: string
  lang: UiLang
}

export default function IbanSection({ iban, bic, amount, soldeAmount, reference, beneficiary, lang }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const t = SIGN_UI[lang]

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  return (
    <div style={box}>
      <div style={{ marginBottom: '18px' }}>
        <strong style={{ color: '#f0ebe1', display: 'block', marginBottom: '6px', fontSize: '16px' }}>
          {t.payByTransfer}
        </strong>
        <p style={hint}>{t.transferHint}</p>
      </div>

      <div style={fields}>
        <CopyField label={t.beneficiary} value={beneficiary} field="beneficiary" copiedField={copiedField} onCopy={copy} t={t} />
        <CopyField label="IBAN" value={iban} field="iban" copiedField={copiedField} onCopy={copy} mono t={t} />
        {bic && <CopyField label="BIC / SWIFT" value={bic} field="bic" copiedField={copiedField} onCopy={copy} mono t={t} />}
        <CopyField
          label={soldeAmount != null ? t.amountPartialLabel : t.amountLabel}
          value={`${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
          field="amount"
          copiedField={copiedField}
          onCopy={copy}
          t={t}
        />
        <CopyField label={t.referenceLabel} value={reference} field="reference" copiedField={copiedField} onCopy={copy} mono t={t} />
      </div>

      {soldeAmount != null && (
        <p style={{ ...hint, marginTop: '10px' }}>
          {t.soldeRemainingNote(`${soldeAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`)}
        </p>
      )}

      <p style={notice}>{t.transferNotice}</p>
    </div>
  )
}

function CopyField({
  label, value, field, copiedField, onCopy, mono = false, t,
}: {
  label: string
  value: string
  field: string
  copiedField: string | null
  onCopy: (value: string, field: string) => void
  mono?: boolean
  t: typeof SIGN_UI['fr']
}) {
  const copied = copiedField === field
  return (
    <div style={fieldRow}>
      <div style={{ flex: 1 }}>
        <p style={fieldLabel}>{label}</p>
        <p style={{ ...fieldValue, fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.5px' : 'normal' }}>
          {value}
        </p>
      </div>
      <button
        onClick={() => onCopy(value, field)}
        style={{ ...copyBtn, ...(copied ? copyBtnCopied : {}) }}
        title={t.copy}
      >
        {copied ? `✓ ${t.copied}` : t.copy}
      </button>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const box: React.CSSProperties = {
  background: 'rgba(99,91,255,0.06)',
  border: '1px solid rgba(99,91,255,0.25)',
  borderRadius: '16px',
  padding: '24px 28px',
  marginBottom: '16px',
}

const hint: React.CSSProperties = {
  fontSize: '13px',
  color: '#a5c4b0',
  lineHeight: 1.7,
  margin: 0,
}

const notice: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b9a7e',
  lineHeight: 1.6,
  margin: '16px 0 0',
  paddingTop: '14px',
  borderTop: '1px solid rgba(99,91,255,0.15)',
}

const fields: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginTop: '16px',
}

const fieldRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '10px 14px',
  background: 'rgba(99,91,255,0.08)',
  borderRadius: '10px',
}

const fieldLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.8px',
  textTransform: 'uppercase',
  color: '#8b84e8',
  margin: '0 0 3px',
}

const fieldValue: React.CSSProperties = {
  fontSize: '14px',
  color: '#f0ebe1',
  margin: 0,
  wordBreak: 'break-all',
}

const copyBtn: React.CSSProperties = {
  flexShrink: 0,
  background: 'rgba(99,91,255,0.2)',
  border: '1px solid rgba(99,91,255,0.35)',
  borderRadius: '8px',
  padding: '5px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#a29bfe',
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
}

const copyBtnCopied: React.CSSProperties = {
  background: 'var(--success-border)',
  border: '1px solid rgba(52,211,153,0.3)',
  color: 'var(--success-1)',
}
