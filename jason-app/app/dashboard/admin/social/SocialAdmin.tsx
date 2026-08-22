'use client'

import { useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FacebookLogo, InstagramLogo, Plus, ArrowClockwise, X, CheckCircle, XCircle, Clock,
} from '@phosphor-icons/react/dist/ssr'
import { createSocialPost, retrySocialPost, disconnectSocialAccount } from './actions'

export interface SocialAccountRow {
  id: string
  platform: 'facebook' | 'instagram'
  external_account_id: string
  display_name: string | null
  status: 'active' | 'expired' | 'revoked'
  token_expires_at: string | null
  created_at: string
}

export interface SocialPostTargetRow {
  id: string
  post_id: string
  platform: string
  status: 'pending' | 'publishing' | 'published' | 'failed'
  external_post_id: string | null
  error: string | null
  published_at: string | null
}

export interface SocialPostRow {
  id: string
  body: string
  media_urls: string[]
  platforms: string[]
  scheduled_at: string | null
  status: 'draft' | 'scheduled' | 'publishing' | 'done' | 'partial' | 'failed'
  created_at: string
  targets: SocialPostTargetRow[]
}

const PLATFORM_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  facebook: { label: 'Facebook', Icon: FacebookLogo, color: '#1877F2' },
  instagram: { label: 'Instagram', Icon: InstagramLogo, color: '#C13584' },
}

export default function SocialAdmin({ accounts, posts }: { accounts: SocialAccountRow[]; posts: SocialPostRow[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const metaConnected = searchParams.get('meta_connected')
  const metaError = searchParams.get('meta_error')

  const [body, setBody] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeAccounts = accounts.filter(a => a.status === 'active')
  const byPlatform = (p: string) => activeAccounts.filter(a => a.platform === p)

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createSocialPost({
        body,
        mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
        platforms,
        scheduledAt: scheduleMode === 'later' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setBody('')
        setMediaUrl('')
        setPlatforms([])
        setScheduleMode('now')
        setScheduledAt('')
        router.refresh()
      }
    })
  }

  function retry(postId: string) {
    startTransition(async () => {
      await retrySocialPost(postId)
      router.refresh()
    })
  }

  function disconnect(accountId: string) {
    startTransition(async () => {
      await disconnectSocialAccount(accountId)
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'var(--font-outfit), sans-serif' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 26, margin: '0 0 4px' }}>Réseaux sociaux</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          Publier ou programmer un post vers les comptes Facebook et Instagram de l'entreprise.
        </p>
      </div>

      {metaConnected && (
        <div style={s.banner('var(--success-1)', 'var(--success-bg)')}>Compte Meta connecté avec succès.</div>
      )}
      {metaError && (
        <div style={s.banner('#EF4444', 'rgba(239,68,68,0.1)')}>Échec de connexion Meta : {decodeURIComponent(metaError)}</div>
      )}

      {/* Comptes connectés */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>Comptes connectés</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(['facebook', 'instagram'] as const).map(platform => {
            const meta = PLATFORM_META[platform]
            const list = byPlatform(platform)
            return (
              <div key={platform} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.length === 0 ? (
                  <div style={s.accountRow}>
                    <span style={{ color: meta.color, display: 'flex' }}><meta.Icon size={20} weight="fill" /></span>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-muted)' }}>{meta.label} — aucun compte connecté</span>
                  </div>
                ) : (
                  list.map(account => (
                    <div key={account.id} style={s.accountRow}>
                      <span style={{ color: meta.color, display: 'flex' }}><meta.Icon size={20} weight="fill" /></span>
                      <span style={{ flex: 1, fontSize: 14 }}>{account.display_name ?? account.external_account_id}</span>
                      <button onClick={() => disconnect(account.id)} disabled={isPending} style={s.smallBtn}>
                        <X size={13} /> Déconnecter
                      </button>
                    </div>
                  ))
                )}
              </div>
            )
          })}
          <a href="/api/social/connect/meta" style={s.connectBtn}>
            <Plus size={15} /> Connecter Facebook / Instagram
          </a>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Une seule connexion suffit pour les deux — Instagram se rattache automatiquement s'il est lié à la Page Facebook choisie.
          </p>
        </div>
      </section>

      {/* Composeur */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>Nouveau post</h2>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Écris le texte du post…"
          rows={4}
          style={s.textarea}
        />
        <input
          type="url"
          value={mediaUrl}
          onChange={e => setMediaUrl(e.target.value)}
          placeholder="URL d'une image (obligatoire pour Instagram)"
          style={s.input}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {(['facebook', 'instagram'] as const).map(platform => {
            const meta = PLATFORM_META[platform]
            const available = byPlatform(platform).length > 0
            const active = platforms.includes(platform)
            return (
              <button
                key={platform}
                type="button"
                disabled={!available}
                onClick={() => togglePlatform(platform)}
                style={{
                  ...s.platformToggle,
                  opacity: available ? 1 : 0.4,
                  cursor: available ? 'pointer' : 'not-allowed',
                  borderColor: active ? meta.color : 'var(--border)',
                  background: active ? `${meta.color}18` : 'var(--bg-2)',
                }}
                title={available ? undefined : 'Connecte ce compte pour le sélectionner'}
              >
                <meta.Icon size={16} weight="fill" style={{ color: meta.color }} />
                {meta.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <label style={s.radioLabel}>
            <input type="radio" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} /> Publier maintenant
          </label>
          <label style={s.radioLabel}>
            <input type="radio" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} /> Programmer
          </label>
          {scheduleMode === 'later' && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              style={s.input}
            />
          )}
        </div>

        {error && <div style={s.banner('#EF4444', 'rgba(239,68,68,0.1)')}>{error}</div>}

        <button onClick={submit} disabled={isPending} style={s.primaryBtn}>
          {isPending ? 'Envoi…' : scheduleMode === 'now' ? 'Publier maintenant' : 'Programmer'}
        </button>
      </section>

      {/* Historique */}
      <section style={s.card}>
        <h2 style={s.cardTitle}>Posts récents</h2>
        {posts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucun post pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.map(post => (
              <div key={post.id} style={s.postRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <p style={{ margin: 0, fontSize: 14, flex: 1, whiteSpace: 'pre-wrap' as const }}>
                    {post.body || <em style={{ color: 'var(--text-muted)' }}>(image seule)</em>}
                  </p>
                  {(post.status === 'failed' || post.status === 'partial') && (
                    <button onClick={() => retry(post.id)} disabled={isPending} style={s.smallBtn}>
                      <ArrowClockwise size={13} /> Réessayer
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 8 }}>
                  {post.targets.map(t => {
                    const meta = PLATFORM_META[t.platform]
                    const StatusIcon = t.status === 'published' ? CheckCircle : t.status === 'failed' ? XCircle : Clock
                    const statusColor = t.status === 'published' ? 'var(--success-1)' : t.status === 'failed' ? '#EF4444' : 'var(--text-muted)'
                    return (
                      <span key={t.id} title={t.error ?? undefined} style={{ ...s.targetPill, color: statusColor }}>
                        {meta && <meta.Icon size={13} weight="fill" style={{ color: meta.color }} />}
                        <StatusIcon size={13} weight="fill" />
                        {t.status}
                      </span>
                    )
                  })}
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                  {post.scheduled_at ? `Programmé pour ${new Date(post.scheduled_at).toLocaleString('fr-FR')}` : new Date(post.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const s: Record<string, any> = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 20,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 17, margin: 0,
  },
  banner: (color: string, bg: string) => ({
    padding: '10px 14px', borderRadius: 10, fontSize: 13.5, color, background: bg,
  }),
  accountRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 10,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  connectBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    padding: '9px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
    background: 'var(--accent-text)', color: 'var(--bg)', textDecoration: 'none',
  },
  smallBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
    background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 14, resize: 'vertical' as const,
  },
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 13.5,
  },
  platformToggle: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '8px 13px', borderRadius: 9, border: '1px solid var(--border)',
    fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
  },
  radioLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer',
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    padding: '10px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600,
    background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
  },
  postRow: {
    padding: 14, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  targetPill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 100, fontSize: 11.5, fontWeight: 600,
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
}
