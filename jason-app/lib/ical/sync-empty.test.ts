// Flux iCal vide (04/11/2026) : un calendrier valide sans réservation est
// marqué comme lu (plus relu toutes les 10 min), et quand des réservations
// y arrivent ensuite, elles sont bien importées.
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAndUpsertIcalFeed, isCalendarText } from './sync'

type Call = { table: string; op: string; payload?: unknown }

function fakeSupabase(calls: Call[]) {
  const builder = (table: string) => {
    const result = { data: table === 'ical_events' ? [] : null, error: null }
    const b: any = {
      select: () => { calls.push({ table, op: 'select' }); return b },
      update: (payload: unknown) => { calls.push({ table, op: 'update', payload }); return b },
      upsert: (payload: unknown) => { calls.push({ table, op: 'upsert', payload }); return b },
      delete: () => { calls.push({ table, op: 'delete' }); return b },
      eq: () => b, in: () => b,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => Promise.resolve(result).then(ok, ko),
    }
    return b
  }
  return { from: (t: string) => builder(t) } as unknown as SupabaseClient
}

const EMPTY = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//driing//Calendrier Export//FR\r\nCALSCALE:GREGORIAN\r\nEND:VCALENDAR'
const ONE = [
  'BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261201', 'DTEND;VALUE=DATE:20261204', 'UID:resa-1@driing', 'SUMMARY:Réservé', 'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

function mockFetch(body: string) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))
}

afterEach(() => vi.unstubAllGlobals())

describe('flux iCal vide', () => {
  it('reconnaît un calendrier, même vide, et refuse une page HTML', () => {
    expect(isCalendarText(EMPTY)).toBe(true)
    expect(isCalendarText('﻿' + EMPTY + '\r\n')).toBe(true)
    expect(isCalendarText(ONE)).toBe(true)
    expect(isCalendarText('<html><body>Erreur</body></html>')).toBe(false)
    expect(isCalendarText('')).toBe(false)
  })

  it('un calendrier vide est marqué comme lu, sans compter d’échec', async () => {
    mockFetch(EMPTY)
    const calls: Call[] = []
    const r = await fetchAndUpsertIcalFeed(fakeSupabase(calls), 'feed-1', 'https://exemple.test/a.ics', 'user-1')
    expect(r.synced).toBeUndefined()
    const updates = calls.filter(c => c.table === 'ical_feeds' && c.op === 'update')
    expect(updates).toHaveLength(1)
    expect(Object.keys(updates[0].payload as object)).toEqual(['last_synced'])
    expect(calls.some(c => c.op === 'upsert')).toBe(false)
  })

  it('une page qui n’est pas un calendrier n’est pas marquée comme lue', async () => {
    mockFetch('<html>maintenance</html>')
    const calls: Call[] = []
    await fetchAndUpsertIcalFeed(fakeSupabase(calls), 'feed-1', 'https://exemple.test/a.ics', 'user-1')
    expect(calls.some(c => c.op === 'update' && 'last_synced' in (c.payload as object))).toBe(false)
  })

  it('quand une réservation arrive ensuite, elle est importée', async () => {
    mockFetch(ONE)
    const calls: Call[] = []
    const r = await fetchAndUpsertIcalFeed(fakeSupabase(calls), 'feed-1', 'https://exemple.test/a.ics', 'user-1')
    expect(r.synced).toBe(1)
    const up = calls.find(c => c.op === 'upsert')
    expect(up?.table).toBe('ical_events')
    expect((up?.payload as Array<{ uid: string; start_date: string }>)[0]).toMatchObject({ uid: 'resa-1@driing', start_date: '2026-12-01' })
    expect(calls.some(c => c.table === 'ical_feeds' && c.op === 'update' && 'last_synced' in (c.payload as object))).toBe(true)
  })
})
