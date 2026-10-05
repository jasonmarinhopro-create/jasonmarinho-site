import { describe, it, expect } from 'vitest'
import { buildProMonthlyEmail, deMonth, isMonthlySendDay, isPaidActive, monthPeriod, previousMonth, shouldSendMonthly, type MonthlyInput } from './pro-monthly'

const base: MonthlyInput = {
  metier: 'photographe',
  firstName: 'Clara',
  month: previousMonth('2026-10-01'),
  visitors: 137,
  views: 210,
  demandes: 3,
  googleImpressions: 668,
  best: { query: 'photographe airbnb lyon', place: 6 },
  advice: { title: 'Presque en première page', text: 'Tu es 12e sur « photographe gîte rhône ».' },
  statsUrl: 'https://app.jasonmarinho.com/dashboard/ma-fiche-photographe/statistiques',
  publicUrl: 'https://jasonmarinho.com/annuaires/photographes/clara-lyon',
}

describe('bilan mensuel : quand et à qui', () => {
  it('mois civil précédent, y compris en janvier', () => {
    expect(previousMonth('2026-10-01')).toEqual({ key: '2026-09', start: '2026-09-01', end: '2026-09-30', label: 'septembre 2026' })
    expect(previousMonth('2027-01-01')).toMatchObject({ key: '2026-12', end: '2026-12-31', label: 'décembre 2026' })
    expect(previousMonth('2028-03-01').end).toBe('2028-02-29')
  })
  it('seulement le 1er', () => {
    expect(isMonthlySendDay('2026-11-01')).toBe(true)
    expect(isMonthlySendDay('2026-11-02')).toBe(false)
  })
  it('fiches actives et payées', () => {
    expect(isPaidActive({ status: 'active', stripe_subscription_status: 'trialing' })).toBe(true)
    expect(isPaidActive({ status: 'active', stripe_subscription_status: 'canceled' })).toBe(false)
    expect(isPaidActive({ status: 'hidden', stripe_subscription_status: 'active' })).toBe(false)
  })
  it('jamais deux fois, jamais après désabonnement', () => {
    expect(shouldSendMonthly(null, '2026-09')).toBe(true)
    expect(shouldSendMonthly(['mail:bilan-2026-09'], '2026-09')).toBe(false)
    expect(shouldSendMonthly(['mail:bilan-2026-08'], '2026-09')).toBe(true)
    expect(shouldSendMonthly(['mail:bilan-off'], '2026-09')).toBe(false)
  })
  it('période du mois comparée au mois d\'avant', () => {
    expect(monthPeriod(previousMonth('2026-10-01'))).toMatchObject({ start: '2026-09-01', end: '2026-09-30', days: 30, prevStart: '2026-08-01', prevEnd: '2026-08-31', granularity: 'day' })
  })
})

describe('bilan mensuel : texte', () => {
  it('élision du mois', () => {
    expect(deMonth('septembre 2026')).toBe('de septembre 2026')
    expect(deMonth('octobre 2026')).toBe('d\'octobre 2026')
    expect(deMonth('août 2026')).toBe('d\'août 2026')
  })
  it('chiffres, meilleure recherche, conseil, lien et désabonnement', () => {
    const e = buildProMonthlyEmail(base)
    expect(e.subject).toBe('Ton mois de septembre 2026 sur Jason Marinho')
    expect(e.html).toContain('Bonjour Clara,')
    expect(e.html).toContain('137')
    expect(e.html).toContain('668 fois')
    expect(e.html).toContain('photographe airbnb lyon')
    expect(e.html).toContain('6e')
    expect(e.html).toContain('Le conseil du mois : Presque en première page.')
    expect(e.html).toContain(base.statsUrl)
    expect(e.html).toContain('Recevoir mon bilan chaque mois par e-mail')
    expect(e.html + e.subject + e.preview).not.toMatch(/\u2014/)
    expect(e.html).not.toMatch(/\p{Extended_Pictographic}/u)
  })
  it('Google indisponible : pas de chiffre inventé', () => {
    const e = buildProMonthlyEmail({ ...base, googleImpressions: null, best: null })
    expect(e.html).not.toContain('Vu sur Google')
    expect(e.html).not.toContain('meilleure recherche')
  })
  it('aucune visite : message encourageant avec le lien de la fiche', () => {
    const e = buildProMonthlyEmail({ ...base, visitors: 0, views: 0, demandes: 0, firstName: null })
    expect(e.html).toContain('Bonjour,')
    expect(e.html).toContain('pas encore reçu de visite')
    expect(e.html).toContain('jasonmarinho.com/annuaires/photographes/clara-lyon')
    expect(e.html).not.toContain('Visiteurs')
  })
  it('échappe le texte des recherches', () => {
    expect(buildProMonthlyEmail({ ...base, best: { query: '<b>x</b>', place: 2 } }).html).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})
