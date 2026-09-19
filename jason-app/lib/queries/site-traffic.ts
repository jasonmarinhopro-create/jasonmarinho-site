// Trafic en direct + canal d'acquisition du site statique (jasonmarinho.com),
// lu depuis la table site_visits (une ligne par page vue, écrite par
// api/track/visit.js côté site statique). Réservé à l'admin.
import type { SupabaseClient } from '@supabase/supabase-js'

export type Channel = 'direct' | 'recherche' | 'social' | 'referral'

export const CHANNEL_LABELS: Record<Channel, string> = {
  direct: 'Direct',
  recherche: 'Recherche organique',
  social: 'Réseaux sociaux',
  referral: 'Autres sites',
}

const SEARCH_HOSTS = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'qwant.', 'ecosia.']
const SOCIAL_HOSTS = ['facebook.', 'instagram.', 'tiktok.', 'linkedin.', 'twitter.', 'x.com', 't.co', 'pinterest.', 'threads.net', 'reddit.']
const SOCIAL_UTM_SOURCES = ['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'x', 'pinterest']

/** Classe une visite en canal d'acquisition à partir du referrer + UTM. */
export function classifyChannel(referrer: string | null, utmSource: string | null, utmMedium: string | null): Channel {
  const src = (utmSource || '').toLowerCase()
  const medium = (utmMedium || '').toLowerCase()
  if (medium === 'social' || SOCIAL_UTM_SOURCES.includes(src)) return 'social'
  if (src) return 'referral' // UTM renseigné mais pas social : campagne trackée (email, pub, partenaire…)

  if (!referrer) return 'direct'
  let host = ''
  try { host = new URL(referrer).hostname.toLowerCase() } catch { return 'direct' }
  if (!host) return 'direct'
  if (SEARCH_HOSTS.some(h => host.includes(h))) return 'recherche'
  if (SOCIAL_HOSTS.some(h => host.includes(h))) return 'social'
  // Referrer sur notre propre domaine = navigation interne, pas un vrai canal externe
  if (host.includes('jasonmarinho.com')) return 'direct'
  return 'referral'
}

export interface ChannelBreakdown {
  channel: Channel
  count: number
  pct: number
}

/** Sessions distinctes ayant eu au moins une page vue dans les N dernières minutes. */
export async function getLiveVisitorsCount(admin: SupabaseClient, minutes = 5): Promise<number> {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString()
  const { data } = await admin
    .from('site_visits')
    .select('session_id')
    .gte('created_at', since)
    .limit(5000)
  if (!data) return 0
  return new Set(data.map((r: { session_id: string }) => r.session_id)).size
}

/** Répartition des sessions (pas des pages vues) par canal sur les N dernières heures. */
export async function getChannelBreakdown(admin: SupabaseClient, hours = 24): Promise<ChannelBreakdown[]> {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString()
  const { data } = await admin
    .from('site_visits')
    .select('session_id, referrer, utm_source, utm_medium')
    .gte('created_at', since)
    .limit(20000)
  if (!data || data.length === 0) return []

  // Une session peut avoir plusieurs pages vues avec des referrers différents
  // (ex: arrivée Google puis navigation interne) : on garde le PREMIER
  // referrer vu par session (ordre d'insertion ≈ ordre chronologique côté
  // Supabase par défaut), c'est lui qui reflète le vrai canal d'entrée.
  const firstBySession = new Map<string, { referrer: string | null; utm_source: string | null; utm_medium: string | null }>()
  for (const row of data as Array<{ session_id: string; referrer: string | null; utm_source: string | null; utm_medium: string | null }>) {
    if (!firstBySession.has(row.session_id)) firstBySession.set(row.session_id, row)
  }

  const counts: Record<Channel, number> = { direct: 0, recherche: 0, social: 0, referral: 0 }
  for (const row of firstBySession.values()) {
    counts[classifyChannel(row.referrer, row.utm_source, row.utm_medium)]++
  }
  const total = firstBySession.size
  return (Object.keys(counts) as Channel[])
    .map(channel => ({ channel, count: counts[channel], pct: total > 0 ? Math.round((counts[channel] / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
}
