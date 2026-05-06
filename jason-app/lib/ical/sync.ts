// Helpers iCal partagés (parser + fetch/upsert)
// Utilisés par /dashboard/calendrier/actions.ts ET /dashboard/logements/actions.ts
// pour relier les URLs iCal stockées sur les logements au système de feeds.

import type { SupabaseClient } from '@supabase/supabase-js'

const FETCH_TIMEOUT_MS = 12000

export interface ParsedIcalEvent {
  uid: string
  title: string
  startDate: string
  endDate: string | null
  startTime: string | null
  endTime: string | null
  description: string | null
}

function p2(n: number) { return String(n).padStart(2, '0') }

export function parseIcalText(raw: string): ParsedIcalEvent[] {
  const events: ParsedIcalEvent[] = []
  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '') // unfold continuation lines

  let curr: Partial<ParsedIcalEvent> | null = null

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line === 'BEGIN:VEVENT') { curr = {}; continue }
    if (line === 'END:VEVENT') {
      if (curr?.uid && curr?.title && curr?.startDate) {
        events.push({
          uid: curr.uid,
          title: curr.title,
          startDate: curr.startDate,
          endDate: curr.endDate ?? null,
          startTime: curr.startTime ?? null,
          endTime: curr.endTime ?? null,
          description: curr.description ?? null,
        })
      }
      curr = null
      continue
    }
    if (!curr) continue

    const ci = line.indexOf(':')
    if (ci === -1) continue
    const propFull = line.slice(0, ci)
    const val = line.slice(ci + 1)
    const parts = propFull.split(';')
    const prop = parts[0].toUpperCase()
    const params: Record<string, string> = {}
    for (let i = 1; i < parts.length; i++) {
      const eq = parts[i].indexOf('=')
      if (eq !== -1) params[parts[i].slice(0, eq).toUpperCase()] = parts[i].slice(eq + 1)
    }

    if (prop === 'UID') curr.uid = val
    else if (prop === 'SUMMARY') curr.title = decIcal(val)
    else if (prop === 'DESCRIPTION') curr.description = decIcal(val)
    else if (prop === 'DTSTART') {
      const p = parseIcalDT(val, params)
      curr.startDate = p.date
      curr.startTime = p.time
    } else if (prop === 'DTEND') {
      const p = parseIcalDT(val, params)
      if (!p.time) {
        // All-day DTEND est exclusif : on retire 1 jour pour cohérence affichage
        const [y, m, d] = p.date.split('-').map(Number)
        const prev = new Date(y, m - 1, d - 1)
        curr.endDate = `${prev.getFullYear()}-${p2(prev.getMonth() + 1)}-${p2(prev.getDate())}`
      } else {
        curr.endDate = p.date
      }
      curr.endTime = p.time
    }
  }

  return events
}

function parseIcalDT(val: string, params: Record<string, string>) {
  const isDate = params['VALUE'] === 'DATE' || /^\d{8}$/.test(val)
  if (isDate) {
    const v = val.slice(0, 8)
    return { date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, time: null }
  }
  const clean = val.replace('Z', '')
  const [datePart, timePart] = clean.split('T')
  return {
    date: `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`,
    time: timePart ? `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}` : null,
  }
}

function decIcal(s: string): string {
  return s
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// ─── Fetch + parse + upsert dans ical_events ────────────────────────────────
// Retourne le nombre d'événements synchronisés ou un message d'erreur.

export interface SyncResult {
  synced?: number
  error?: string
}

export async function fetchAndUpsertIcalFeed(
  supabase: SupabaseClient,
  feedId: string,
  url: string,
  userId: string,
): Promise<SyncResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'JasonMarinho-Calendar/1.0' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return { error: `Erreur HTTP ${res.status}` }

    const text = await res.text()
    const parsed = parseIcalText(text)
    if (parsed.length === 0) return { error: 'Aucun événement dans ce flux iCal' }

    const { error: upsertErr } = await supabase
      .from('ical_events')
      .upsert(
        parsed.map(e => ({
          feed_id: feedId,
          user_id: userId,
          uid: e.uid,
          title: e.title,
          start_date: e.startDate,
          end_date: e.endDate,
          start_time: e.startTime,
          end_time: e.endTime,
          description: e.description,
        })),
        { onConflict: 'feed_id,uid' },
      )
    if (upsertErr) return { error: upsertErr.message }

    await supabase
      .from('ical_feeds')
      .update({ last_synced: new Date().toISOString() })
      .eq('id', feedId)

    return { synced: parsed.length }
  } catch (e: any) {
    if (e?.name === 'TimeoutError' || e?.message?.includes('timeout')) {
      return { error: 'Délai dépassé (12s). Vérifiez l\'URL.' }
    }
    return { error: e?.message ?? 'Erreur de connexion' }
  }
}

// ─── Bridge logement.ical_* → ical_feeds ────────────────────────────────────
// Pour chaque source iCal d'un logement (airbnb, booking, vrbo, autre),
// upsert un feed (par url) et lance la synchro initiale.

export type IcalSource = 'airbnb' | 'booking' | 'vrbo' | 'autre'

const SOURCE_LABEL: Record<IcalSource, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'Vrbo / Abritel',
  autre: 'Calendrier externe',
}

const SOURCE_COLOR: Record<IcalSource, string> = {
  airbnb: '#FF5A5F',  // Rouge Airbnb
  booking: '#003B95', // Bleu Booking
  vrbo: '#FFC72C',    // Jaune Vrbo
  autre: '#6366f1',   // Indigo neutre
}

export interface LogementIcalUrls {
  ical_airbnb?: string | null
  ical_booking?: string | null
  ical_vrbo?: string | null
  ical_autre?: string | null
}

/**
 * Pour chaque URL iCal présente sur un logement, upsert un feed dans ical_feeds
 * (clé : user_id + url) et lance la sync. À appeler après create/update logement.
 *
 * Best-effort : les erreurs de sync n'empêchent pas la sauvegarde du logement.
 */
export async function syncLogementIcalUrls(
  supabase: SupabaseClient,
  userId: string,
  logementNom: string,
  urls: LogementIcalUrls,
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = []
  let totalSynced = 0

  const sources: Array<{ key: IcalSource; url: string | null | undefined }> = [
    { key: 'airbnb',  url: urls.ical_airbnb },
    { key: 'booking', url: urls.ical_booking },
    { key: 'vrbo',    url: urls.ical_vrbo },
    { key: 'autre',   url: urls.ical_autre },
  ]

  for (const { key, url } of sources) {
    const trimmed = url?.trim()
    if (!trimmed) continue

    // 1) Cherche un feed existant pour ce user + url
    const { data: existing } = await supabase
      .from('ical_feeds')
      .select('id')
      .eq('user_id', userId)
      .eq('url', trimmed)
      .maybeSingle()

    let feedId: string | null = existing?.id ?? null

    // 2) Si absent, on crée
    if (!feedId) {
      const name = `${SOURCE_LABEL[key]} — ${logementNom}`
      const { data: created, error } = await supabase
        .from('ical_feeds')
        .insert({
          user_id: userId,
          name,
          url: trimmed,
          color: SOURCE_COLOR[key],
        })
        .select('id')
        .single()
      if (error || !created) {
        errors.push(`${SOURCE_LABEL[key]} : ${error?.message ?? 'création échouée'}`)
        continue
      }
      feedId = created.id
    }

    // 3) Sync immédiate (feedId est garanti non-null ici)
    if (!feedId) continue
    const result = await fetchAndUpsertIcalFeed(supabase, feedId, trimmed, userId)
    if (result.error) {
      errors.push(`${SOURCE_LABEL[key]} : ${result.error}`)
    } else if (result.synced) {
      totalSynced += result.synced
    }
  }

  return { synced: totalSynced, errors }
}

export { SOURCE_LABEL, SOURCE_COLOR }
