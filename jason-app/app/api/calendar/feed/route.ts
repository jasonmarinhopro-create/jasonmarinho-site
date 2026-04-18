import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

function p2(n: number) { return String(n).padStart(2, '0') }
function icalDate(s: string) { return s.replace(/-/g, '') }
function icalDT(date: string, time: string) { return `${icalDate(date)}T${time.replace(':', '')}00` }
function nextDay(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const nd = new Date(y, m - 1, d + 1)
  return `${nd.getFullYear()}${p2(nd.getMonth() + 1)}${p2(nd.getDate())}`
}
function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}
function fold(line: string): string {
  if (line.length <= 75) return line
  const out = [line.slice(0, 75)]
  let pos = 75
  while (pos < line.length) { out.push(' ' + line.slice(pos, pos + 74)); pos += 74 }
  return out.join('\r\n')
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return new Response('Token requis', { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('ical_token', token)
    .single()

  if (!profile) return new Response('Token invalide', { status: 401 })

  const uid = profile.id
  const [{ data: events }, { data: contracts }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, date, end_date, start_time, end_time, description')
      .eq('user_id', uid),
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart')
      .eq('user_id', uid)
      .neq('statut', 'annule'),
  ])

  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jason Marinho//Calendrier//FR',
    'X-WR-CALNAME:Calendrier Jason Marinho',
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const ev of events ?? []) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:custom-${ev.id}@jasonmarinho.com`)
    lines.push(`DTSTAMP:${stamp}`)
    if (ev.start_time) {
      lines.push(`DTSTART;TZID=Europe/Paris:${icalDT(ev.date, ev.start_time)}`)
      const ed = ev.end_date ?? ev.date
      lines.push(`DTEND;TZID=Europe/Paris:${icalDT(ed, ev.end_time ?? ev.start_time)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icalDate(ev.date)}`)
      lines.push(`DTEND;VALUE=DATE:${nextDay(ev.end_date ?? ev.date)}`)
    }
    lines.push(fold(`SUMMARY:${esc(ev.title)}`))
    if (ev.description) lines.push(fold(`DESCRIPTION:${esc(ev.description)}`))
    lines.push('END:VEVENT')
  }

  for (const c of contracts ?? []) {
    if (c.date_arrivee) {
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:arr-${c.id}@jasonmarinho.com`)
      lines.push(`DTSTAMP:${stamp}`)
      lines.push(`DTSTART;VALUE=DATE:${icalDate(c.date_arrivee)}`)
      lines.push(`DTEND;VALUE=DATE:${nextDay(c.date_arrivee)}`)
      lines.push(`SUMMARY:Arrivée · ${esc(c.logement_nom ?? 'Logement')}`)
      lines.push('END:VEVENT')
    }
    if (c.date_depart) {
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:dep-${c.id}@jasonmarinho.com`)
      lines.push(`DTSTAMP:${stamp}`)
      lines.push(`DTSTART;VALUE=DATE:${icalDate(c.date_depart)}`)
      lines.push(`DTEND;VALUE=DATE:${nextDay(c.date_depart)}`)
      lines.push(`SUMMARY:Départ · ${esc(c.logement_nom ?? 'Logement')}`)
      lines.push('END:VEVENT')
    }
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendrier.ics"',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
