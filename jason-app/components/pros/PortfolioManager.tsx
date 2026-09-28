'use client'

// Galerie du portfolio hébergé (photographes) : jusqu'à 12 photos, affichées
// sur la fiche publique en direct (pas d'attente de redéploiement).
import { useState } from 'react'
import { UploadSimple, Trash, CaretLeft, CaretRight, Images, Warning } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/images/compress'
import { useConfirm } from '@/components/ui/ConfirmDialog'

type Res = { photos?: string[]; error?: string }

export default function PortfolioManager({ initial, publicBase, targetId, onPrepare, onAdd, onRemove, onMove }: {
  initial: string[]
  /** `${SUPABASE_URL}/storage/v1/object/public/pro-portfolio/` */
  publicBase: string
  targetId?: string
  onPrepare: (count: number, targetId?: string) => Promise<{ uploads: Array<{ path: string; token: string }> } | { error: string }>
  onAdd: (paths: string[], targetId?: string) => Promise<Res>
  onRemove: (path: string, targetId?: string) => Promise<Res>
  onMove: (path: string, dir: -1 | 1, targetId?: string) => Promise<Res>
}) {
  const [photos, setPhotos] = useState<string[]>(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const MAX = 12
  const { confirm, dialog } = useConfirm()

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX - photos.length)
    e.target.value = ''
    if (!files.length) return
    setBusy(true); setErr(null)
    try {
      const prep = await onPrepare(files.length, targetId)
      if ('error' in prep) throw new Error(prep.error)
      const sb = createClient()
      const paths = await Promise.all(prep.uploads.map(async (u, i) => {
        const blob = await compressImage(files[i], 2000, 0.85)
        const { error } = await sb.storage.from('pro-portfolio').uploadToSignedUrl(u.path, u.token, blob, { contentType: 'image/jpeg' })
        if (error) throw new Error('Une photo n’a pas pu être envoyée.')
        return u.path
      }))
      const res = await onAdd(paths, targetId)
      if (res.error) throw new Error(res.error)
      if (res.photos) setPhotos(res.photos)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Erreur inattendue')
    } finally {
      setBusy(false)
    }
  }

  async function act(p: Promise<Res>) {
    setErr(null)
    const res = await p
    if (res.error) setErr(res.error)
    else if (res.photos) setPhotos(res.photos)
  }

  return (
    <div>
      {dialog}
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 12px' }}>
        Tes meilleures photos de logements, affichées directement sur ta fiche publique. La première est la plus visible. Les hôtes jugent ton style en quelques secondes : choisis tes réalisations les plus récentes et variées.
        {' '}<strong style={{ color: photos.length >= MAX ? 'var(--text-2)' : 'var(--accent-text)' }}>{photos.length} / {MAX} photos</strong>
      </p>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          {photos.map((p, i) => (
            <div key={p} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicBase + p} alt={`Photo ${i + 1} du portfolio`} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 10, border: i === 0 ? '2px solid var(--accent-text)' : '1px solid var(--border)', display: 'block', boxSizing: 'border-box' }} />
              {i === 0 && <span style={mainBadge}>Photo principale</span>}
              <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => act(onMove(p, -1, targetId))} disabled={i === 0} aria-label="Déplacer avant" style={iconBtn}><CaretLeft size={12} /></button>
                  <button type="button" onClick={() => act(onMove(p, 1, targetId))} disabled={i === photos.length - 1} aria-label="Déplacer après" style={iconBtn}><CaretRight size={12} /></button>
                </div>
                <button type="button" onClick={async () => { if (await confirm({ message: 'Supprimer cette photo du portfolio ?', confirmLabel: 'Supprimer', danger: true })) act(onRemove(p, targetId)) }} aria-label="Supprimer" style={iconBtn}><Trash size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {photos.length < MAX && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px dashed var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 600, fontSize: 13.5, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
          {busy ? <Images size={15} /> : <UploadSimple size={15} />} {busy ? 'Envoi en cours…' : photos.length ? 'Ajouter des photos' : 'Ajouter mes premières photos'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={busy} style={{ display: 'none' }} />
        </label>
      )}
      {err && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--danger-text)', marginTop: 8 }}><Warning size={13} /> {err}</div>}
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
