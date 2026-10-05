import { describe, it, expect } from 'vitest'
import {
  netOfSubscription, netAnnual, missingFor, memberGroup, firstName, wakeUpMailto,
  weekStart, weeklyCounts, pipelineCounts, sortForOutreach, type MemberActivity,
  memberMailTarget, memberMailFooter, wakeUpMessage,
} from './sales'
import { memberUnsubToken, verifyMemberUnsubToken } from './member-unsub'

const base: MemberActivity = {
  id: 'u1', fullName: 'marie dupont', email: 'marie@example.com', plan: 'decouverte', role: 'user', driingStatus: null,
  createdAt: '2026-09-01T10:00:00Z', lastSignInAt: null, logements: 0, sejours: 0, contracts: 0, isPro: false,
}

describe('netOfSubscription', () => {
  it('retire Stripe puis environ 22 % de cotisations', () => {
    // 19,98 - (0,30 + 0,25) = 19,43 ; × 0,78 = 15,16
    expect(netOfSubscription(19.98)).toBeCloseTo(15.16, 2)
    expect(netOfSubscription(79.98)).toBeCloseTo(61.24, 1)
  })
  it('somme par lignes', () => {
    expect(netAnnual([{ price: 19.98, count: 2 }])).toBeCloseTo(30.32, 1)
  })
})

describe('missingFor', () => {
  it('donne le nombre d\'abonnements manquants par sorte', () => {
    const m = missingFor(310, 0)
    expect(m.pct).toBe(0)
    expect(m.standard).toBe(Math.ceil(310 / netOfSubscription(19.98)))
    expect(m.proFondateur).toBe(Math.ceil(310 / netOfSubscription(39.98)))
    expect(m.proStandard).toBe(6)
  })
  it('objectif atteint : plus rien à trouver', () => {
    expect(missingFor(310, 400)).toMatchObject({ left: 0, pct: 100, standard: 0 })
  })
})

describe('memberGroup', () => {
  it('classe les comptes', () => {
    expect(memberGroup(base)).toBe('inactif')
    expect(memberGroup({ ...base, logements: 1 })).toBe('actif')
    expect(memberGroup({ ...base, plan: 'standard' })).toBe('payant')
    expect(memberGroup({ ...base, driingStatus: 'confirmed' })).toBe('driing')
    expect(memberGroup({ ...base, role: 'admin' })).toBe('admin')
    expect(memberGroup({ ...base, isPro: true })).toBe('pro')
    expect(memberGroup({ ...base, driingStatus: 'pending', logements: 1 })).toBe('driing_attente')
  })
})

describe('e-mails de relance', () => {
  it('prénom capitalisé, sinon « Bonjour, »', () => {
    expect(firstName('marie dupont')).toBe('Marie')
    expect(firstName(null)).toBe('')
  })
  it('mailto encodé, sans tiret cadratin', () => {
    const inactive = wakeUpMailto(base, 'inactif')!
    expect(inactive.startsWith('mailto:marie%40example.com?subject=')).toBe(true)
    expect(decodeURIComponent(inactive)).toContain('Bonjour Marie,')
    expect(decodeURIComponent(inactive)).not.toContain('—')
    expect(decodeURIComponent(wakeUpMailto(base, 'actif')!)).toContain('19,98 €')
    expect(wakeUpMailto({ ...base, email: null }, 'actif')).toBeNull()
  })
  it('les plus récents d\'abord', () => {
    const list = sortForOutreach([
      { ...base, id: 'a', createdAt: '2026-08-01T00:00:00Z' },
      { ...base, id: 'b', createdAt: '2026-09-20T00:00:00Z' },
      { ...base, id: 'c', createdAt: '2026-07-01T00:00:00Z', lastSignInAt: '2026-10-01T00:00:00Z' },
    ])
    expect(list.map(x => x.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('semaines', () => {
  it('lundi de la semaine', () => {
    expect(weekStart('2026-10-05')).toBe('2026-10-05') // lundi
    expect(weekStart('2026-10-11')).toBe('2026-10-05') // dimanche
  })
  it('compte les inscriptions des 8 dernières semaines', () => {
    const w = weeklyCounts(['2026-10-05T08:00:00Z', '2026-10-06T08:00:00Z', '2026-09-29T08:00:00Z', '2026-01-01T00:00:00Z'], '2026-10-07')
    expect(w).toHaveLength(8)
    expect(w[7]).toEqual({ week: '2026-10-05', count: 2 })
    expect(w[6]).toEqual({ week: '2026-09-28', count: 1 })
  })
})

describe('pipelineCounts', () => {
  it('par étape et par audience', () => {
    const c = pipelineCounts([
      { stage: 'contacte', audience: 'photographe' },
      { stage: 'contacte', audience: 'photographe' },
      { stage: 'interesse', audience: 'menage' },
    ], 'photographe')
    expect(c.find(x => x.key === 'contacte')!.count).toBe(2)
    expect(c.find(x => x.key === 'interesse')!.count).toBe(0)
  })
})

describe('e-mail aux membres gratuits', () => {
  const opts = { alreadySent: false, suppressed: false }
  it('jamais aux comptes Driing, confirmés ou en attente', () => {
    expect(memberMailTarget({ ...base, driingStatus: 'pending' }, opts)).toEqual({ excluded: 'driing_attente' })
    expect(memberMailTarget({ ...base, driingStatus: 'pending', logements: 2 }, opts)).toEqual({ excluded: 'driing_attente' })
    expect(memberMailTarget({ ...base, driingStatus: 'confirmed' }, opts)).toEqual({ excluded: 'driing' })
    expect(memberMailTarget({ ...base, plan: 'driing' }, opts)).toEqual({ excluded: 'driing' })
  })
  it('ni aux payants, à l\'admin, aux pros, aux désinscrits ni deux fois', () => {
    expect(memberMailTarget({ ...base, plan: 'standard' }, opts)).toEqual({ excluded: 'payant' })
    expect(memberMailTarget({ ...base, role: 'admin' }, opts)).toEqual({ excluded: 'admin' })
    expect(memberMailTarget({ ...base, isPro: true }, opts)).toEqual({ excluded: 'pro' })
    expect(memberMailTarget(base, { alreadySent: false, suppressed: true })).toEqual({ excluded: 'desinscrit' })
    expect(memberMailTarget(base, { alreadySent: true, suppressed: false })).toEqual({ excluded: 'deja_envoye' })
    expect(memberMailTarget({ ...base, email: null }, opts)).toEqual({ excluded: 'sans_email' })
  })
  it('le bon message selon l\'activité', () => {
    expect(memberMailTarget(base, opts)).toEqual({ kind: 'inactif' })
    expect(memberMailTarget({ ...base, logements: 1 }, opts)).toEqual({ kind: 'actif' })
    expect(wakeUpMessage(base, 'inactif').body).not.toMatch(/inscrit\b/)
  })
  it('pied avec la raison et la désinscription', () => {
    const f = memberMailFooter('https://app.jasonmarinho.com/desinscription/membre/x')
    expect(f).toContain('tu as un compte')
    expect(f).toContain('/desinscription/membre/x')
    expect(f).not.toContain('—')
  })
})

describe('jeton de désinscription', () => {
  const id = '3f2b7c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f'
  it('aller-retour, et refus si modifié ou mauvais secret', () => {
    const t = memberUnsubToken(id, 's3cret')
    expect(verifyMemberUnsubToken(t, 's3cret')).toBe(id)
    expect(verifyMemberUnsubToken(t, 'autre')).toBeNull()
    expect(verifyMemberUnsubToken(t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A'), 's3cret')).toBeNull()
    expect(verifyMemberUnsubToken('pas-un-id.abc', 's3cret')).toBeNull()
    expect(verifyMemberUnsubToken(t, '')).toBeNull()
  })
})
