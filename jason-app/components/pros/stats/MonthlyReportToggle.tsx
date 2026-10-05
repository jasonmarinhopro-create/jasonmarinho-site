'use client'
// Case « Recevoir mon bilan chaque mois par e-mail » (05/10/2026), optimiste.
import { useState, useTransition } from 'react'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import { setMonthlyReport } from '@/lib/visibility/pro-actions'

export default function MonthlyReportToggle({ initialOn, canEdit }: { initialOn: boolean; canEdit: boolean }) {
  const [on, setOn] = useState(initialOn)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function toggle(next: boolean) {
    setErr(null)
    setOn(next)
    start(async () => {
      const res = await setMonthlyReport(next)
      if ('error' in res) { setOn(!next); setErr(res.error) }
    })
  }

  return (
    <div id="bilan" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }} className="stats-noprint">
      <span style={{ width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', flexShrink: 0 }}>
        <EnvelopeSimple size={18} weight="duotone" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: canEdit ? 'pointer' : 'default', fontSize: 14.5, fontWeight: 600, color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={on}
            disabled={!canEdit || pending}
            onChange={e => toggle(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--accent-text)', cursor: canEdit ? 'pointer' : 'default' }}
          />
          Recevoir mon bilan chaque mois par e-mail
        </label>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '6px 0 0', lineHeight: 1.55 }}>
          {canEdit
            ? 'Le 1er de chaque mois : tes visiteurs, tes vues, tes demandes et ta place dans Google sur le mois écoulé, avec un conseil.'
            : `Aperçu admin : le pro ${on ? 'reçoit' : 'ne reçoit pas'} son bilan mensuel. Lui seul peut changer ce réglage.`}
        </p>
        {err && <p style={{ fontSize: 12.5, color: 'var(--danger-text)', margin: '6px 0 0' }}>{err}</p>}
      </div>
    </div>
  )
}
