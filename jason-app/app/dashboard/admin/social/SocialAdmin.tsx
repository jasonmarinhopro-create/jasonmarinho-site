'use client'

import { useRef, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Plus, ArrowClockwise, X, CheckCircle, XCircle, Clock, UploadSimple, ImageSquare,
  Heart, ChatCircle, CalendarBlank, PencilSimple, Check,
} from '@phosphor-icons/react/dist/ssr'
import { createSocialPost, updateSocialPost, retrySocialPost, disconnectSocialAccount, uploadSocialMedia, refreshPostStats, refreshAllStats, setSocialCadence, markTargetPublished } from './actions'
import { CalendarInput, TimePickerInput } from '@/components/ui/CalendarInput'
import SocialStats from './SocialStats'
import SocialAutoReply, { type CommentTriggerRow, type CommentReplyRow } from './SocialAutoReply'
import { PLATFORM_META, IMPLEMENTED_PLATFORMS, ALL_PLATFORMS } from './constants'

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
  const history = posts.filter(p => p.status !== 'scheduled')

  const freeSlot = cadence ? nextFreeSlot(cadence, upcoming.map(p => p.scheduled_at!).filter(Boolean)) : null

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

  function retry(postId: string) {
    startTransition(async () => {
      await retrySocialPost(postId)
      router.refresh()
    })
  }

  function markPublished(targetId: string) {
    startTransition(async () => {
      await markTargetPublished(targetId)
      router.refresh()
    })
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
          {(byPlatform('facebook').length === 0 || byPlatform('instagram').length === 0) ? (
            <a href="/api/social/connect/meta" style={s.connectBtn}>
              <Plus size={15} /> Connecter Facebook / Instagram
            </a>
          ) : (
            // Comptes déjà connectés — pas de bouton "Connecter" dans ce cas,
            // mais on peut avoir besoin de relancer l'OAuth quand même (ex :
            // nouvelles permissions ajoutées côté Meta après coup, comme
            // pages_manage_metadata pour les webhooks) : le token stocké
            // n'embarque que les permissions accordées au moment de la
            // connexion initiale, il faut re-authentifier pour le rafraîchir.
            <a href="/api/social/connect/meta" style={{ ...s.connectBtn, background: 'var(--bg-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              <ArrowClockwise size={14} /> Reconnecter (rafraîchir permissions)
            </a>
          )}
        </div>
      </section>

      {/* Onglets */}
      <div style={s.tabRow}>
        <button type="button" onClick={() => setView('composer')} style={{ ...s.tabBtn, ...(view === 'composer' ? s.tabBtnActive : {}) }}>
          Composer
        </button>
        <button type="button" onClick={() => setView('stats')} style={{ ...s.tabBtn, ...(view === 'stats' ? s.tabBtnActive : {}) }}>
          Statistiques
        </button>
        <button type="button" onClick={() => setView('auto_reply')} style={{ ...s.tabBtn, ...(view === 'auto_reply' ? s.tabBtnActive : {}) }}>
          Réponses auto
        </button>
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
                    background: active ? `${meta.color}18` : 'var(--bg-2)',
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
              {uploading ? 'Envoi en cours…' : 'Glisse tes visuels ici (ou clique) — plusieurs images = carrousel'}
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

          {error && <div style={s.banner('#EF4444', 'rgba(239,68,68,0.1)')}>{error}</div>}

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
                {upcoming.map(post => <PostCard key={post.id} post={post} onRetry={retry} onEdit={startEdit} onRefreshStats={refreshStats} onMarkPublished={markPublished} disabled={isPending} />)}
              </div>
            )}
          </section>

          <section style={s.card}>
            <h2 style={s.cardTitle}>Publiées récemment</h2>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucun post pour le moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' as const }}>
                {history.map(post => <PostCard key={post.id} post={post} onRetry={retry} onEdit={startEdit} onRefreshStats={refreshStats} onMarkPublished={markPublished} disabled={isPending} />)}
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

function PostCard({ post, onRetry, onEdit, onRefreshStats, onMarkPublished, disabled }: {
  post: SocialPostRow
  onRetry: (id: string) => void
  onEdit: (post: SocialPostRow) => void
  onRefreshStats: (id: string) => void
  onMarkPublished: (targetId: string) => void
  disabled: boolean
}) {
  const thumb = post.media_urls[0]
  const hasPublished = post.targets.some(t => t.status === 'published')
  const totalLikes = post.targets.reduce((sum, t) => sum + (t.like_count ?? 0), 0)
  const totalComments = post.targets.reduce((sum, t) => sum + (t.comment_count ?? 0), 0)
  const statsKnown = post.targets.some(t => t.stats_updated_at)

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
            {(post.status === 'failed' || post.status === 'partial') && (
              <button onClick={() => onRetry(post.id)} disabled={disabled} style={s.smallBtn}>
                <ArrowClockwise size={13} /> Réessayer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 6, alignItems: 'center' }}>
            {post.targets.map(t => {
              const meta = PLATFORM_META[t.platform]
              const StatusIcon = t.status === 'published' ? CheckCircle : t.status === 'failed' ? XCircle : Clock
              const statusColor = t.status === 'published' ? 'var(--success-1)' : t.status === 'failed' ? '#EF4444' : 'var(--text-muted)'
              return (
                <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span title={t.error ?? undefined} style={{ ...s.targetPill, color: statusColor }}>
                    {meta && <meta.Icon size={12} weight="fill" style={{ color: meta.color }} />}
                    <StatusIcon size={12} weight="fill" />
                    {t.status}
                  </span>
                  {t.status === 'pending' && (
                    <button
                      onClick={() => onMarkPublished(t.id)} disabled={disabled}
                      style={{ ...s.iconBtn, width: 'auto', padding: '0 6px' }}
                      title="A été publiée pour de vrai (vérifié à l'œil) mais le statut n'a jamais suivi — corrige juste l'affichage, ne republie pas"
                    >
                      <Check size={11} />
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
              <button onClick={() => onRefreshStats(post.id)} disabled={disabled} style={s.iconBtn} title="Actualiser les stats">
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
                return new Date(display).toLocaleString('fr-FR')
              })()}
            </span>
          </div>
          {post.targets.filter(t => t.status === 'failed' && t.error).map(t => {
            const meta = PLATFORM_META[t.platform]
            return (
              <p key={t.id} style={{ margin: '4px 0 0', fontSize: 11.5, color: '#EF4444', display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                {meta && <meta.Icon size={11} weight="fill" style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />}
                <span>{t.error}</span>
              </p>
            )
          })}
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
    display: 'flex', gap: 6, paddingBottom: 0,
  },
  tabBtn: {
    padding: '9px 4px', borderRadius: 0, border: 'none', borderBottom: '2px solid transparent',
    background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer', marginRight: 18,
  },
  tabBtnActive: {
    color: 'var(--accent-text)', borderBottomColor: 'var(--accent-text)',
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
    padding: '6px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
    cursor: 'pointer',
  },
  freeSlotBtn: {
    padding: '5px 11px', borderRadius: 100, fontSize: 12, fontWeight: 600,
    background: 'var(--success-bg)', color: 'var(--success-1)', border: '1px solid var(--success-1)',
    cursor: 'pointer',
  },
}
