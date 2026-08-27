'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Info, MagnifyingGlass, Plugs } from '@phosphor-icons/react/dist/ssr'
import { createCommentTrigger, toggleCommentTrigger, deleteCommentTrigger, checkWebhookSubscriptions, registerAppWebhooks } from './actions'
import { PLATFORM_META } from './constants'

export interface CommentTriggerRow {
  id: string
  platform: 'facebook' | 'instagram' | 'both'
  keyword: string
  reply_message: string
  active: boolean
  created_at: string
}

export interface CommentReplyRow {
  id: string
  trigger_id: string | null
  platform: string
  comment_id: string
  commenter_name: string | null
  status: 'pending' | 'sent' | 'failed'
  error: string | null
  created_at: string
}

const PLATFORM_LABEL: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', both: 'Les deux' }

function fmtDateTime(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function SocialAutoReply({ triggers, recentReplies }: {
  triggers: CommentTriggerRow[]
  recentReplies: CommentReplyRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'both'>('both')
  const [keyword, setKeyword] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [diagResult, setDiagResult] = useState<string | null>(null)
  const [diagPending, setDiagPending] = useState(false)
  const [registerPending, setRegisterPending] = useState(false)

  function runDiagnostic() {
    setDiagPending(true)
    setDiagResult(null)
    startTransition(async () => {
      const res = await checkWebhookSubscriptions()
      setDiagResult(res.result ?? res.error ?? 'Erreur inconnue.')
      setDiagPending(false)
    })
  }

  function runRegister() {
    setRegisterPending(true)
    setDiagResult(null)
    startTransition(async () => {
      const res = await registerAppWebhooks()
      setDiagResult(res.result ?? res.error ?? 'Erreur inconnue.')
      setRegisterPending(false)
    })
  }

  function submit() {
    setFormError(null)
    startTransition(async () => {
      const res = await createCommentTrigger({ platform, keyword, replyMessage })
      if (res.error) {
        setFormError(res.error)
        return
      }
      setKeyword('')
      setReplyMessage('')
      router.refresh()
    })
  }

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleCommentTrigger(id, active)
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteCommentTrigger(id)
      router.refresh()
    })
  }

  const keywordByTrigger = new Map(triggers.map(t => [t.id, t.keyword]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={s.infoBox}>
        <Info size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Dès qu&apos;un commentaire contient le mot-clé, la personne reçoit automatiquement un message privé (Meta ne
          donne jamais l&apos;email d&apos;un commentateur — la réponse privée est la seule voie). Ne fonctionne que
          sur les commentaires récents (quelques jours), et seulement si le webhook Meta est configuré (voir
          app/api/social/webhook/meta).
        </span>
      </div>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Diagnostic</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Interroge Meta directement pour voir si tes comptes sont réellement abonnés au webhook (au lieu de deviner),
          ou enregistre le webhook de l&apos;app via l&apos;API si le dashboard Meta ne l&apos;a pas sauvegardé.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <button type="button" onClick={runDiagnostic} disabled={diagPending} style={{ ...s.primaryBtn, opacity: diagPending ? 0.6 : 1 }}>
            <MagnifyingGlass size={14} /> {diagPending ? 'Vérification…' : 'Diagnostiquer l’abonnement webhook'}
          </button>
          <button type="button" onClick={runRegister} disabled={registerPending} style={{ ...s.primaryBtn, background: 'var(--bg-2)', color: 'var(--text-2)', border: '1px solid var(--border)', opacity: registerPending ? 0.6 : 1 }}>
            <Plugs size={14} /> {registerPending ? 'Enregistrement…' : 'Enregistrer le webhook de l’app'}
          </button>
        </div>
        {diagResult && (
          <pre style={s.diagOutput}>{diagResult}</pre>
        )}
      </section>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Nouvelle réponse automatique</h2>
        {formError && <div style={s.banner}>{formError}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          {(['both', 'facebook', 'instagram'] as const).map(p => (
            <button
              key={p} type="button" onClick={() => setPlatform(p)}
              style={{ ...s.pill, ...(platform === p ? s.pillActive : {}) }}
            >
              {PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
        <input
          type="text" placeholder="Mot-clé à détecter (ex : GUIDE)"
          value={keyword} onChange={e => setKeyword(e.target.value)}
          style={s.input}
        />
        <textarea
          placeholder="Message envoyé en privé (colle le lien ici)"
          value={replyMessage} onChange={e => setReplyMessage(e.target.value)}
          rows={3} style={{ ...s.input, resize: 'vertical' as const }}
        />
        <button type="button" onClick={submit} disabled={isPending} style={{ ...s.primaryBtn, opacity: isPending ? 0.6 : 1 }}>
          <Plus size={15} /> Ajouter
        </button>
      </section>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Règles actives ({triggers.filter(t => t.active).length}/{triggers.length})</h2>
        {triggers.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucune règle pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {triggers.map(t => (
              <div key={t.id} style={s.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                    <span style={s.badge}>{PLATFORM_LABEL[t.platform]}</span>
                    <strong style={{ fontSize: 13.5 }}>{t.keyword}</strong>
                    {!t.active && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>(désactivée)</span>}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.reply_message}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => toggle(t.id, !t.active)} disabled={isPending} style={s.smallBtn}>
                    {t.active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button type="button" onClick={() => remove(t.id)} disabled={isPending} style={s.iconBtn} title="Supprimer">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Réponses envoyées récemment</h2>
        {recentReplies.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucune pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentReplies.map(r => {
              const meta = PLATFORM_META[r.platform]
              const statusColor = r.status === 'sent' ? 'var(--success-1)' : r.status === 'failed' ? '#EF4444' : 'var(--text-muted)'
              const statusLabel = r.status === 'sent' ? 'Envoyée' : r.status === 'failed' ? 'Échouée' : 'En cours'
              return (
                <div key={r.id} style={{ ...s.row, alignItems: 'center' }}>
                  {meta && <span style={{ color: meta.color, display: 'flex', flexShrink: 0 }}><meta.Icon size={16} weight="fill" /></span>}
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text)' }}>{r.commenter_name ?? 'Commentateur'}</span>
                    {r.trigger_id && keywordByTrigger.has(r.trigger_id) && (
                      <span style={{ color: 'var(--text-muted)' }}> · « {keywordByTrigger.get(r.trigger_id)} »</span>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}> · {fmtDateTime(r.created_at)}</span>
                    {r.error && <span style={{ color: '#EF4444' }}> · {r.error}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, flexShrink: 0 }}>{statusLabel}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

const s: Record<string, any> = {
  infoBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 16px',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 20,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, margin: 0 },
  banner: {
    padding: '10px 14px', borderRadius: 10, fontSize: 13.5,
    color: '#EF4444', background: 'rgba(239,68,68,0.1)',
  },
  pill: {
    padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500,
    border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-2)', cursor: 'pointer',
  },
  pillActive: { background: 'var(--accent-text)', color: 'var(--bg)', borderColor: 'var(--accent-text)' },
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)',
    background: 'var(--bg-2)', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit',
  },
  diagOutput: {
    fontSize: 12.5, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap' as const,
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9,
    padding: '10px 12px', margin: 0, color: 'var(--text)',
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
  },
  row: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '9px 12px', borderRadius: 9,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  badge: {
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
    background: 'var(--accent-bg-2)', color: 'var(--accent-text)',
  },
  smallBtn: {
    padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
  },
  iconBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer',
  },
}
