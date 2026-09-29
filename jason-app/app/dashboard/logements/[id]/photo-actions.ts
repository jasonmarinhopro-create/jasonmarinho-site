'use server'

// Photos d'un logement (sept. 2026). Avant, la photo de couverture ne se
// renseignait qu'en collant une URL dans le formulaire du logement : en
// pratique, aucune fiche n'avait de photo. Les photos sont maintenant
// envoyées depuis la fiche : compressées dans le navigateur, puis déposées
// directement dans le bucket public `logement-photos` par URL signée (pas de
// passage par la server action, limitée à 1 Mo). Même méthode que le
// portfolio des photographes.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getProfile } from '@/lib/queries/profile'
import { logger } from '@/lib/logger'

const log = logger('logements/photos')

const BUCKET = 'logement-photos'
const LOGEMENT_PHOTOS_MAX = 12

type PhotosRow = { photo_couverture_url: string | null; photos_urls: string[] | null }
type Result = { cover?: string | null; photos?: string[]; error?: string }

/** Vérifie que le logement appartient à l'utilisateur connecté (RLS + filtre explicite). */
async function ownLogement(logementId: string): Promise<{ userId: string; row: PhotosRow } | { error: string }> {
  const profile = await getProfile()
  if (!profile) return { error: 'Non authentifié.' }
  const supabase = await createClient()
  const { data } = await supabase
    .from('logements')
    .select('photo_couverture_url, photos_urls')
    .eq('id', logementId)
    .eq('user_id', profile.userId)
    .maybeSingle()
  if (!data) return { error: 'Logement introuvable.' }
  return { userId: profile.userId, row: data as PhotosRow }
}

/** Toutes les photos (couverture en premier, sans doublon). */
function allPhotos(row: PhotosRow): string[] {
  const list = [row.photo_couverture_url, ...(row.photos_urls ?? [])].filter((u): u is string => !!u)
  return Array.from(new Set(list))
}

async function save(logementId: string, userId: string, photos: string[], cover: string | null): Promise<Result> {
  const supabase = await createClient()
  const coverFinal = cover && photos.includes(cover) ? cover : (photos[0] ?? null)
  const { error } = await supabase
    .from('logements')
    .update({
      photo_couverture_url: coverFinal,
      photos_urls: photos.filter(p => p !== coverFinal),
      updated_at: new Date().toISOString(),
    })
    .eq('id', logementId)
    .eq('user_id', userId)
  if (error) { log.error('save photos', error); return { error: 'Enregistrement impossible.' } }
  revalidatePath(`/dashboard/logements/${logementId}`)
  revalidatePath('/dashboard/logements')
  return { cover: coverFinal, photos }
}

/** Le bucket est créé à la première utilisation (et par la migration 114). */
async function ensureBucket() {
  const admin = getServiceClient()
  const { data } = await admin.storage.getBucket(BUCKET)
  if (data) return
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })
  if (error && !/exists/i.test(error.message)) log.error('create bucket', error)
}

export async function prepareLogementPhotoUploads(logementId: string, count: number): Promise<{ uploads: Array<{ path: string; token: string; publicUrl: string }> } | { error: string }> {
  const own = await ownLogement(logementId)
  if ('error' in own) return { error: own.error }
  const room = LOGEMENT_PHOTOS_MAX - allPhotos(own.row).length
  const n = Math.max(0, Math.min(room, Math.floor(count)))
  if (n === 0) return { error: `Ce logement a déjà ${LOGEMENT_PHOTOS_MAX} photos : supprimes-en avant d'en ajouter.` }
  await ensureBucket()
  const admin = getServiceClient()
  const uploads: Array<{ path: string; token: string; publicUrl: string }> = []
  for (let i = 0; i < n; i++) {
    const path = `${own.userId}/${logementId}/${crypto.randomUUID()}.jpg`
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) { log.error('signed url', error); return { error: 'Envoi impossible pour le moment.' } }
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
    uploads.push({ path, token: data.token, publicUrl: pub.publicUrl })
  }
  return { uploads }
}

/** Ajoute les photos envoyées. La première devient la couverture s'il n'y en a pas. */
export async function addLogementPhotos(logementId: string, publicUrls: string[]): Promise<Result> {
  const own = await ownLogement(logementId)
  if ('error' in own) return { error: own.error }
  // Seules les URL de notre bucket, dans le dossier de l'utilisateur et du logement
  const prefix = `/storage/v1/object/public/${BUCKET}/${own.userId}/${logementId}/`
  const valid = (publicUrls ?? []).filter(u => typeof u === 'string' && u.includes(prefix) && /\.jpg$/i.test(u))
  const photos = [...allPhotos(own.row), ...valid].slice(0, LOGEMENT_PHOTOS_MAX)
  return save(logementId, own.userId, photos, own.row.photo_couverture_url)
}

export async function setLogementCover(logementId: string, url: string): Promise<Result> {
  const own = await ownLogement(logementId)
  if ('error' in own) return { error: own.error }
  const photos = allPhotos(own.row)
  if (!photos.includes(url)) return { error: 'Photo introuvable.' }
  // La couverture passe en tête de liste
  return save(logementId, own.userId, [url, ...photos.filter(p => p !== url)], url)
}

export async function removeLogementPhoto(logementId: string, url: string): Promise<Result> {
  const own = await ownLogement(logementId)
  if ('error' in own) return { error: own.error }
  const photos = allPhotos(own.row).filter(p => p !== url)
  const res = await save(logementId, own.userId, photos, own.row.photo_couverture_url === url ? null : own.row.photo_couverture_url)
  // Fichier supprimé seulement s'il est dans notre bucket (une ancienne URL collée à la main n'est pas à nous)
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (!res.error && i >= 0) {
    const path = url.slice(i + marker.length)
    if (path.startsWith(`${own.userId}/${logementId}/`)) {
      await getServiceClient().storage.from(BUCKET).remove([path]).catch(() => null)
    }
  }
  return res
}
