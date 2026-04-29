'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchPlaceFromMapsUrl } from '@/lib/audit-gbp/places-api'
import { placesResponseToAnswers, type PlacesImportResult } from '@/lib/audit-gbp/places-mapper'
import { startAuditSession, saveAuditAnswers } from './actions'

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

  try {
    const place = await fetchPlaceFromMapsUrl(url, apiKey)
    const result = placesResponseToAnswers(place)
    return { ok: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    // Messages d'erreur user-friendly
    if (msg.includes('REQUEST_DENIED') || msg.includes('403')) {
      return { error: 'La clé API n\'est pas autorisée. Vérifie les restrictions côté Google Cloud.' }
    }
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
