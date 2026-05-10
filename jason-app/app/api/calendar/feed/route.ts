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
  const [
    { data: contracts },
    { data: sejours },
    { data: icalEvents },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, sejour_id')
      .eq('user_id', uid)
      .neq('statut', 'annule'),
    supabase
      .from('sejours')
      .select('id, logement, date_arrivee, date_depart, voyageurs(prenom, nom)')
      .eq('user_id', uid)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    supabase
      .from('ical_events')
      .select('id, title, start_date, end_date, start_time, end_time, description')
      .eq('user_id', uid),
  ])

  // Séjours déjà couverts par un contrat → on évite le doublon dans l'export
  const sejourIdsWithContract = new Set(
    (contracts ?? [])
      .map(c => (c as any).sejour_id as string | null)
      .filter((v): v is string => !!v)
  )

  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jason Marinho//Calendrier//FR',
    'X-WR-CALNAME:Calendrier Jason Marinho',
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // Suggestion aux clients (Google, Apple) de rafraîchir toutes les heures
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  // ── Arrivées et départs depuis les contrats ───────────────────────────────
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

  // ── Séjours sans contrat (pour ne pas doublonner avec les arr/dep) ────────
  for (const s of sejours ?? []) {
    if (sejourIdsWithContract.has((s as any).id)) continue
    const v = (s as any).voyageurs as { prenom?: string; nom?: string } | null
    const voyageurLabel = v
      ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur'
      : 'Voyageur'
    const logement = (s as any).logement ?? 'Logement'
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:sejour-${(s as any).id}@jasonmarinho.com`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART;VALUE=DATE:${icalDate((s as any).date_arrivee)}`)
    // date_depart est déjà la date de check-out → exclusive, pas de +1
    lines.push(`DTEND;VALUE=DATE:${icalDate((s as any).date_depart)}`)
    lines.push(fold(`SUMMARY:Séjour · ${esc(voyageurLabel)} · ${esc(logement)}`))
    lines.push('END:VEVENT')
  }

  // ── Réservations importées depuis les feeds Airbnb/Booking/Vrbo ───────────
  for (const e of icalEvents ?? []) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:imported-${e.id}@jasonmarinho.com`)
    lines.push(`DTSTAMP:${stamp}`)
    if (e.start_time) {
      lines.push(`DTSTART;TZID=Europe/Paris:${icalDT(e.start_date, e.start_time)}`)
      const ed = e.end_date ?? e.start_date
      lines.push(`DTEND;TZID=Europe/Paris:${icalDT(ed, e.end_time ?? e.start_time)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icalDate(e.start_date)}`)
      // end_date stocké correspond à la dernière nuit → +1 pour DTEND exclusif
      lines.push(`DTEND;VALUE=DATE:${nextDay(e.end_date ?? e.start_date)}`)
    }
    lines.push(fold(`SUMMARY:${esc(e.title)}`))
    if (e.description) lines.push(fold(`DESCRIPTION:${esc(e.description)}`))
    lines.push('END:VEVENT')
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
