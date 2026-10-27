'use client'

// Photos de la fiche publique (photographes et équipes de ménage) : 6 au plus.
// Chaque photo est compressée dans le navigateur en deux tailles (grande
// image 1600 px, vignette 640 px, JPEG) avant l'envoi direct au stockage par
// URL signée : la server action ne reçoit que les chemins. Les tailles sont
// revérifiées côté serveur (lib/pros/fiche-vitrine-server.ts) pour rester
// dans l'offre gratuite de Supabase.
import { useState } from 'react'
import { UploadSimple, Trash, CaretLeft, CaretRight, Images, Warning, CheckCircle, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/client'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import {
  PHOTOS_MAX, PHOTO_FULL_SIDE, PHOTO_THUMB_SIDE, PHOTO_FULL_MAX_BYTES, PHOTO_THUMB_MAX_BYTES,
  PORTFOLIO_BUCKET, thumbPath, isLegacyPhoto,
} from '@/lib/pros/fiche-vitrine'

type Res = { photos?: string[]; error?: string }

async function toJpeg(bmp: ImageBitmap, side: number, maxBytes: number): Promise<Blob> {
  const scale = Math.min(1, side / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  for (const q of [0.8, 0.7, 0.6, 0.5]) {
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', q))
    if (blob && blob.size <= maxBytes) return blob
  }
  throw new Error('Une photo reste trop lourde même compressée.')
}

export default function PortfolioManager({ initial, targetId, ficheUrl, onPrepare, onAdd, onRemove, onMove, onPublish, onChanged }: {
  initial: string[]
  /** Atelier de Ma fiche : pas de bouton « Mettre en ligne » ici, la barre de l'atelier publie tout d'un coup */
  onChanged?: (photos: string[]) => void
  targetId?: string
  /** Fiche publique (lien « Voir ma fiche » après la mise en ligne) */
  ficheUrl?: string | null
  onPrepare: (count: number, targetId?: string) => Promise<{ uploads: Array<{ path: string; token: string; thumbToken: string }> } | { error: string }>
  onAdd: (paths: string[], targetId?: string) => Promise<Res>
  onRemove: (path: string, targetId?: string) => Promise<Res>
  onMove: (path: string, dir: -1 | 1, targetId?: string) => Promise<Res>
  onPublish: (targetId?: string) => Promise<{ success?: boolean; error?: string }>
}) {
  const [photos, setPhotos] = useState<string[]>(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [published, setPublished] = useState(false)
  const { confirm, dialog } = useConfirm()
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PORTFOLIO_BUCKET}/`

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, PHOTOS_MAX - photos.length)
    e.target.value = ''
    if (!files.length) return
    setBusy(true); setErr(null); setPublished(false)
    try {
      // Compression d'abord : rien n'est réservé si un fichier n'est pas lisible
      const blobs = await Promise.all(files.map(async f => {
        let bmp: ImageBitmap
        try { bmp = await createImageBitmap(f) } catch { throw new Error('Format de photo non lu : envoie une photo en JPEG ou PNG.') }
        return { full: await toJpeg(bmp, PHOTO_FULL_SIDE, PHOTO_FULL_MAX_BYTES), thumb: await toJpeg(bmp, PHOTO_THUMB_SIDE, PHOTO_THUMB_MAX_BYTES) }
      }))
      const prep = await onPrepare(blobs.length, targetId)
      if ('error' in prep) throw new Error(prep.error)
      const sb = createClient()
      const bucket = sb.storage.from(PORTFOLIO_BUCKET)
      const paths = await Promise.all(prep.uploads.map(async (u, i) => {
        const opts = { contentType: 'image/jpeg', cacheControl: '31536000' }
        const [a, b] = await Promise.all([
          bucket.uploadToSignedUrl(u.path, u.token, blobs[i].full, opts),
          bucket.uploadToSignedUrl(thumbPath(u.path), u.thumbToken, blobs[i].thumb, opts),
        ])
        if (a.error || b.error) throw new Error('Une photo n’a pas pu être envoyée.')
        return u.path
      }))
      const res = await onAdd(paths, targetId)
      if (res.photos) { setPhotos(res.photos); setDirty(true); onChanged?.(res.photos) }
      if (res.error) throw new Error(res.error)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Erreur inattendue')
    } finally {
      setBusy(false)
    }
  }

  async function act(p: Promise<Res>) {
    setErr(null); setPublished(false)
    const res = await p
    if (res.error) setErr(res.error)
    if (res.photos) { setPhotos(res.photos); setDirty(true); onChanged?.(res.photos) }
  }

  async function publish() {
    setBusy(true); setErr(null)
    const res = await onPublish(targetId)
    setBusy(false)
    if (res.error) setErr(res.error)
    else { setDirty(false); setPublished(true) }
  }

  return (
    <div>
      {dialog}
      {onChanged ? (
        // Atelier : la partie a déjà son texte d'introduction, seul le compteur reste
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: photos.length >= PHOTOS_MAX ? 'var(--text-2)' : 'var(--accent-text)', background: 'var(--accent-bg)', padding: '5px 11px', borderRadius: 999, marginBottom: 12 }}>
          {photos.length} / {PHOTOS_MAX} photos
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 12px' }}>
          Tes plus belles réalisations, en haut de ta fiche publique : c’est ce que les hôtes regardent en premier. La première photo est la photo principale.{' '}
          <strong style={{ color: photos.length >= PHOTOS_MAX ? 'var(--text-2)' : 'var(--accent-text)' }}>{photos.length} / {PHOTOS_MAX} photos</strong>
        </p>
      )}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          {photos.map((p, i) => {
            const legacy = isLegacyPhoto(p)
            return (
              <div key={p} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={base + (legacy ? p : thumbPath(p))} alt={`Photo ${i + 1} de la fiche`} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 10, border: i === 0 ? '2px solid var(--accent-text)' : '1px solid var(--border)', display: 'block', opacity: legacy ? 0.5 : 1 }} />
                {i === 0 && !legacy && <span style={mainBadge}>Photo principale</span>}
                {legacy && <span style={{ ...mainBadge, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>Ancienne, à remplacer</span>}
                <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" onClick={() => act(onMove(p, -1, targetId))} disabled={i === 0 || busy} aria-label="Déplacer avant" style={iconBtn}><CaretLeft size={12} /></button>
                    <button type="button" onClick={() => act(onMove(p, 1, targetId))} disabled={i === photos.length - 1 || busy} aria-label="Déplacer après" style={iconBtn}><CaretRight size={12} /></button>
                  </div>
                  <button type="button" disabled={busy} onClick={async () => { if (await confirm({ message: 'Retirer cette photo de ta fiche ?', confirmLabel: 'Retirer', danger: true })) act(onRemove(p, targetId)) }} aria-label="Retirer la photo" style={iconBtn}><Trash size={12} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {photos.length < PHOTOS_MAX && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px dashed var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 13.5, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? <Images size={15} /> : <UploadSimple size={15} />} {busy ? 'Un instant…' : photos.length ? 'Ajouter des photos' : 'Ajouter mes premières photos'}
            <input type="file" accept="image/*" multiple onChange={upload} disabled={busy} style={{ display: 'none' }} />
          </label>
        )}
        {dirty && !onChanged && (
          <button type="button" onClick={publish} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <CheckCircle size={15} weight="bold" /> Mettre en ligne sur ma fiche
          </button>
        )}
      </div>
      {dirty && !busy && !onChanged && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 8 }}>Tes photos sont enregistrées. Clique sur « Mettre en ligne » quand tu as fini : ta fiche publique se met à jour en 2 à 3 minutes.</div>}
      {published && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--accent-text)', marginTop: 8 }}>
          <CheckCircle size={13} weight="fill" /> C’est parti : ta fiche publique affiche tes photos d’ici 2 à 3 minutes.
          {ficheUrl && <a href={ficheUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Voir ma fiche <ArrowSquareOut size={12} /></a>}
        </div>
      )}
      {err && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--danger-text)', marginTop: 8 }}><Warning size={13} /> {err}</div>}
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>Photos allégées automatiquement avant l’envoi (pas besoin de les redimensionner). Envoie uniquement des photos dont tu as les droits.</p>
    </div>
  )
}

const mainBadge: React.CSSProperties = {
  position: 'absolute', top: 6, left: 6, padding: '3px 8px', borderRadius: 999,
  background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 11, fontWeight: 700,
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26,
  borderRadius: 7, border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', cursor: 'pointer',
}
