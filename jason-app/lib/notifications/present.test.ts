import { describe, it, expect } from 'vitest'
import {
  groupOf, fromAppNotification, fromForumNotification, fromChangelog, sortFeed, cleanText,
  dayBucket, bucketize, countByGroup, diffIcalReservations, icalChangeText, stayLabel, parisDay,
} from './present'
import type { AppNotification } from './types'

const notif = (o: Partial<AppNotification>): AppNotification => ({
  id: 'n1', category: 'sejour', type: 'arrivee_demain', title: 'T', body: null, cta_label: null, cta_href: null,
  severity: 'info', metadata: {}, dedup_key: 'k', read_at: null, created_at: '2026-09-29T08:00:00Z', expires_at: null, ...o,
})

describe('groupes', () => {
  it('déduit le groupe du type, puis de la catégorie', () => {
    expect(groupOf('arrivee_demain', 'sejour')).toBe('reservations')
    expect(groupOf('ical_nouvelle', 'sejour')).toBe('reservations')
    expect(groupOf('contrat_signe', 'sejour')).toBe('paiements')
    expect(groupOf('deposit_expired', 'sejour')).toBe('paiements')
    expect(groupOf('checkin_rempli', 'sejour')).toBe('voyageurs')
    expect(groupOf('menage_termine', 'sejour')).toBe('menage')
    expect(groupOf('plafond_micro_15k_proche', 'fiscal')).toBe('compte')
    expect(groupOf('sync_failed', 'sync')).toBe('compte')
    expect(groupOf('autre', 'chez_nous')).toBe('questions')
  })
})

describe('fil', () => {
  it('retire emojis et tirets cadratins des anciennes alertes', () => {
    expect(cleanText('🚨 Plafond atteint')).toBe('Plafond atteint')
    expect(cleanText('Arrivée demain — Camille Durand')).toBe('Arrivée demain : Camille Durand')
    expect(fromAppNotification(notif({ title: '⚠️ Tu approches' })).title).toBe('Tu approches')
  })
  it('Questions & réponses : texte selon le type', () => {
    const base = { id: 'q1', post_id: 'p1', read_at: null, created_at: '2026-09-29T08:00:00Z', actor_id: 'a' }
    expect(fromForumNotification({ ...base, type: 'reply' }, 'Taxe de séjour ?', 'Marie').title).toBe('Marie a répondu')
    expect(fromForumNotification({ ...base, type: 'accepted' }, null, null).title).toBe('Ta réponse a été retenue')
    expect(fromForumNotification({ ...base, type: 'mention' }, 'X', null).title).toBe("Un hôte t'a cité dans une discussion")
    expect(fromForumNotification({ ...base, type: 'reply' }, 'X', 'M').href).toBe('/dashboard/chez-nous/p1')
  })
  it('nouveautés lues selon la dernière visite', () => {
    const e = [{ id: 'a', date: '2026-09-29', tag: 'nouveau' as const, title: 'A', description: 'd' }, { id: 'b', date: '2026-09-01', tag: 'nouveau' as const, title: 'B', description: 'd' }]
    const items = fromChangelog(e, '2026-09-10T08:00:00Z')
    expect(items.map(i => i.read)).toEqual([false, true])
    expect(fromChangelog(e, null).every(i => !i.read)).toBe(true)
  })
  it('tri et comptage', () => {
    const a = fromAppNotification(notif({ id: 'a', created_at: '2026-09-28T08:00:00Z' }))
    const b = fromAppNotification(notif({ id: 'b', type: 'contrat_signe', created_at: '2026-09-29T08:00:00Z' }))
    expect(sortFeed([a, b]).map(i => i.id)).toEqual(['b', 'a'])
    expect(countByGroup([a, b])).toMatchObject({ reservations: 1, paiements: 1, questions: 0 })
  })
})

describe('jours à Paris', () => {
  it('minuit à Paris compte pour le lendemain', () => {
    expect(parisDay('2026-09-28T22:30:00Z')).toBe('2026-09-29')
    expect(dayBucket('2026-09-28T22:30:00Z', '2026-09-29')).toBe('today')
    expect(dayBucket('2026-09-28T10:00:00Z', '2026-09-29')).toBe('yesterday')
    expect(dayBucket('2026-09-24T10:00:00Z', '2026-09-29')).toBe('week')
    expect(dayBucket('2026-09-01T10:00:00Z', '2026-09-29')).toBe('older')
  })
  it('sections vides retirées', () => {
    const a = fromAppNotification(notif({ created_at: '2026-09-29T08:00:00Z' }))
    const b = fromAppNotification(notif({ id: 'b', created_at: '2026-09-01T08:00:00Z' }))
    expect(bucketize([a, b], '2026-09-29').map(s => s.bucket)).toEqual(['today', 'older'])
  })
})

describe('réservations iCal', () => {
  const feed = { id: 'f1', url: 'https://www.airbnb.fr/calendar/ical/1.ics', name: 'Airbnb' }
  const logements = [{ nom: 'Le Cabanon', ical_airbnb: 'https://www.airbnb.fr/calendar/ical/1.ics' }]
  const ev = (uid: string, s: string, e: string, title = 'Reserved') => ({ uid, feed_id: 'f1', title, description: null, start_date: s, end_date: e })
  const today = '2026-09-29'

  it('première synchro : aucune alerte', () => {
    expect(diffIcalReservations({ before: [], after: [ev('a', '2026-10-10', '2026-10-12')], feed, logements, today })).toEqual([])
  })
  it('nouvelle, modifiée, annulée ; blocages et séjours passés ignorés', () => {
    const before = [ev('old', '2026-10-01', '2026-10-02'), ev('move', '2026-10-05', '2026-10-06'), ev('gone', '2026-10-20', '2026-10-21'), ev('past', '2026-09-20', '2026-09-22')]
    const after = [ev('old', '2026-10-01', '2026-10-02'), ev('move', '2026-10-06', '2026-10-07'), ev('new', '2026-11-01', '2026-11-03'), ev('bloc', '2026-12-01', '2026-12-05', 'Airbnb (Not available)')]
    const changes = diffIcalReservations({ before, after, feed, logements, today })
    expect(changes.map(c => `${c.kind}:${c.uid}`).sort()).toEqual(['annulee:gone', 'modifiee:move', 'nouvelle:new'])
    const nouvelle = changes.find(c => c.kind === 'nouvelle')!
    expect(nouvelle.logementName).toBe('Le Cabanon')
    expect(nouvelle.dateDepart).toBe('2026-11-04')
    const t = icalChangeText(nouvelle)
    expect(t.title).toBe('Nouvelle réservation Airbnb')
    expect(t.body).toContain('Le Cabanon, du 1 nov. au 4 nov. (3 nuits)')
  })
  it('libellé de séjour', () => {
    expect(stayLabel('2026-10-10', '2026-10-11')).toBe('du 10 oct. au 11 oct. (1 nuit)')
  })
  it('pas de tiret cadratin ni d’emoji dans les textes', () => {
    const c = { kind: 'modifiee' as const, uid: 'u', platform: 'booking' as const, logementName: 'V', dateArrivee: '2026-10-01', dateDepart: '2026-10-03', avant: { dateArrivee: '2026-10-02', dateDepart: '2026-10-04' } }
    for (const k of ['nouvelle', 'modifiee', 'annulee'] as const) {
      const t = icalChangeText({ ...c, kind: k })
      expect(t.title + t.body).not.toMatch(/—|[\u{1F300}-\u{1FAFF}]/u)
    }
  })
})
