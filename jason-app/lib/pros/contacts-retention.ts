// Conservation des demandes reçues par les pros de l'annuaire (formulaire
// « Contacter » des fiches photographes et ménage) : 3 ans après la demande,
// durée annoncée dans la politique de confidentialité (04/10/2026), alignée sur
// le référentiel « gestion commerciale » de la CNIL (prospects : 3 ans après le
// dernier contact). Le pro peut supprimer une demande avant ; tout part avec
// sa fiche (on delete cascade). Purge : cron /api/cron/notifications-engine.

import type { SupabaseClient } from '@supabase/supabase-js'

export const PRO_CONTACTS_RETENTION_YEARS = 3
const TABLES = ['photographer_contacts', 'cleaner_contacts'] as const

/** Demandes antérieures à cet instant (ISO) à supprimer */
export function proContactsCutoff(now: Date = new Date()): string {
  const d = new Date(now)
  d.setUTCFullYear(d.getUTCFullYear() - PRO_CONTACTS_RETENTION_YEARS)
  return d.toISOString()
}

/** Supprime les demandes de plus de 3 ans. Renvoie le nombre de lignes supprimées. */
export async function purgeOldProContacts(db: SupabaseClient, now: Date = new Date()): Promise<number> {
  const cutoff = proContactsCutoff(now)
  let total = 0
  for (const table of TABLES) {
    const { data, error } = await db.from(table).delete().lt('created_at', cutoff).select('id')
    if (error) { console.warn(`[pro-contacts] purge ${table} échouée`, error.message); continue }
    total += data?.length ?? 0
  }
  return total
}
