'use client'

import { useState, useTransition } from 'react'
import { EyeSlash, Eye, Trash } from '@phosphor-icons/react/dist/ssr'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { hideDepannage, unhideDepannage, deleteUnpaidDepannage } from './actions'

type Mode = 'hide' | 'unhide' | 'delete'

const TXT: Record<Mode, { label: string; message: (n: string) => string | null; danger: boolean }> = {
  hide: { label: 'Masquer', message: n => `Masquer ${n} de l’annuaire ? L’abonnement Stripe reste actif.`, danger: true },
  unhide: { label: 'Réactiver', message: () => null, danger: false },
  delete: { label: 'Supprimer', message: n => `Supprimer définitivement ${n} (inscription jamais payée) ? Son compte est aussi supprimé s’il ne sert à rien d’autre (pas de logement ni d’autre fiche).`, danger: true },
}
const RUN: Record<Mode, (id: string) => Promise<{ success?: boolean; error?: string }>> = { hide: hideDepannage, unhide: unhideDepannage, delete: deleteUnpaidDepannage }

/** Bouton d'action admin sur une fiche dépannage (la page se revalide côté serveur). */
export default function FicheAction({ id, name, mode }: { id: string; name: string; mode: Mode }) {
  const [busy, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()
  const t = TXT[mode]
  const Icon = mode === 'hide' ? EyeSlash : mode === 'unhide' ? Eye : Trash

  async function run() {
    const msg = t.message(name)
    if (msg && !(await confirm({ message: msg, confirmLabel: t.label, danger: t.danger }))) return
    setErr(null)
    start(async () => {
      const r = await RUN[mode](id)
      if (r.error) setErr(r.error)
    })
  }

  return (
    <>
      {dialog}
      <button type="button" onClick={run} disabled={busy} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
        background: mode === 'unhide' ? 'var(--accent-text)' : 'var(--bg)',
        color: mode === 'unhide' ? 'var(--bg)' : mode === 'delete' ? 'var(--danger)' : 'var(--text-2)',
        border: mode === 'delete' ? '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' : mode === 'unhide' ? '1px solid var(--accent-text)' : '1px solid var(--border)',
      }}>
        <Icon size={14} weight="bold" /> {busy ? '…' : t.label}
      </button>
      {err && <span role="alert" style={{ fontSize: 12.5, color: 'var(--danger)', flexBasis: '100%' }}>{err}</span>}
    </>
  )
}
