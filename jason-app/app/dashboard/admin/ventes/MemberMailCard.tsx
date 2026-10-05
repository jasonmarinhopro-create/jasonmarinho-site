'use client'

import { useState } from 'react'
import { PaperPlaneTilt, CheckCircle, Warning, Prohibit } from '@phosphor-icons/react/dist/ssr'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { EXCLUSION_LABEL, type MemberMailExclusion } from '@/lib/admin/sales'
import type { SalesData } from '@/lib/admin/sales-load'
import { AMBER, tint } from '../_ui/theme'
import { sendMemberMails } from './actions'

// E-mail unique aux membres gratuits (05/10/2026). Part de la boîte de Jason,
// un message toutes les ~7 s : le bouton rappelle l'envoi tant qu'il en reste.
// Jamais aux comptes Driing (confirmés ou en attente), ni deux fois.

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

export default function MemberMailCard({ mail }: { mail: SalesData['memberMail'] }) {
  const { confirm, dialog } = useConfirm()
  const total = mail.toSend.actif + mail.toSend.inactif
  const [state, setState] = useState<{ running: boolean; sent: number; remaining: number; error?: string; done?: boolean }>({ running: false, sent: 0, remaining: total })
  const [open, setOpen] = useState<'inactif' | 'actif' | null>(null)

  async function run() {
    const ok = await confirm({
      title: 'Envoyer les e-mails ?',
      message: `${plural(total, 'membre')} va recevoir un message personnel de ta boîte (un toutes les 7 secondes environ). Les comptes Driing ne reçoivent rien. Garde la page ouverte jusqu'à la fin.`,
      confirmLabel: 'Envoyer',
    })
    if (!ok) return
    setState(s => ({ ...s, running: true, error: undefined }))
    let sent = 0
    for (let round = 0; round < 20; round++) {
      const res = await sendMemberMails().catch(() => ({ sent: 0, remaining: 1, failed: 0, error: 'Connexion perdue. Réessaie.' }))
      sent += res.sent
      setState({ running: res.remaining > 0 && !res.error, sent, remaining: res.remaining, error: res.error })
      if (res.error || res.remaining <= 0) {
        if (!res.error) setState({ running: false, sent, remaining: 0, done: true })
        return
      }
    }
    setState(s => ({ ...s, running: false }))
  }

  const excluded = Object.entries(mail.excluded) as Array<[MemberMailExclusion, number]>

  return (
    <section style={s.card}>
      {dialog}
      <header style={s.head}>
        <span style={{ ...s.icon, background: tint('var(--accent-text)', 14), color: 'var(--accent-text)' }}><PaperPlaneTilt size={18} weight="fill" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={s.title}>Un e-mail à tes membres gratuits</h2>
          <p style={s.sub}>Une seule fois, depuis ta boîte, avec un lien pour ne plus en recevoir. Les réponses arrivent chez toi.</p>
        </div>
      </header>

      <div style={s.chips}>
        <span style={s.chip}><strong>{mail.toSend.inactif}</strong> inscrits sans logement : « je peux t&apos;aider à démarrer ? »</span>
        <span style={s.chip}><strong>{mail.toSend.actif}</strong> qui utilisent l&apos;app : le Standard</span>
      </div>

      {excluded.length > 0 && (
        <p style={s.excl}>
          <Prohibit size={14} weight="bold" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Ne reçoivent rien : {excluded.map(([k, n]) => `${n} ${EXCLUSION_LABEL[k]}`).join(' · ')}</span>
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['inactif', 'actif'] as const).map(k => (
          <button key={k} type="button" onClick={() => setOpen(open === k ? null : k)} style={{ ...s.tab, ...(open === k ? s.tabOn : {}) }}>
            Voir le message « {k === 'inactif' ? 'sans logement' : 'utilise l\'app'} »
          </button>
        ))}
      </div>
      {open && (
        <div style={s.preview}>
          <strong style={{ fontSize: 13.5 }}>Objet : {mail.preview[open].subject}</strong>
          <pre style={s.pre}>{mail.preview[open].body}</pre>
          <pre style={{ ...s.pre, fontSize: 12, color: 'var(--text-3)' }}>{mail.preview.footer}</pre>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Le prénom est celui du compte. Ta signature de la prospection est ajoutée.</span>
        </div>
      )}

      {!mail.ready ? (
        <p style={{ ...s.excl, color: AMBER }}><Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: 2 }} /> La boîte d&apos;envoi de la prospection n&apos;est pas configurée : rien ne peut partir.</p>
      ) : state.done ? (
        <p style={{ ...s.excl, color: 'var(--accent-text)' }}><CheckCircle size={14} weight="fill" style={{ flexShrink: 0, marginTop: 2 }} /> {plural(state.sent, 'e-mail envoyé', 'e-mails envoyés')}. Les réponses arrivent dans ta boîte.</p>
      ) : total === 0 ? (
        <p style={s.excl}><CheckCircle size={14} weight="fill" style={{ flexShrink: 0, marginTop: 2 }} /> Rien à envoyer : tout le monde l&apos;a déjà reçu ou en est exclu.</p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={run} disabled={state.running} style={{ ...s.btn, opacity: state.running ? 0.7 : 1 }}>
            <PaperPlaneTilt size={14} weight="bold" /> {state.running ? `Envoi… ${state.sent} / ${total}` : `Envoyer les ${plural(total, 'e-mail')}`}
          </button>
          {state.error && <span style={{ fontSize: 13, color: 'var(--danger)' }}>{state.error}{state.sent ? ` (${state.sent} déjà partis)` : ''}</span>}
        </div>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '6px 11px', borderRadius: 10, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: 13, color: 'var(--text-2)' },
  excl: { display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
  tab: { padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  tabOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  preview: { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' },
  pre: { margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
}
