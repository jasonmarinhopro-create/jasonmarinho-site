// Brouillon de Ma fiche côté serveur (atelier, 27/10/2026) : enregistré à
// chaque changement, sans reconstruire le site. Appelé par les actions des deux
// Ma fiche, une fois la fiche cible vérifiée (propre fiche ou admin).
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { DRAFT_MAX_CHARS, readDraft } from './fiche-draft'

const log = logger('pros/fiche-draft')
type ProTable = 'photographers' | 'cleaners' | 'depannage_pros'

export type DraftSaveResult = { ok: true } | { ok: false; reason: 'trop_long' | 'indisponible' | 'erreur' }

/** Garde le brouillon (null = plus rien à mettre en ligne). Migration 167 absente : « indisponible », le navigateur le garde. */
export async function saveDraft(table: ProTable, proId: string, raw: unknown): Promise<DraftSaveResult> {
  let value: unknown = null
  if (raw !== null) {
    const env = readDraft(raw)
    if (!env) return { ok: false, reason: 'erreur' }
    if (JSON.stringify(env).length > DRAFT_MAX_CHARS) return { ok: false, reason: 'trop_long' }
    value = env
  }
  const { error } = await getServiceClient().from(table).update({ fiche_draft: value }).eq('id', proId)
  if (!error) return { ok: true }
  if (/fiche_draft/.test(`${error.message} ${error.details ?? ''}`)) return { ok: false, reason: 'indisponible' }
  log.error('brouillon non enregistré', { table, err: error.message })
  return { ok: false, reason: 'erreur' }
}

export async function clearDraft(table: ProTable, proId: string): Promise<void> {
  await getServiceClient().from(table).update({ fiche_draft: null }).eq('id', proId)
}
