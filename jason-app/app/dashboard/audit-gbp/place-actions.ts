'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchPlaceFromMapsUrl } from '@/lib/audit-gbp/places-api'
import { placesResponseToAnswers, type PlacesImportResult } from '@/lib/audit-gbp/places-mapper'
import { placesAccessAdvice } from '@/lib/audit-gbp/places-errors'
import { logger } from '@/lib/logger'
import { PlacesBudgetError } from '@/lib/google/places-budget'
import { rateLimit } from '@/lib/security/rate-limit'
import { startAuditSession, saveAuditAnswers } from './actions'

const log = logger('audit-gbp/place-actions')

interface ActionResult<T = void> {
  ok?: T
  error?: string
}

// ─── Importe une fiche depuis une URL Google Maps ───
// Renvoie le résultat sans créer de session (l'utilisateur valide d'abord l'aperçu)
export async function previewMapsUrl(rawUrl: string): Promise<ActionResult<PlacesImportResult>> {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Validation
  const url = rawUrl.trim()
  if (!url) return { error: 'URL vide.' }
  if (!/^https?:\/\//.test(url)) {
    return { error: "L'URL doit commencer par http:// ou https://" }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return { error: 'Configuration manquante côté serveur (clé API).' }
  }
  // Part gratuite de Google partagée par tous les comptes : 10 audits express par heure et par compte
  const rl = await rateLimit('placesAudit', user.id, 10, 60 * 60 * 1000)
  if (!rl.allowed) return { error: "Tu as lancé beaucoup d'audits express : réessaie dans une heure." }

  try {
    const place = await fetchPlaceFromMapsUrl(url, apiKey)
    const result = placesResponseToAnswers(place)
    return { ok: result }
  } catch (err) {
    if (err instanceof PlacesBudgetError) {
      log.error('Places API : plafond gratuit', { msg: err.message.slice(0, 200) })
      return { error: "L'audit express est en pause jusqu'au 1er du mois prochain (limite gratuite de Google atteinte). Tu peux remplir le questionnaire à la main en attendant." }
    }
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    // Réponse brute de Google gardée dans les logs (et « Erreurs de l'app »
    // dans l'admin) : c'est elle qui dit exactement quel réglage bloque.
    if (!msg.includes('Aucun établissement') && !msg.includes("Impossible d'extraire")) {
      log.error('Places API', { msg: msg.slice(0, 600) })
    }
    // Refus d'accès : on traduit la raison donnée par Google en consigne
    const advice = placesAccessAdvice(msg)
    if (advice) return { error: advice }
    if (msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
      return { error: 'Quota Google atteint. Réessaie dans quelques minutes.' }
    }
    if (msg.includes("Aucun établissement") || msg.includes("Impossible d'extraire")) {
      return { error: msg }
    }
    return { error: 'Impossible de récupérer la fiche : ' + msg }
  }
}

// ─── Crée une session avec les réponses pré-remplies issues de l'URL ───
export async function startAuditFromMapsUrl(
  imported: PlacesImportResult
): Promise<ActionResult<{ sessionId: string }>> {
  const session = await startAuditSession({
    businessName: imported.meta.businessName || undefined,
    city: imported.meta.city || undefined,
  })
  if (session.error || !session.ok) {
    return { error: session.error ?? 'Erreur création session.' }
  }

  const save = await saveAuditAnswers(session.ok.sessionId, {
    ...imported.prefilled,
    __prefilled_keys: imported.prefilledQuestionIds,
  })
  if (save.error) return { error: save.error }

  return { ok: { sessionId: session.ok.sessionId } }
}
