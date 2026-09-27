// Extraction du token d'un lien de planning ménage partagé par un hôte
// (/api/calendar/menage-feed?token=<uuid>). Accepte l'URL complète (https ou
// webcal), l'URL de l'agenda perso de l'hôte, ou le token seul.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function extractPlanningToken(input: string): string | null {
  const s = (input ?? '').trim()
  if (!s) return null
  try {
    const t = new URL(s.replace(/^webcal:\/\//i, 'https://')).searchParams.get('token')
    if (t) return t.match(UUID_RE)?.[0]?.toLowerCase() ?? null
  } catch { /* pas une URL : on cherche un token brut */ }
  return s.match(UUID_RE)?.[0]?.toLowerCase() ?? null
}
