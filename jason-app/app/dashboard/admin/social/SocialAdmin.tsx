'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Plus, ArrowClockwise, X, CheckCircle, XCircle, Clock, UploadSimple, ImageSquare,
  Heart, ChatCircle, CalendarBlank, PencilSimple, Check, ShareNetwork, PaperPlaneTilt, ChartBar, ChatsCircle,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import { nextDispatchRun } from '@/lib/social/dispatch-time'
import { createSocialPost, updateSocialPost, retrySocialPost, disconnectSocialAccount, uploadSocialMedia, refreshPostStats, refreshAllStats, setSocialCadence, markTargetPublished, markTargetFailed } from './actions'
import { CalendarInput, TimePickerInput } from '@/components/ui/CalendarInput'
import SocialStats from './SocialStats'
import SocialAutoReply, { type CommentTriggerRow, type CommentReplyRow } from './SocialAutoReply'
import { PLATFORM_META, IMPLEMENTED_PLATFORMS, ALL_PLATFORMS, TARGET_STATUS_LABEL } from './constants'

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
  body_override: string | null
  like_count: number | null
  comment_count: number | null
  stats_updated_at: string | null
}

export interface CadenceConfig {
  weekdays: number[] // ISO : 1 = lundi ... 7 = dimanche
  timeOfDay: string  // "HH:MM"
}

const WEEKDAY_LABELS: Array<{ iso: number; label: string }> = [
  { iso: 1, label: 'Lun' }, { iso: 2, label: 'Mar' }, { iso: 3, label: 'Mer' },
  { iso: 4, label: 'Jeu' }, { iso: 5, label: 'Ven' }, { iso: 6, label: 'Sam' }, { iso: 7, label: 'Dim' },
]

// Prochain créneau qui matche la cadence, dans le futur, et qui n'entre pas
// en collision avec un post déjà programmé (± 1 min).
function nextFreeSlot(cadence: CadenceConfig, existingScheduled: string[]): Date | null {
  if (cadence.weekdays.length === 0) return null
  const [h, m] = cadence.timeOfDay.split(':').map(Number)
  const taken = new Set(existingScheduled.map(iso => Math.floor(new Date(iso).getTime() / 60000)))
  const now = new Date()
  for (let i = 0; i < 21; i++) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + i)
    candidate.setHours(h, m, 0, 0)
    const isoDay = candidate.getDay() === 0 ? 7 : candidate.getDay()
    if (!cadence.weekdays.includes(isoDay)) continue
    if (candidate.getTime() <= now.getTime()) continue
    if (taken.has(Math.floor(candidate.getTime() / 60000))) continue
    return candidate
  }
  return null
}

// Date lisible, toujours à l'heure de Paris
function fmtParis(d: Date): string {
  return d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

// Format compatible avec la valeur d'un <input type="datetime-local"> (heure locale, sans timezone).
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function todayDateValue(): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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

export default function SocialAdmin({ accounts, posts, cadence, commentTriggers, commentReplies }: {
  accounts: SocialAccountRow[]
  posts: SocialPostRow[]
  cadence: CadenceConfig | null
  commentTriggers: CommentTriggerRow[]
  commentReplies: CommentReplyRow[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const metaConnected = searchParams.get('meta_connected')
  const metaError = searchParams.get('meta_error')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultPlatforms = IMPLEMENTED_PLATFORMS.filter(p => accounts.some(a => a.platform === p && a.status === 'active'))

  const [body, setBody] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [platforms, setPlatforms] = useState<string[]>(defaultPlatforms)
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(defaultPlatforms[0] ?? null)
  const [previewMediaIndex, setPreviewMediaIndex] = useState(0)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [view, setView] = useState<'composer' | 'stats' | 'auto_reply'>('composer')

  const [showPerNetworkText, setShowPerNetworkText] = useState(true)
  const [bodyOverrides, setBodyOverrides] = useState<Record<string, string>>({})

  const [editingCadence, setEditingCadence] = useState(false)
  const [cadenceWeekdays, setCadenceWeekdays] = useState<number[]>(cadence?.weekdays ?? [1, 3, 5])
  const [cadenceTime, setCadenceTime] = useState(cadence?.timeOfDay ?? '18:00')

  const activeAccounts = accounts.filter(a => a.status === 'active')
  const byPlatform = (p: string) => activeAccounts.filter(a => a.platform === p)
  const orderedPlatforms = ALL_PLATFORMS.filter(p => platforms.includes(p))
  const activePreview = previewPlatform && platforms.includes(previewPlatform) ? previewPlatform : orderedPlatforms[0]
  const previewText = showPerNetworkText ? (bodyOverrides[activePreview ?? ''] ?? '') : body

  const [scheduledDate, scheduledTime] = scheduledAt.split('T')
  function setScheduledDate(d: string) {
    setScheduledAt(`${d}T${scheduledTime || '18:00'}`)
  }
  function setScheduledTime(t: string) {
    setScheduledAt(`${scheduledDate || todayDateValue()}T${t}`)
  }

  const upcoming = posts.filter(p => p.status === 'scheduled')
    .sort((x, y) => (x.scheduled_at ?? '').localeCompare(y.scheduled_at ?? ''))
  const history = posts.filter(p => p.status !== 'scheduled')
  const nextPost = upcoming[0] ?? null
  const publishedCount = posts.filter(p => p.status === 'done' || p.status === 'partial').length

  // Calculé seulement dans le navigateur : il dépend de l'heure courante et du
  // fuseau (serveur Vercel en UTC, navigateur à Paris). Calculé aussi au rendu
  // serveur, le texte différait et React levait l'erreur #425.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const freeSlot = mounted && cadence ? nextFreeSlot(cadence, upcoming.map(p => p.scheduled_at!).filter(Boolean)) : null

  function applyFreeSlot() {
    if (!freeSlot) return
    setScheduleMode('later')
    setScheduledAt(toDatetimeLocalValue(freeSlot))
  }

  function saveCadence() {
    startTransition(async () => {
      const result = await setSocialCadence({ weekdays: cadenceWeekdays, timeOfDay: cadenceTime })
      if (!result.error) { setEditingCadence(false); router.refresh() }
    })
  }

  function refreshStats(postId: string) {
    startTransition(async () => {
      await refreshPostStats(postId)
      router.refresh()
    })
  }

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

  function toggleSameText() {
    if (showPerNetworkText) {
      // passage à un texte unique : on récupère le premier texte par réseau déjà rempli
      if (!body.trim()) {
        const firstOverride = orderedPlatforms.map(p => bodyOverrides[p]).find(v => v?.trim())
        if (firstOverride) setBody(firstOverride)
      }
    } else if (body.trim()) {
      // retour au texte par réseau : on pré-remplit les cases vides avec le texte unique
      setBodyOverrides(prev => {
        const merged = { ...prev }
        for (const p of orderedPlatforms) {
          if (!merged[p]?.trim()) merged[p] = body
        }
        return merged
      })
    }
    setShowPerNetworkText(v => !v)
  }

  function startEdit(post: SocialPostRow) {
    setEditingPostId(post.id)
    setBody(post.body)
    setMediaUrls(post.media_urls)
    setPreviewMediaIndex(0)
    setPlatforms(post.platforms)
    setPreviewPlatform(post.platforms[0] ?? null)
    const overrides: Record<string, string> = {}
    let anyOverride = false
    for (const t of post.targets) {
      if (t.body_override) { overrides[t.platform] = t.body_override; anyOverride = true }
    }
    setBodyOverrides(overrides)
    setShowPerNetworkText(anyOverride)
    setScheduleMode('later')
    setScheduledAt(post.scheduled_at ? toDatetimeLocalValue(new Date(post.scheduled_at)) : '')
    setError(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingPostId(null)
    setBody('')
    setMediaUrls([])
    setPlatforms(defaultPlatforms)
    setBodyOverrides({})
    setShowPerNetworkText(true)
    setScheduleMode('now')
    setScheduledAt('')
    setError(null)
  }

  function removeImage(url: string) {
    setMediaUrls(prev => prev.filter(u => u !== url))
    setPreviewMediaIndex(0)
  }

  function moveImage(index: number, dir: -1 | 1) {
    setMediaUrls(prev => {
      const target = index + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function submit() {
    setError(null)
    const effectiveBody = showPerNetworkText
      ? (orderedPlatforms.map(p => bodyOverrides[p]).find(v => v?.trim()) ?? '')
      : body
    const payload = {
      body: effectiveBody,
      mediaUrls,
      platforms,
      bodyOverrides: showPerNetworkText ? bodyOverrides : {},
      scheduledAt: scheduleMode === 'later' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }
    startTransition(async () => {
      const result = editingPostId
        ? await updateSocialPost(editingPostId, payload)
        : await createSocialPost(payload)
      if (result.error) {
        setError(result.error)
      } else {
        setEditingPostId(null)
        setBody('')
        setMediaUrls([])
        setPlatforms(defaultPlatforms)
        setBodyOverrides({})
        setShowPerNetworkText(true)
        setScheduleMode('now')
        setScheduledAt('')
        router.refresh()
      }
    })
  }

  // Ces trois actions renvoient le résultat au lieu de le jeter (comme
  // avant) : sur mobile/webview, window.prompt/confirm/alert peuvent ne
  // rien afficher et renvoyer immédiatement — un échec silencieux du
  // serveur (token expiré, etc.) passait totalement inaperçu, ce qui
  // rendait ces boutons impossibles à déboguer depuis un retour utilisateur
  // ("ça ne marche pas"). Chaque PostCard affiche maintenant l'erreur
  // réelle, sans dépendre d'aucune boîte de dialogue native.
  async function retry(postId: string) {
    const result = await retrySocialPost(postId)
    router.refresh()
    return result
  }

  async function markPublished(targetId: string) {
    const result = await markTargetPublished(targetId)
    router.refresh()
    return result
  }

  async function markFailed(targetId: string) {
    const result = await markTargetFailed(targetId)
    router.refresh()
    return result
  }

  function disconnect(accountId: string) {
    startTransition(async () => {
      await disconnectSocialAccount(accountId)
      router.refresh()
    })
  }

  function refreshAll() {
    startTransition(async () => {
      await refreshAllStats()
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'var(--font-outfit), sans-serif' }}>
      <HubHero
        eyebrowIcon={<ShareNetwork size={14} weight="bold" />}
        eyebrow="Admin · Réseaux sociaux"
        title={<>Tes posts Facebook et Instagram, <HeroEm>préparés d&apos;avance</HeroEm></>}
        desc="Compose une fois avec tes visuels (carrousel jusqu'à 10 images), un texte par réseau si tu veux, puis publie tout de suite ou programme."
        steps={[
          ['Compose', 'le post et ajoute tes visuels'],
          ['Programme', 'sur ta cadence ou publie maintenant'],
          ['Suis', 'likes, commentaires et réponses automatiques'],
        ]}
        aside={
          <div style={{ ...heroCard, gap: 12, flex: '1 1 100%', minWidth: 0 }}>
            <div style={s.asideLabel}>Tes comptes</div>
            {(['facebook', 'instagram'] as const).map(platform => {
              const meta = PLATFORM_META[platform]
              const list = byPlatform(platform)
              return (
                <div key={platform} style={s.accountRow}>
                  <span style={{ color: meta.color, display: 'flex' }}><meta.Icon size={18} weight="fill" /></span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {list.length === 0
                      ? <span style={{ color: 'var(--text-muted)' }}>{meta.label} : non connecté</span>
                      : list.map(a => a.display_name ?? a.external_account_id).join(', ')}
                  </span>
                  {list.map(account => (
                    <button key={account.id} onClick={() => disconnect(account.id)} disabled={isPending} style={s.iconBtn} title={`Déconnecter ${meta.label}`}>
                      <X size={13} />
                    </button>
                  ))}
                </div>
              )
            })}
            {(byPlatform('facebook').length === 0 || byPlatform('instagram').length === 0) ? (
              <a href="/api/social/connect/meta" style={s.connectBtn}>
                <Plus size={15} /> Connecter Facebook / Instagram
              </a>
            ) : (
              // Relancer l'OAuth rafraîchit les permissions (ex : nouvelles
              // permissions ajoutées côté Meta, comme pages_manage_metadata) :
              // le token stocké n'embarque que celles accordées à la connexion.
              <a href="/api/social/connect/meta" style={s.reconnectLink}>
                <ArrowClockwise size={13} /> Reconnecter (rafraîchir les permissions)
              </a>
            )}
            <div style={s.asideSep} />
            <div style={s.asideLabel}>Prochaine publication</div>
            {nextPost ? (
              <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45 }}>
                <strong>{nextPost.scheduled_at ? fmtParis(new Date(nextPost.scheduled_at)) : ''}</strong>
                {nextPost.scheduled_at && (
                  <div style={{ fontSize: 12, color: '#8A5A12' }}>part au passage du {fmtParis(nextDispatchRun(new Date(nextPost.scheduled_at)))}</div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nextPost.body || '(image seule)'}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Rien de programmé</span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {upcoming.length} programmée{upcoming.length > 1 ? 's' : ''} · {publishedCount} publiée{publishedCount > 1 ? 's' : ''}
            </span>
          </div>
        }
      />

      {metaConnected && (
        <div style={s.banner('var(--accent-text)', 'var(--accent-bg)')}>Compte Meta connecté.</div>
      )}
      {metaError && (
        <div style={s.banner('var(--danger-text)', 'var(--danger-bg)')}>Échec de connexion Meta : {decodeURIComponent(metaError)}</div>
      )}

      {/* Onglets */}
      <div style={s.tabRow}>
        {([
          ['composer', 'Composer', PaperPlaneTilt],
          ['stats', 'Statistiques', ChartBar],
          ['auto_reply', 'Réponses auto', ChatsCircle],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setView(key)} style={{ ...s.tabBtn, ...(view === key ? s.tabBtnActive : {}) }}>
            <Icon size={15} weight={view === key ? 'fill' : 'regular'} /> {label}
          </button>
        ))}
      </div>

      {view === 'stats' && (
        <SocialStats posts={posts} onRefreshAll={refreshAll} refreshing={isPending} />
      )}

      {view === 'auto_reply' && (
        <SocialAutoReply triggers={commentTriggers} recentReplies={commentReplies} />
      )}

      {view === 'composer' && (
      <div style={s.mainGrid} className="jm-social-grid">
        {/* Composeur */}
        <section style={s.card}>
          <h2 style={s.cardTitle}>{editingPostId ? 'Modifier la publication programmée' : 'Créer une publication'}</h2>

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
                    background: active ? `color-mix(in srgb, ${meta.color} 12%, transparent)` : 'var(--bg-2)',
                    color: active ? meta.color : 'var(--text)',
                  }}
                  title={!implemented ? 'Bientôt disponible' : !connected ? 'Connecte ce compte pour le sélectionner' : undefined}
                >
                  <meta.Icon size={16} weight="fill" style={{ color: meta.color }} />
                  {meta.label}
                </button>
              )
            })}
          </div>

          {/* Zone glisser-déposer — visuels créés ailleurs (Claude Design, photos...) */}
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
              {uploading ? 'Envoi en cours…' : 'Glisse tes visuels ici ou clique : plusieurs images font un carrousel'}
            </span>
          </div>

          {mediaUrls.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {mediaUrls.map((url, i) => (
                <div key={url} style={s.thumbWrap}>
                  <Image src={url} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
                  <span style={s.thumbIndex}>{i + 1}</span>
                  <button onClick={() => removeImage(url)} style={s.thumbRemove} title="Retirer">
                    <X size={11} weight="bold" />
                  </button>
                  {mediaUrls.length > 1 && (
                    <div style={s.thumbMoveRow}>
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        style={{ ...s.thumbMoveBtn, opacity: i === 0 ? 0.3 : 1 }}
                        title="Déplacer avant"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === mediaUrls.length - 1}
                        style={{ ...s.thumbMoveBtn, opacity: i === mediaUrls.length - 1 ? 0.3 : 1 }}
                        title="Déplacer après"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {mediaUrls.length > 1 && (
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
              Ordre du carrousel : utilise les flèches ‹ › sur chaque image pour la déplacer.
            </p>
          )}

          {showPerNetworkText ? (
            orderedPlatforms.map(p => {
              const meta = PLATFORM_META[p]
              const text = bodyOverrides[p] ?? ''
              return (
                <div key={p} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: meta.color }}>
                    <meta.Icon size={14} weight="fill" /> {meta.label}
                  </span>
                  <textarea
                    value={text}
                    onChange={e => setBodyOverrides(prev => ({ ...prev, [p]: e.target.value }))}
                    placeholder={`Légende ${meta.label}…`}
                    rows={4}
                    style={s.textarea}
                  />
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{text.length} caractères</span>
                </div>
              )
            })
          ) : (
            <>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Le texte de ton post…"
                rows={5}
                style={s.textarea}
              />
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{body.length} caractères</span>
            </>
          )}

          {orderedPlatforms.length > 0 && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!showPerNetworkText} onChange={toggleSameText} />
              Texte identique pour tous les réseaux
            </label>
          )}

          {/* Cadence */}
          <div style={s.cadenceBox}>
            {editingCadence ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {WEEKDAY_LABELS.map(({ iso, label }) => {
                    const active = cadenceWeekdays.includes(iso)
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setCadenceWeekdays(prev => active ? prev.filter(d => d !== iso) : [...prev, iso].sort())}
                        style={{ ...s.dayChip, ...(active ? { background: 'var(--accent-text)', color: 'var(--bg)', borderColor: 'var(--accent-text)' } : {}) }}
                      >
                        {label}
                      </button>
                    )
                  })}
                  <input type="time" value={cadenceTime} onChange={e => setCadenceTime(e.target.value)} style={s.input} />
                </div>
                <button type="button" onClick={saveCadence} disabled={isPending} style={s.smallBtn}>
                  <Check size={13} /> Enregistrer la cadence
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                <CalendarBlank size={15} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 13 }}>
                  Cadence {cadence ? <strong>{WEEKDAY_LABELS.filter(w => cadence.weekdays.includes(w.iso)).map(w => w.label).join(' · ')} à {cadence.timeOfDay}</strong> : <span style={{ color: 'var(--text-muted)' }}>non définie</span>}
                </span>
                <button type="button" onClick={() => setEditingCadence(true)} style={s.linkBtn}>
                  <PencilSimple size={12} /> Modifier
                </button>
                {freeSlot && (
                  <button type="button" onClick={applyFreeSlot} style={s.freeSlotBtn}>
                    Prochain créneau libre : {freeSlot.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <label style={s.radioLabel}>
              <input type="radio" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} /> Publier maintenant
            </label>
            <label style={s.radioLabel}>
              <input type="radio" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} /> Programmer
            </label>
            {scheduleMode === 'later' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                <div style={{ width: 190 }}>
                  <CalendarInput value={scheduledDate ?? ''} onChange={setScheduledDate} placeholder="Choisir une date" />
                </div>
                <div style={{ width: 130 }}>
                  <TimePickerInput value={scheduledTime ?? ''} onChange={setScheduledTime} placeholder="Heure" />
                </div>
              </div>
            )}
          </div>
          {scheduleMode === 'later' && mounted && scheduledAt && (
            <p style={s.dispatchNote}>
              <Clock size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Les posts programmés partent au passage automatique de chaque matin : celui-ci partira le{' '}
                <strong>{fmtParis(nextDispatchRun(new Date(scheduledAt)))}</strong> (heure de Paris), dans l&apos;heure qui suit.
              </span>
            </p>
          )}

          {error && <div style={s.banner('var(--danger-text)', 'var(--danger-bg)')}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={submit} disabled={isPending || uploading} style={s.primaryBtn}>
              {isPending ? 'Envoi…' : editingPostId ? 'Enregistrer les modifications' : scheduleMode === 'now' ? 'Publier maintenant' : 'Programmer'}
            </button>
            {editingPostId && (
              <button type="button" onClick={cancelEdit} disabled={isPending} style={s.smallBtn}>
                Annuler
              </button>
            )}
          </div>
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
                  {orderedPlatforms.map(p => {
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
                      <>
                        <Image
                          key={mediaUrls[Math.min(previewMediaIndex, mediaUrls.length - 1)]}
                          src={mediaUrls[Math.min(previewMediaIndex, mediaUrls.length - 1)]}
                          alt=""
                          fill
                          sizes="320px"
                          style={{ objectFit: 'cover' }}
                        />
                        {mediaUrls.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewMediaIndex(i => (i - 1 + mediaUrls.length) % mediaUrls.length)}
                              style={{ ...s.carouselNavBtn, left: 8 }}
                              title="Image précédente"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewMediaIndex(i => (i + 1) % mediaUrls.length)}
                              style={{ ...s.carouselNavBtn, right: 8 }}
                              title="Image suivante"
                            >
                              ›
                            </button>
                            <div style={s.carouselDots}>
                              {mediaUrls.map((u, i) => (
                                <span
                                  key={u}
                                  style={{
                                    ...s.carouselDot,
                                    background: i === previewMediaIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <ImageSquare size={28} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <p style={{ padding: '10px 12px', margin: 0, fontSize: 13, whiteSpace: 'pre-wrap' as const }}>
                    {previewText || <span style={{ color: 'var(--text-muted)' }}>Ton texte apparaîtra ici…</span>}
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
                {upcoming.map(post => <PostCard key={post.id} post={post} onRetry={retry} onEdit={startEdit} onRefreshStats={refreshStats} onMarkPublished={markPublished} onMarkFailed={markFailed} disabled={isPending} />)}
              </div>
            )}
          </section>

          <section style={s.card}>
            <h2 style={s.cardTitle}>Publiées récemment</h2>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucun post pour le moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' as const }}>
                {history.map(post => <PostCard key={post.id} post={post} onRetry={retry} onEdit={startEdit} onRefreshStats={refreshStats} onMarkPublished={markPublished} onMarkFailed={markFailed} disabled={isPending} />)}
              </div>
            )}
          </section>
        </div>
      </div>
      )}

      {/* mainGrid n'avait aucun point de rupture mobile : sur un écran
          étroit, les deux colonnes (1.1fr/0.9fr) se répartissaient quand
          même côte à côte au lieu de s'empiler, écrasant le composeur. */}
      <style>{`
        @media (max-width: 860px) {
          .jm-social-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function PostCard({ post, onRetry, onEdit, onRefreshStats, onMarkPublished, onMarkFailed, disabled }: {
  post: SocialPostRow
  onRetry: (id: string) => Promise<{ error?: string }>
  onEdit: (post: SocialPostRow) => void
  onRefreshStats: (id: string) => void
  onMarkPublished: (targetId: string) => Promise<{ error?: string }>
  onMarkFailed: (targetId: string) => Promise<{ error?: string }>
  disabled: boolean
}) {
  const thumb = post.media_urls[0]
  const hasPublished = post.targets.some(t => t.status === 'published')
  const totalLikes = post.targets.reduce((sum, t) => sum + (t.like_count ?? 0), 0)
  const totalComments = post.targets.reduce((sum, t) => sum + (t.comment_count ?? 0), 0)
  const statsKnown = post.targets.some(t => t.stats_updated_at)

  // État local à la carte : les actions (Relancer, ✓, ✗) affichaient leur
  // résultat nulle part avant — un échec côté serveur (session expirée,
  // ligne introuvable...) passait inaperçu et le bouton semblait juste ne
  // rien faire. On garde le retour de l'action ici pour l'afficher.
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function run(action: () => Promise<{ error?: string }>) {
    setBusy(true)
    setActionError(null)
    const result = await action()
    setBusy(false)
    if (result?.error) setActionError(result.error)
  }

  const isDisabled = disabled || busy

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
            {post.status === 'scheduled' && (
              <button onClick={() => onEdit(post)} disabled={disabled} style={s.smallBtn}>
                <PencilSimple size={13} /> Modifier
              </button>
            )}
            {(post.status === 'failed' || post.status === 'partial' || post.status === 'publishing') && (
              <button onClick={() => run(() => onRetry(post.id))} disabled={isDisabled} style={s.smallBtn}>
                <ArrowClockwise size={13} />
                {busy ? '...' : post.status === 'publishing' ? 'Relancer' : 'Réessayer'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 6, alignItems: 'center' }}>
            {post.targets.map(t => {
              const meta = PLATFORM_META[t.platform]
              const StatusIcon = t.status === 'published' ? CheckCircle : t.status === 'failed' ? XCircle : Clock
              const statusColor = t.status === 'published' ? 'var(--accent-text)' : t.status === 'failed' ? 'var(--danger-text)' : 'var(--text-muted)'
              return (
                <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span title={t.error ?? undefined} style={{ ...s.targetPill, color: statusColor }}>
                    {meta && <meta.Icon size={12} weight="fill" style={{ color: meta.color }} />}
                    <StatusIcon size={12} weight="fill" />
                    {TARGET_STATUS_LABEL[t.status] ?? t.status}
                  </span>
                  {t.status === 'pending' && (
                    <button
                      onClick={() => run(() => onMarkPublished(t.id))} disabled={isDisabled}
                      style={{ ...s.iconBtn, width: 'auto', padding: '0 6px' }}
                      title="Publiée pour de vrai (vérifié à l'œil) mais le statut n'a pas suivi : corrige seulement l'affichage, ne republie pas"
                    >
                      <Check size={11} />
                    </button>
                  )}
                  {t.status === 'published' && (
                    <button
                      onClick={() => run(() => onMarkFailed(t.id))} disabled={isDisabled}
                      style={{ ...s.iconBtn, width: 'auto', padding: '0 6px' }}
                      title="Rien n'a été publié sur ce réseau (vérifié à l'œil) : repasse en échec pour pouvoir réessayer, ne supprime rien côté Meta"
                    >
                      <XCircle size={11} />
                    </button>
                  )}
                </span>
              )
            })}
            {statsKnown && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Heart size={11} weight="fill" /> {totalLikes}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><ChatCircle size={11} weight="fill" /> {totalComments}</span>
              </span>
            )}
            {hasPublished && (
              <button onClick={() => onRefreshStats(post.id)} disabled={isDisabled} style={s.iconBtn} title="Actualiser les stats">
                <ArrowClockwise size={12} />
              </button>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {(() => {
                // Priorité : vraie date de publication (le plus fiable une
                // fois publié) > date programmée (à venir) > date de
                // création (dernier recours) — auparavant on retombait
                // directement sur created_at dès que scheduled_at était vidé
                // par "Publier maintenant", affichant une date de plusieurs
                // jours avant la publication réelle.
                const publishedAt = post.targets.find(t => t.published_at)?.published_at
                const display = publishedAt ?? post.scheduled_at ?? post.created_at
                return fmtParis(new Date(display))
              })()}
              {post.status === 'scheduled' && post.scheduled_at && (
                <> · part vers le {fmtParis(nextDispatchRun(new Date(post.scheduled_at)))}</>
              )}
            </span>
          </div>
          {post.targets.filter(t => t.status === 'failed' && t.error).map(t => {
            const meta = PLATFORM_META[t.platform]
            return (
              <p key={t.id} style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--danger-text)', display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                {meta && <meta.Icon size={11} weight="fill" style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />}
                <span>{t.error}</span>
              </p>
            )
          })}
          {actionError && (
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--danger-text)', fontWeight: 600 }}>
              Échec de l&apos;action : {actionError}
            </p>
          )}
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
  // Pas de borderBottom partagé ici : une fine ligne grise sous tous les
  // onglets se confondait visuellement avec le soulignement coloré de
  // l'onglet actif, laissant croire que tous étaient sélectionnés.
  tabRow: {
    display: 'flex', gap: 6, paddingBottom: 0, overflowX: 'auto' as const,
  },
  tabBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 4px', borderRadius: 0, border: 'none', borderBottom: '2px solid transparent',
    background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer', marginRight: 14, whiteSpace: 'nowrap' as const, flexShrink: 0,
  },
  // Propriété complète, pas borderBottomColor seul : quand React retire une
  // propriété détaillée, la couleur retombait sur celle du texte et les
  // onglets déjà visités restaient soulignés
  tabBtnActive: {
    color: 'var(--accent-text)', borderBottom: '2px solid var(--accent-text)',
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
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    background: 'var(--accent-text)', color: 'var(--bg)', textDecoration: 'none',
  },
  smallBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
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
  thumbIndex: {
    position: 'absolute' as const, top: 3, left: 3,
    minWidth: 15, height: 15, padding: '0 3px', borderRadius: 8,
    background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9.5, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  thumbMoveRow: {
    position: 'absolute' as const, bottom: 3, left: 3, right: 3,
    display: 'flex', justifyContent: 'space-between', gap: 4,
  },
  thumbMoveBtn: {
    width: 20, height: 18, borderRadius: 5, border: 'none',
    background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, lineHeight: 1, padding: 0,
  },
  carouselNavBtn: {
    position: 'absolute' as const, top: '50%', transform: 'translateY(-50%)',
    width: 26, height: 26, borderRadius: '50%', border: 'none',
    background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, lineHeight: 1,
  },
  carouselDots: {
    position: 'absolute' as const, bottom: 8, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 4,
  },
  carouselDot: {
    width: 5, height: 5, borderRadius: '50%',
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
    fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', color: 'var(--text)',
  },
  radioLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer',
  },
  primaryBtn: {
    alignSelf: 'flex-start', fontFamily: 'inherit',
    padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
    background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
  },
  previewTab: {
    fontFamily: 'inherit',
    padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  // Largeur bornée : sur grand écran, l'aperçu carré prenait toute la colonne
  previewCard: {
    width: '100%', maxWidth: 440, alignSelf: 'center' as const,
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
  linkBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', padding: 0,
    fontSize: 12, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer',
  },
  cadenceBox: {
    padding: '10px 12px', borderRadius: 10,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
  },
  dayChip: {
    fontFamily: 'inherit',
    padding: '6px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
    cursor: 'pointer',
  },
  freeSlotBtn: {
    padding: '5px 11px', borderRadius: 100, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
    cursor: 'pointer',
  },
  asideLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: 'var(--text-3)',
  },
  asideSep: { height: 1, background: 'var(--border)', margin: '2px 0' },
  reconnectLink: {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
    color: 'var(--accent-text)', textDecoration: 'none',
  },
  dispatchNote: {
    display: 'flex', gap: 7, margin: 0, padding: '9px 12px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.5,
    color: 'var(--text-2)', background: 'rgba(255,213,107,0.14)', border: '1px solid rgba(183,121,31,0.30)',
  },
}
