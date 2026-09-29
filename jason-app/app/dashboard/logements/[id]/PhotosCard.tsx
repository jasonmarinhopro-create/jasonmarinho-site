'use client'

// Photos du logement dans le bandeau de la fiche : couverture, galerie,
// envoi par clic ou glisser-déposer, choix de la couverture, suppression,
// visionneuse plein écran. Voir photo-actions.ts.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, UploadSimple, Star, Trash, X, CaretLeft, CaretRight, Images, Warning } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/images/compress'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { prepareLogementPhotoUploads, addLogementPhotos, setLogementCover, removeLogementPhoto } from './photo-actions'

const MAX = 12

export default function PhotosCard({ logementId, nom, cover: initialCover, photos: initialPhotos }: {
  logementId: string
  nom: string
  cover: string | null
  photos: string[]
}) {
  const [cover, setCover] = useState<string | null>(initialCover)
  const [photos, setPhotos] = useState<string[]>(() => Array.from(new Set([initialCover, ...initialPhotos].filter((u): u is string => !!u))))
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { confirm, dialog } = useConfirm()

  const main = cover ?? photos[0] ?? null
  const others = photos.filter(p => p !== main)

  function apply(res: { cover?: string | null; photos?: string[]; error?: string }) {
    if (res.error) { setErr(res.error); return false }
    if (res.photos) setPhotos(res.photos)
    if (res.cover !== undefined) setCover(res.cover)
    return true
  }

  async function upload(files: File[]) {
    const list = files.filter(f => f.type.startsWith('image/')).slice(0, MAX - photos.length)
    if (!list.length) {
      if (photos.length >= MAX) setErr(`${MAX} photos au maximum : supprimes-en une avant d'en ajouter.`)
      return
    }
    setErr(null)
    setBusy(`Envoi de ${list.length} photo${list.length > 1 ? 's' : ''}…`)
    try {
      const prep = await prepareLogementPhotoUploads(logementId, list.length)
      if ('error' in prep) throw new Error(prep.error)
      const sb = createClient()
      const urls = await Promise.all(prep.uploads.map(async (u, i) => {
        // 1600 px en JPEG : assez net pour un écran, léger pour le stockage (1 Go en offre gratuite)
        const blob = await compressImage(list[i], 1600, 0.8)
        const { error } = await sb.storage.from('logement-photos').uploadToSignedUrl(u.path, u.token, blob, { contentType: 'image/jpeg' })
        if (error) throw new Error('Une photo n’a pas pu être envoyée. Réessaie avec une connexion plus stable.')
        return u.publicUrl
      }))
      apply(await addLogementPhotos(logementId, urls))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Envoi impossible.')
    } finally {
      setBusy(null)
    }
  }

  async function makeCover(url: string) {
    setErr(null)
    const prev = { cover, photos }
    setCover(url)
    setPhotos(p => [url, ...p.filter(x => x !== url)])
    const ok = apply(await setLogementCover(logementId, url).catch(() => ({ error: 'Réseau indisponible.' })))
    if (!ok) { setCover(prev.cover); setPhotos(prev.photos) }
  }

  async function remove(url: string) {
    if (!(await confirm({ message: 'Supprimer cette photo du logement ?', confirmLabel: 'Supprimer', danger: true }))) return
    setErr(null)
    setBusy('Suppression…')
    apply(await removeLogementPhoto(logementId, url).catch(() => ({ error: 'Réseau indisponible.' })))
    setBusy(null)
    setViewer(null)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    upload(Array.from(e.dataTransfer.files ?? []))
  }
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDrag(true) },
    onDragLeave: () => setDrag(false),
    onDrop,
  }

  const picker = (
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }}
      onChange={e => { upload(Array.from(e.target.files ?? [])); e.target.value = '' }} />
  )

  // ── Aucune photo : zone d'envoi ──
  if (!main) {
    return (
      <div style={{ ...s.card, ...(drag ? s.dragOn : {}) }} {...dropProps}>
        {dialog}
        {picker}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={!!busy} style={s.empty}>
          <span style={s.emptyIcon}><Camera size={26} weight="duotone" /></span>
          <strong style={{ fontSize: 15, color: 'var(--text)' }}>{busy ?? 'Ajoute les photos du logement'}</strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Clique ou glisse tes photos ici ({MAX} au maximum). La première sert de couverture dans ta liste de logements.
          </span>
        </button>
        {err && <div style={s.err}><Warning size={13} weight="fill" /> {err}</div>}
      </div>
    )
  }

  return (
    <div style={{ ...s.card, ...(drag ? s.dragOn : {}) }} {...dropProps}>
      {dialog}
      {picker}
      <div style={s.mainWrap}>
        <button type="button" onClick={() => setViewer(0)} style={s.mainBtn} aria-label="Voir les photos en grand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt={`Photo de couverture : ${nom}`} style={s.mainImg} />
        </button>
        <span style={s.countBadge}><Images size={13} weight="bold" /> {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
      </div>
      {others.length > 0 && (
        <div style={s.thumbs}>
          {others.slice(0, 4).map((u, i) => (
            <button key={u} type="button" onClick={() => setViewer(i + 1)} style={s.thumbBtn} aria-label={`Voir la photo ${i + 2}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" style={s.thumbImg} />
              {i === 3 && others.length > 4 && <span style={s.more}>+{others.length - 4}</span>}
            </button>
          ))}
        </div>
      )}
      <div style={s.actions}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={!!busy || photos.length >= MAX} style={s.addBtn}>
          <UploadSimple size={14} weight="bold" /> {busy ?? (photos.length >= MAX ? `${MAX} photos au maximum` : 'Ajouter des photos')}
        </button>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>ou glisse-les ici</span>
      </div>
      {err && <div style={s.err}><Warning size={13} weight="fill" /> {err}</div>}

      {viewer !== null && (
        <Viewer
          photos={[main, ...others]}
          index={viewer}
          cover={main}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          onCover={u => { makeCover(u); setViewer(0) }}
          onRemove={remove}
        />
      )}
    </div>
  )
}

function Viewer({ photos, index, cover, onIndex, onClose, onCover, onRemove }: {
  photos: string[]; index: number; cover: string
  onIndex: (i: number) => void; onClose: () => void
  onCover: (u: string) => void; onRemove: (u: string) => void
}) {
  const n = photos.length
  const cur = photos[Math.min(index, n - 1)]
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])
  if (typeof document === 'undefined' || !cur) return null
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Photos du logement" style={s.viewer} onClick={onClose}>
      <div style={s.viewerTop} onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: 13, color: '#fff', opacity: 0.85 }}>{index + 1} / {n}</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cur === cover
            ? <span style={s.viewerTag}><Star size={13} weight="fill" /> Couverture</span>
            : <button type="button" onClick={() => onCover(cur)} style={s.viewerBtn}><Star size={13} weight="bold" /> Mettre en couverture</button>}
          <button type="button" onClick={() => onRemove(cur)} style={s.viewerBtn}><Trash size={13} weight="bold" /> Supprimer</button>
          <button type="button" onClick={onClose} style={s.viewerBtn} aria-label="Fermer"><X size={14} weight="bold" /></button>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cur} alt="" style={s.viewerImg} onClick={e => e.stopPropagation()} />
      {n > 1 && (
        <>
          <button type="button" onClick={e => { e.stopPropagation(); go(-1) }} style={{ ...s.nav, left: 12 }} aria-label="Photo précédente"><CaretLeft size={20} weight="bold" /></button>
          <button type="button" onClick={e => { e.stopPropagation(); go(1) }} style={{ ...s.nav, right: 12 }} aria-label="Photo suivante"><CaretRight size={20} weight="bold" /></button>
        </>
      )}
    </div>,
    document.body,
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { display: 'flex', flexDirection: 'column', gap: 10, padding: 10, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', width: '100%', minWidth: 0, boxSizing: 'border-box' },
  dragOn: { borderColor: 'var(--accent-text)', boxShadow: '0 0 0 3px var(--accent-bg)' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center',
    minHeight: 200, padding: '22px 18px', borderRadius: 12, border: '1.5px dashed var(--accent-border)', background: 'var(--accent-bg)',
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', color: 'var(--accent-text)' },
  mainWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '4 / 3', background: 'var(--bg-2)' },
  mainBtn: { display: 'block', width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'zoom-in', background: 'none' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  countBadge: { position: 'absolute', left: 10, bottom: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11.5, fontWeight: 600 },
  thumbs: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 },
  thumbBtn: { position: 'relative', padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden', aspectRatio: '1 / 1', cursor: 'zoom-in', background: 'var(--bg-2)' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  more: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff', fontWeight: 700, fontSize: 14 },
  actions: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  err: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--danger-text)' },
  viewer: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 16px 24px' },
  viewerTop: { position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  viewerImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10 },
  viewerBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  viewerTag: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#FFD56B', color: '#3d2c00', fontSize: 12.5, fontWeight: 700 },
  nav: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
