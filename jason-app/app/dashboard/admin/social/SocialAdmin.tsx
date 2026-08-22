'use client'

import { useRef, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  FacebookLogo, InstagramLogo, PinterestLogo, LinkedinLogo, XLogo,
  Plus, ArrowClockwise, X, CheckCircle, XCircle, Clock, UploadSimple, ImageSquare,
} from '@phosphor-icons/react/dist/ssr'
import { createSocialPost, retrySocialPost, disconnectSocialAccount, uploadSocialMedia } from './actions'

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
  facebook:  { label: 'Facebook',  Icon: FacebookLogo,  color: '#1877F2' },
  instagram: { label: 'Instagram', Icon: InstagramLogo, color: '#C13584' },
  pinterest: { label: 'Pinterest', Icon: PinterestLogo, color: '#E60023' },
  x:         { label: 'X',         Icon: XLogo,         color: 'var(--text)' },
  linkedin:  { label: 'LinkedIn',  Icon: LinkedinLogo,  color: '#0A66C2' },
}
const IMPLEMENTED_PLATFORMS = ['facebook', 'instagram']
const ALL_PLATFORMS = ['instagram', 'facebook', 'pinterest', 'x', 'linkedin']

export default function SocialAdmin({ accounts, posts }: { accounts: SocialAccountRow[]; posts: SocialPostRow[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const metaConnected = searchParams.get('meta_connected')
  const metaError = searchParams.get('meta_error')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [body, setBody] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeAccounts = accounts.filter(a => a.status === 'active')
  const byPlatform = (p: string) => activeAccounts.filter(a => a.platform === p)
  const activePreview = previewPlatform && platforms.includes(previewPlatform) ? previewPlatform : platforms[0]

  const upcoming = posts.filter(p => p.status === 'scheduled')
  const history = posts.filter(p => p.status !== 'scheduled')

  function togglePlatform(p: string) {
    if (!IMPLEMENTED_PLATFORMS.includes(p) || byPlatform(p).length === 0) return
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (mediaUrls.length + files.length > 10) {
      setError('Maximum 10 images (limite du carrousel Instagram).')
      return
    }
    setError(null)
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadSocialMedia(fd)
      if (res.ok && res.url) {
        setMediaUrls(prev => [...prev, res.url!])
      } else {
        setError(res.error ?? 'Échec de l\'upload.')
        break
      }
    }
    setUploading(false)
  }

  function removeImage(url: string) {
    setMediaUrls(prev => prev.filter(u => u !== url))
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createSocialPost({
        body,
        mediaUrls,
        platforms,
        scheduledAt: scheduleMode === 'later' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setBody('')
        setMediaUrls([])
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
          Compose avec tes visuels (carrousel jusqu'à 10 images), publie tout de suite ou programme — Facebook et Instagram partent tout seuls à l'heure prévue.
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
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
          {(['facebook', 'instagram'] as const).map(platform => {
            const meta = PLATFORM_META[platform]
            const list = byPlatform(platform)
            if (list.length === 0) {
              return (
                <div key={platform} style={s.accountRow}>
                  <span style={{ color: meta.color, display: 'flex' }}><meta.Icon size={18} weight="fill" /></span>
                  <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{meta.label} — non connecté</span>
                </div>
              )
            }
            return list.map(account => (
              <div key={account.id} style={s.accountRow}>
                <span style={{ color: meta.color, display: 'flex' }}><meta.Icon size={18} weight="fill" /></span>
                <span style={{ fontSize: 13.5 }}>{account.display_name ?? account.external_account_id}</span>
                <button onClick={() => disconnect(account.id)} disabled={isPending} style={s.iconBtn} title="Déconnecter">
                  <X size={13} />
                </button>
              </div>
            ))
          })}
          <a href="/api/social/connect/meta" style={s.connectBtn}>
            <Plus size={15} /> Connecter Facebook / Instagram
          </a>
        </div>
      </section>

      <div style={s.mainGrid}>
        {/* Composeur */}
        <section style={s.card}>
          <h2 style={s.cardTitle}>Créer une publication</h2>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {ALL_PLATFORMS.map(platform => {
              const meta = PLATFORM_META[platform]
              const implemented = IMPLEMENTED_PLATFORMS.includes(platform)
              const connected = byPlatform(platform).length > 0
              const usable = implemented && connected
              const active = platforms.includes(platform)
              return (
                <button
                  key={platform}
                  type="button"
                  disabled={!usable}
                  onClick={() => { togglePlatform(platform); if (!active) setPreviewPlatform(platform) }}
                  style={{
                    ...s.platformToggle,
                    opacity: usable ? 1 : 0.4,
                    cursor: usable ? 'pointer' : 'not-allowed',
                    borderColor: active ? meta.color : 'var(--border)',
                    background: active ? `${meta.color}18` : 'var(--bg-2)',
                  }}
                  title={!implemented ? 'Bientôt disponible' : !connected ? 'Connecte ce compte pour le sélectionner' : undefined}
                >
                  <meta.Icon size={16} weight="fill" style={{ color: meta.color }} />
                  {meta.label}
                </button>
              )
            })}
          </div>

          {/* Zone glisser-déposer */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            style={{ ...s.dropzone, borderColor: dragOver ? 'var(--accent-text)' : 'var(--border)', background: dragOver ? 'var(--bg-2)' : 'transparent' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={e => handleFiles(e.target.files)}
              style={{ display: 'none' }}
            />
            <UploadSimple size={22} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              {uploading ? 'Envoi en cours…' : 'Glisse tes visuels ici (ou clique) — plusieurs images = carrousel'}
            </span>
          </div>

          {mediaUrls.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {mediaUrls.map(url => (
                <div key={url} style={s.thumbWrap}>
                  <Image src={url} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
                  <button onClick={() => removeImage(url)} style={s.thumbRemove} title="Retirer">
                    <X size={11} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Le texte de ton post…"
            rows={5}
            style={s.textarea}
          />
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{body.length} caractères</span>

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

          <button onClick={submit} disabled={isPending || uploading} style={s.primaryBtn}>
            {isPending ? 'Envoi…' : scheduleMode === 'now' ? 'Publier maintenant' : 'Programmer'}
          </button>
        </section>

        {/* Aperçu + historique */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={s.card}>
            <h2 style={s.cardTitle}>Aperçu</h2>
            {platforms.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Sélectionne un réseau pour voir l'aperçu.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6 }}>
                  {platforms.map(p => {
                    const meta = PLATFORM_META[p]
                    return (
                      <button
                        key={p}
                        onClick={() => setPreviewPlatform(p)}
                        style={{ ...s.previewTab, ...(activePreview === p ? { borderColor: meta.color, color: meta.color } : {}) }}
                      >
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
                <div style={s.previewCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                    {activePreview && (
                      <span style={{ color: PLATFORM_META[activePreview].color, display: 'flex' }}>
                        {(() => { const I = PLATFORM_META[activePreview].Icon; return <I size={20} weight="fill" /> })()}
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {byPlatform(activePreview ?? '')[0]?.display_name ?? 'Ta page'}
                    </span>
                  </div>
                  <div style={s.previewMedia}>
                    {mediaUrls.length > 0 ? (
                      <Image src={mediaUrls[0]} alt="" fill sizes="320px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <ImageSquare size={28} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <p style={{ padding: '10px 12px', margin: 0, fontSize: 13, whiteSpace: 'pre-wrap' as const }}>
                    {body || <span style={{ color: 'var(--text-muted)' }}>Ton texte apparaîtra ici…</span>}
                  </p>
                </div>
              </>
            )}
          </section>

          <section style={s.card}>
            <h2 style={s.cardTitle}>À venir ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Rien de programmé.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(post => <PostCard key={post.id} post={post} onRetry={retry} disabled={isPending} />)}
              </div>
            )}
          </section>

          <section style={s.card}>
            <h2 style={s.cardTitle}>Publiées récemment</h2>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucun post pour le moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' as const }}>
                {history.map(post => <PostCard key={post.id} post={post} onRetry={retry} disabled={isPending} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, onRetry, disabled }: { post: SocialPostRow; onRetry: (id: string) => void; disabled: boolean }) {
  const thumb = post.media_urls[0]
  return (
    <div style={s.postRow}>
      <div style={{ display: 'flex', gap: 10 }}>
        {thumb && (
          <div style={s.postThumb}>
            <Image src={thumb} alt="" fill sizes="48px" style={{ objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontSize: 13.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' as const, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
              {post.body || <em style={{ color: 'var(--text-muted)' }}>(image seule)</em>}
            </p>
            {(post.status === 'failed' || post.status === 'partial') && (
              <button onClick={() => onRetry(post.id)} disabled={disabled} style={s.smallBtn}>
                <ArrowClockwise size={13} /> Réessayer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 6 }}>
            {post.targets.map(t => {
              const meta = PLATFORM_META[t.platform]
              const StatusIcon = t.status === 'published' ? CheckCircle : t.status === 'failed' ? XCircle : Clock
              const statusColor = t.status === 'published' ? 'var(--success-1)' : t.status === 'failed' ? '#EF4444' : 'var(--text-muted)'
              return (
                <span key={t.id} title={t.error ?? undefined} style={{ ...s.targetPill, color: statusColor }}>
                  {meta && <meta.Icon size={12} weight="fill" style={{ color: meta.color }} />}
                  <StatusIcon size={12} weight="fill" />
                  {t.status}
                </span>
              )
            })}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString('fr-FR') : new Date(post.created_at).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
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
  mainGrid: {
    display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 20,
  },
  accountRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 9,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  iconBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 20, height: 20, borderRadius: 6, border: 'none',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
  },
  connectBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    background: 'var(--accent-text)', color: 'var(--bg)', textDecoration: 'none',
  },
  smallBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
    background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)',
    cursor: 'pointer', flexShrink: 0,
  },
  dropzone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '26px 16px', borderRadius: 12, border: '1.5px dashed var(--border)',
    cursor: 'pointer', textAlign: 'center' as const, transition: 'background 0.15s, border-color 0.15s',
  },
  thumbWrap: {
    position: 'relative' as const, width: 64, height: 64, borderRadius: 8, overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  thumbRemove: {
    position: 'absolute' as const, top: 3, right: 3,
    width: 18, height: 18, borderRadius: '50%', border: 'none',
    background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 14, resize: 'vertical' as const,
  },
  input: {
    padding: '9px 12px', borderRadius: 9,
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
  previewTab: {
    padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  previewCard: {
    borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-2)',
  },
  previewMedia: {
    position: 'relative' as const, width: '100%', aspectRatio: '1 / 1',
    background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  postRow: {
    padding: 12, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  postThumb: {
    position: 'relative' as const, width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
    flexShrink: 0, border: '1px solid var(--border)',
  },
  targetPill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600,
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
}
