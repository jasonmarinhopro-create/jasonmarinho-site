// Photos des fiches pros (photographes et équipes de ménage), côté serveur.
// Appelé par les actions des deux « Ma fiche » APRÈS vérification du
// propriétaire (ou de l'admin) : ici, seulement l'identifiant de la fiche.
//
// Garde-fous des offres gratuites (Supabase Free : 1 Go de fichiers) :
//  - avant chaque envoi : place prise lue par storage_usage() (migration 131),
//    refus si la mesure manque ou si l'envoi dépasse la part prévue ;
//  - après l'envoi : taille réelle de chaque fichier relue, fichier trop lourd
//    supprimé tout de suite ;
//  - le bucket lui-même refuse plus de 600 Ko par fichier (migration 131).
// Le site n'est reconstruit qu'à la demande (« Mettre en ligne »), pas à chaque
// photo : Vercel limite à 100 déploiements par jour.

import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'
import {
  PHOTOS_MAX, PHOTO_FULL_MAX_BYTES, PHOTO_THUMB_MAX_BYTES, PORTFOLIO_BUCKET,
  storageDecision, newPhotoPath, thumbPath, isPhotoPath, type StorageUsageRow,
} from './fiche-vitrine'

const log = logger('pros/fiche-vitrine')

export type ProTable = 'photographers' | 'cleaners' | 'depannage_pros'
export type PhotosResult = { photos?: string[]; error?: string }

async function readPhotos(table: ProTable, proId: string): Promise<string[] | null> {
  const { data, error } = await getServiceClient().from(table).select('portfolio_photos').eq('id', proId).maybeSingle()
  if (error) { log.error('lecture des photos', { table, err: error.message }); return null }
  return ((data?.portfolio_photos as string[] | null) ?? [])
}

async function writePhotos(table: ProTable, proId: string, photos: string[]): Promise<boolean> {
  const { error } = await getServiceClient().from(table).update({ portfolio_photos: photos, updated_at: new Date().toISOString() }).eq('id', proId)
  if (error) log.error('enregistrement des photos', { table, err: error.message })
  return !error
}

export async function storageUsage(): Promise<StorageUsageRow[] | null> {
  const { data, error } = await getServiceClient().rpc('storage_usage')
  if (error || !Array.isArray(data)) return null
  return (data as Array<{ bucket_id: string; bytes: number | string; objects: number | string }>)
    .map(r => ({ bucket_id: r.bucket_id, bytes: Number(r.bytes) || 0, objects: Number(r.objects) || 0 }))
}

/** URL signées pour envoyer `count` photos (grande image + vignette chacune) */
export async function preparePhotoUploads(table: ProTable, proId: string, count: number): Promise<{ uploads: Array<{ path: string; token: string; thumbToken: string }> } | { error: string }> {
  const current = await readPhotos(table, proId)
  if (current === null) return { error: 'Les photos arrivent très bientôt sur ta fiche : réessaie dans quelques heures.' }
  const room = PHOTOS_MAX - current.length
  const n = Math.max(0, Math.min(room, Math.floor(count)))
  if (n === 0) return { error: `Ta fiche a déjà ${PHOTOS_MAX} photos : supprimes-en une avant d’en ajouter.` }

  const decision = storageDecision(await storageUsage(), n * (PHOTO_FULL_MAX_BYTES + PHOTO_THUMB_MAX_BYTES))
  if (!decision.ok) {
    log.error('Photos des fiches : envoi refusé (garde-fou de stockage)', { reason: decision.reason })
    return { error: decision.reason }
  }

  const bucket = getServiceClient().storage.from(PORTFOLIO_BUCKET)
  const uploads: Array<{ path: string; token: string; thumbToken: string }> = []
  for (let i = 0; i < n; i++) {
    const path = newPhotoPath(proId, crypto.randomUUID())
    const [full, thumb] = await Promise.all([bucket.createSignedUploadUrl(path), bucket.createSignedUploadUrl(thumbPath(path))])
    if (full.error || thumb.error || !full.data || !thumb.data) {
      log.error('URL d’envoi des photos', { err: (full.error ?? thumb.error)?.message })
      return { error: 'Envoi impossible pour le moment.' }
    }
    uploads.push({ path, token: full.data.token, thumbToken: thumb.data.token })
  }
  return { uploads }
}

/** Ajoute les photos envoyées, après avoir relu leur taille réelle */
export async function addPhotos(table: ProTable, proId: string, paths: string[]): Promise<PhotosResult> {
  const wanted = (paths ?? []).filter(p => isPhotoPath(p, proId))
  const bucket = getServiceClient().storage.from(PORTFOLIO_BUCKET)
  const { data: files, error: listErr } = await bucket.list(proId, { limit: 100 })
  if (listErr) return { error: 'Vérification des photos impossible, réessaie.' }
  const size = new Map((files ?? []).map(f => [`${proId}/${f.name}`, Number((f.metadata as { size?: number } | null)?.size ?? 0)]))

  const ok: string[] = []
  const tooBig: string[] = []
  for (const p of wanted) {
    const full = size.get(p) ?? 0
    const thumb = size.get(thumbPath(p)) ?? 0
    if (!full || !thumb) continue
    if (full > PHOTO_FULL_MAX_BYTES || thumb > PHOTO_THUMB_MAX_BYTES) tooBig.push(p, thumbPath(p))
    else ok.push(p)
  }
  if (tooBig.length) await bucket.remove(tooBig)

  const current = await readPhotos(table, proId)
  if (current === null) return { error: 'Enregistrement impossible.' }
  const photos = [...current, ...ok.filter(p => !current.includes(p))].slice(0, PHOTOS_MAX)
  if (!(await writePhotos(table, proId, photos))) return { error: 'Enregistrement impossible.' }
  if (tooBig.length) return { photos, error: 'Une photo était trop lourde et n’a pas été gardée.' }
  return { photos }
}

export async function removePhoto(table: ProTable, proId: string, path: string): Promise<PhotosResult> {
  if (typeof path !== 'string' || !path.startsWith(`${proId}/`)) return { error: 'Photo introuvable.' }
  const current = await readPhotos(table, proId)
  if (current === null) return { error: 'Suppression impossible.' }
  const photos = current.filter(p => p !== path)
  if (!(await writePhotos(table, proId, photos))) return { error: 'Suppression impossible.' }
  await getServiceClient().storage.from(PORTFOLIO_BUCKET).remove(isPhotoPath(path, proId) ? [path, thumbPath(path)] : [path])
  return { photos }
}

/** Déplace une photo d'un cran (la première est la photo principale) */
export async function movePhoto(table: ProTable, proId: string, path: string, dir: -1 | 1): Promise<PhotosResult> {
  const photos = await readPhotos(table, proId)
  if (photos === null) return { error: 'Réorganisation impossible.' }
  const i = photos.indexOf(path)
  const j = i + (dir === -1 ? -1 : 1)
  if (i < 0 || j < 0 || j >= photos.length) return { photos }
  ;[photos[i], photos[j]] = [photos[j], photos[i]]
  if (!(await writePhotos(table, proId, photos))) return { error: 'Réorganisation impossible.' }
  return { photos }
}

/** Reconstruit le site pour publier les photos (un seul déploiement) */
export async function publishPhotos(table: ProTable): Promise<{ success?: boolean; error?: string }> {
  const ok = await triggerSiteRebuild(table === 'photographers' ? 'photos fiche photographe' : table === 'cleaners' ? 'photos fiche ménage' : 'photos fiche dépannage')
  return ok ? { success: true } : { error: 'Mise en ligne impossible pour le moment, réessaie dans quelques minutes.' }
}
