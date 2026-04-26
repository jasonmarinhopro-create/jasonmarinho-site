/**
 * Compute compact "pro stats" for a member (e.g. "3 logements · Paris · 18 mois")
 * to display under their pseudo in posts and replies.
 *
 * Respects the member's privacy toggles.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ProStats = {
  /** Number of logements, null if hidden */
  logementsCount: number | null
  /** Most common city, null if hidden or unknown */
  city: string | null
  /** Months since profile creation, null if unknown */
  monthsSince: number | null
}

export type ProStatsByUser = Record<string, ProStats>

/**
 * Extract a city from a free-text address (best-effort).
 * Looks for patterns like "75015 Paris" or "Paris" in last comma-separated segment.
 */
function extractCity(address: string | null | undefined): string | null {
  if (!address) return null
  const cleaned = address.trim()
  if (!cleaned) return null

  // Match French postal code + city : "75015 Paris" → "Paris"
  const postalMatch = cleaned.match(/\b\d{5}\s+([A-Za-zÀ-ÖØ-öø-ÿ\s\-]+?)(?:\s*,|\s*$)/)
  if (postalMatch) return postalMatch[1].trim()

  // Otherwise take last segment after last comma
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  // Last part might be country, prefer second-to-last if it looks like a city
  const last = parts[parts.length - 1]
  if (parts.length > 1 && /\b\d{5}\b/.test(last)) {
    return last.replace(/\b\d{5}\b/, '').trim() || null
  }
  return last
}

/**
 * Fetch pro stats in bulk for multiple users.
 * `profilesData` must include privacy flags + created_at.
 */
export async function getBulkProStats(
  supabase: SupabaseClient,
  profilesData: Array<{
    id: string
    created_at: string | null
    privacy_show_logements: boolean | null
    privacy_show_city: boolean | null
  }>,
): Promise<ProStatsByUser> {
  if (profilesData.length === 0) return {}

  const userIds = profilesData.map(p => p.id)

  // Bulk fetch logements (only id, user_id, adresse — minimal cost)
  const { data: logementsData } = await supabase
    .from('logements')
    .select('user_id, adresse')
    .in('user_id', userIds)

  // Group by user_id
  const logementsByUser: Record<string, Array<{ adresse: string | null }>> = {}
  ;(logementsData ?? []).forEach(l => {
    if (!logementsByUser[l.user_id]) logementsByUser[l.user_id] = []
    logementsByUser[l.user_id].push({ adresse: l.adresse })
  })

  const result: ProStatsByUser = {}
  for (const p of profilesData) {
    const logements = logementsByUser[p.id] ?? []

    // Months since
    let monthsSince: number | null = null
    if (p.created_at) {
      const diff = Date.now() - new Date(p.created_at).getTime()
      monthsSince = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)))
    }

    // City : most common city across logements
    let city: string | null = null
    if (p.privacy_show_city !== false && logements.length > 0) {
      const cityCounts: Record<string, number> = {}
      for (const l of logements) {
        const c = extractCity(l.adresse)
        if (c) cityCounts[c] = (cityCounts[c] ?? 0) + 1
      }
      const sorted = Object.entries(cityCounts).sort(([, a], [, b]) => b - a)
      city = sorted[0]?.[0] ?? null
    }

    result[p.id] = {
      logementsCount: p.privacy_show_logements !== false ? logements.length : null,
      city,
      monthsSince,
    }
  }

  return result
}

/**
 * Format pro stats as a compact string : "3 logements · Paris · 18 mois"
 */
export function formatProStats(stats: ProStats | undefined): string {
  if (!stats) return ''
  const parts: string[] = []
  if (stats.logementsCount && stats.logementsCount > 0) {
    parts.push(`${stats.logementsCount} logement${stats.logementsCount > 1 ? 's' : ''}`)
  }
  if (stats.city) parts.push(stats.city)
  if (stats.monthsSince !== null) {
    if (stats.monthsSince < 1)        parts.push('nouveau')
    else if (stats.monthsSince < 12)  parts.push(`${stats.monthsSince} mois`)
    else                              parts.push(`${Math.floor(stats.monthsSince / 12)} an${Math.floor(stats.monthsSince / 12) > 1 ? 's' : ''}`)
  }
  return parts.join(' · ')
}
