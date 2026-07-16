/**
 * Flux iCal dédié à la femme de ménage.
 *
 * Réutilise le `ical_token` de l'hôte (le même que le calendrier perso) pour
 * éviter une 2e table de tokens. La femme de ménage s'abonne à cette URL
 * depuis son téléphone (Apple Calendar, Google Cal) et reçoit uniquement
 * les créneaux ménage — pas les noms de voyageurs ni les détails financiers.
 *
 * Différences avec /api/calendar/feed :
 *   - Pas de noms de voyageurs (RGPD-friendly côté tiers)
 *   - Inclut les créneaux DÉRIVÉS automatiquement (turnover, départs)
 *   - Inclut l'adresse + les notes du logement (utile pour le travail)
 *   - 6 mois glissants seulement (pas d'historique pollué)
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { computeMenageSlots, type Occupation, type LogementSettings } from '@/lib/menage/compute'

function p2(n: number) { return String(n).padStart(2, '0') }
function icalDate(s: string) { return s.replace(/-/g, '') }
function icalDT(date: string, time: string) {
  return `${icalDate(date)}T${time.replace(':', '')}00`
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

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
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
    .select('id, full_name')
    .eq('ical_token', token)
    .single()

  if (!profile) return new Response('Token invalide', { status: 401 })

  const uid = profile.id

  // Fenêtre : 1 mois en arrière (rétro pour les apps qui veulent du contexte)
  // + 6 mois en avant (suffisant pour planifier sans polluer l'agenda).
  const now = new Date()
  const fromDate = toISODate(new Date(now.getTime() - 30 * 86400000))
  const toDate = toISODate(new Date(now.getTime() + 180 * 86400000))

  const [
    { data: contracts },
    { data: sejours },
    { data: logements },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, sejour_id, statut')
      .eq('user_id', uid)
      .neq('statut', 'annule'),
    supabase
      .from('sejours')
      .select('id, logement, date_arrivee, date_depart')
      .eq('user_id', uid)
      .is('annule_at', null)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    supabase
      .from('logements')
      .select('id, nom, adresse, menage_duree_min, menage_heure_defaut, menage_notes, contact_menage_nom, contact_menage_tel, frais_menage')
      .eq('user_id', uid),
  ])

  const sejourIdsWithContract = new Set(
    (contracts ?? [])
      .map(c => (c as any).sejour_id as string | null)
      .filter((v): v is string => !!v)
  )

  const occupations: Occupation[] = []
  for (const c of contracts ?? []) {
    if (!c.date_arrivee || !c.date_depart) continue
    occupations.push({
      sourceId: `contract-${c.id}`,
      source: 'contract',
      logementName: c.logement_nom ?? '',
      dateArrivee: c.date_arrivee,
      dateDepart: c.date_depart,
    })
  }
  for (const s of (sejours ?? []) as any[]) {
    if (sejourIdsWithContract.has(s.id)) continue
    occupations.push({
      sourceId: `sejour-${s.id}`,
      source: 'sejour',
      logementName: s.logement ?? '',
      dateArrivee: s.date_arrivee,
      dateDepart: s.date_depart,
    })
  }

  const logementSettings: LogementSettings[] = (logements ?? []).map((l: any) => ({
    id: l.id,
    nom: l.nom ?? 'Logement',
    menageDureeMin: l.menage_duree_min ?? 180,
    menageHeureDefaut: l.menage_heure_defaut ?? '11:00',
    menageNotes: l.menage_notes ?? null,
    adresse: l.adresse ?? null,
    contactMenageNom: l.contact_menage_nom ?? null,
    contactMenageTel: l.contact_menage_tel ?? null,
    fraisMenage: l.frais_menage ?? null,
  }))

  const slots = computeMenageSlots(occupations, logementSettings, { fromDate, toDate })

  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jason Marinho//Planning Ménage//FR',
    'X-WR-CALNAME:Planning Ménage',
    'X-WR-TIMEZONE:Europe/Paris',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  for (const slot of slots) {
    const summary = slot.sameDay
      ? `🧹 ${slot.logementName} (turnover serré)`
      : `🧹 ${slot.logementName}`

    const descLines: string[] = []
    if (slot.adresse) descLines.push(`Adresse : ${slot.adresse}`)
    if (slot.notes) descLines.push(`Notes : ${slot.notes}`)
    if (slot.fraisMenage != null && slot.fraisMenage > 0) descLines.push(`Forfait : ${slot.fraisMenage} €`)
    if (slot.sameDay) descLines.push(`⚠️ Turnover serré : une nouvelle arrivée le même jour.`)
    const description = descLines.join('\\n') || 'Ménage planifié'

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:menage-${slot.id}@jasonmarinho.com`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART;TZID=Europe/Paris:${icalDT(slot.date, slot.startTime)}`)
    lines.push(`DTEND;TZID=Europe/Paris:${icalDT(slot.date, slot.endTime)}`)
    lines.push(fold(`SUMMARY:${esc(summary)}`))
    lines.push(fold(`DESCRIPTION:${esc(description)}`))
    if (slot.adresse) lines.push(fold(`LOCATION:${esc(slot.adresse)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="planning-menage.ics"',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
