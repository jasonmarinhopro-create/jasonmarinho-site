// Notifications des réservations Airbnb / Booking / Vrbo nouvelles, modifiées
// ou annulées, détectées pendant une synchronisation iCal (SERVER ONLY).
// Appelé par lib/ical/sync.ts (import dynamique : le module de synchro reste
// testable sans l'environnement serveur).
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parisToday } from '@/lib/stripe/deposit-window'
import { createNotification } from './create'
import { diffIcalReservations, icalChangeText } from './present'

type UidEvent = { uid: string; feed_id: string; title: string | null; description: string | null; start_date: string | null; end_date: string | null }

/** Au-delà, c'est plutôt un flux remplacé qu'une vraie série de réservations : un seul résumé */
const MAX_DETAILED = 6

export async function notifyIcalChanges(db: SupabaseClient, input: {
  userId: string
  feed: { id: string; url: string; name?: string | null }
  before: UidEvent[]
  after: UidEvent[]
}): Promise<number> {
  const today = parisToday()
  // Premier passage sans les logements : le plus souvent rien n'a changé
  if (diffIcalReservations({ before: input.before, after: input.after, feed: input.feed, logements: [], today }).length === 0) return 0
  const { data: logements } = await db.from('logements')
    .select('nom, ical_airbnb, ical_booking, ical_vrbo, ical_autre').eq('user_id', input.userId)
  const changes = diffIcalReservations({ ...input, logements: logements ?? [], today })
  if (changes.length === 0) return 0

  if (changes.length > MAX_DETAILED) {
    const ok = await createNotification({
      recipientId: input.userId, category: 'sejour', type: 'ical_resume',
      title: `${changes.length} réservations mises à jour`,
      body: `${input.feed.name ?? 'Un calendrier'} a changé : ${changes.filter(c => c.kind === 'nouvelle').length} nouvelle(s), ${changes.filter(c => c.kind === 'modifiee').length} modifiée(s), ${changes.filter(c => c.kind === 'annulee').length} annulée(s). Vérifie que le lien iCal de la fiche logement est le bon.`,
      ctaLabel: 'Voir mes réservations', ctaHref: '/dashboard/reservations',
      severity: 'warning',
      dedupKey: `ical_resume:${input.feed.id}:${new Date().toISOString().slice(0, 13)}`,
    })
    return ok ? 1 : 0
  }

  let created = 0
  for (const c of changes) {
    const t = icalChangeText(c)
    if (await createNotification({
      recipientId: input.userId, category: 'sejour', type: t.type,
      title: t.title, body: t.body,
      ctaLabel: c.kind === 'nouvelle' ? 'Compléter la réservation' : 'Voir mes réservations',
      ctaHref: '/dashboard/reservations',
      severity: t.severity,
      metadata: { feed_id: input.feed.id, uid: c.uid, arrivee: c.dateArrivee, depart: c.dateDepart },
      // Une modification est une nouvelle alerte à chaque nouveau jeu de dates
      dedupKey: `${t.type}:${input.feed.id}:${c.uid}:${c.dateArrivee}:${c.dateDepart}`,
      expiresAt: new Date(`${c.dateDepart}T23:59:59+02:00`),
    })) created++
  }
  return created
}
