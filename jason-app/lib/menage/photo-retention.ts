// Conservation des photos de fin de ménage : 90 jours (décision de Jason,
// sept. 2026). Le stockage gratuit de Supabase est limité à 1 Go et les
// photos de ménage en sont le plus gros consommateur. 90 jours couvrent les
// litiges de caution (blocage de ~7 jours) et la plupart des contestations
// bancaires. L'hôte est prévenu sur la page du ménage et peut télécharger
// les photos avant. Purge : cron quotidien /api/cron/notifications-engine.

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDaysIso, parisToday } from '@/lib/stripe/deposit-window'

export const MENAGE_PHOTOS_RETENTION_DAYS = 90
const BUCKET = 'menage-photos'

/** Dernier jour où les photos d'un ménage sont conservées */
export function menagePhotosKeptUntil(menageDate: string): string {
  return addDaysIso(menageDate.slice(0, 10), MENAGE_PHOTOS_RETENTION_DAYS)
}

/** Les photos de ce ménage ont-elles dépassé la durée de conservation ? */
export function menagePhotosExpired(menageDate: string, now: Date = new Date()): boolean {
  return parisToday(now) > menagePhotosKeptUntil(menageDate)
}

/** Ménages dont les photos doivent être supprimées : date < aujourd'hui − 90 jours */
export function menagePhotosCutoff(now: Date = new Date()): string {
  return addDaysIso(parisToday(now), -MENAGE_PHOTOS_RETENTION_DAYS)
}

/**
 * Supprime les photos des ménages de plus de 90 jours (fichiers + chemins en
 * base). La ligne du ménage est gardée (date, note, qui l'a fait). Par lots
 * pour rester dans le temps du cron ; le reste part le lendemain.
 */
export async function purgeOldMenagePhotos(db: SupabaseClient, now: Date = new Date(), limit = 200): Promise<number> {
  const { data: rows, error } = await db
    .from('menage_completions')
    .select('id, photos')
    .lt('date', menagePhotosCutoff(now))
    .neq('photos', '{}')
    .limit(limit)
  if (error || !rows?.length) return 0

  let purged = 0
  for (const row of rows as Array<{ id: string; photos: string[] | null }>) {
    const paths = row.photos ?? []
    if (paths.length) {
      const { error: rmErr } = await db.storage.from(BUCKET).remove(paths)
      if (rmErr) { console.warn('[menage-photos] suppression échouée', row.id, rmErr.message); continue }
    }
    await db.from('menage_completions').update({ photos: [] }).eq('id', row.id)
    purged++
  }
  return purged
}
