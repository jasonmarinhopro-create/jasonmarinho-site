'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Custom events ──────────────────────────────────────────────────────────

interface EventInput {
  title: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  category: string
  description: string | null
}

interface EventUpdate {
  title: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  category: string
  description: string | null
}

export async function createCalendarEvent(input: EventInput) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...input, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { event: data }
}

export async function updateCalendarEvent(id: string, input: EventUpdate) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { event: data }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { success: true }
}

// ─── iCal feeds ─────────────────────────────────────────────────────────────

export async function addIcalFeed(input: { name: string; url: string; color: string }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('ical_feeds')
    .insert({ ...input, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { feed: data }
}

export async function removeIcalFeed(id: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('ical_feeds')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function syncIcalFeed(feedId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data: feed } = await supabase
    .from('ical_feeds')
    .select('id, url')
    .eq('id', feedId)
    .eq('user_id', session.user.id)
    .single()

  if (!feed) return { error: 'Flux introuvable' }

  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'JasonMarinho-Calendar/1.0' },
      signal: AbortSignal.timeout(12000),
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
          user_id: session.user.id,
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

    revalidatePath('/dashboard/calendrier')
    return { synced: parsed.length }
  } catch (e: any) {
    if (e?.name === 'TimeoutError' || e?.message?.includes('timeout')) {
      return { error: 'Délai dépassé (12s). Vérifiez l\'URL.' }
    }
    return { error: e?.message ?? 'Erreur de connexion' }
  }
}

// ─── iCal parser ────────────────────────────────────────────────────────────

function p2(n: number) { return String(n).padStart(2, '0') }

interface ParsedEvent {
  uid: string
  title: string
  startDate: string
  endDate: string | null
  startTime: string | null
  endTime: string | null
  description: string | null
}

function parseIcalText(raw: string): ParsedEvent[] {
  const events: ParsedEvent[] = []
  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '') // unfold continuation lines

  let curr: Partial<ParsedEvent> | null = null

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
        // All-day DTEND is exclusive: subtract 1 day
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
