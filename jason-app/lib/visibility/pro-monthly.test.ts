import { describe, it, expect } from 'vitest'
import { buildMonthlyRecapEmail, buildProMonthlyEmail, deMonth, isLastCatchupDay, isMonthlySendDay, isPaidActive, monthPeriod, previousMonth, shouldSendMonthly, type MonthlyInput } from './pro-monthly'

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
  it('du 1er au 7 (rattrapage), dernier jour signalé', () => {
    expect(isMonthlySendDay('2026-11-01')).toBe(true)
    expect(isMonthlySendDay('2026-11-07')).toBe(true)
    expect(isMonthlySendDay('2026-11-08')).toBe(false)
    expect(isMonthlySendDay('2026-11-20')).toBe(false)
    expect(isLastCatchupDay('2026-11-07')).toBe(true)
    expect(isLastCatchupDay('2026-11-06')).toBe(false)
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
    // Bouton compté (clics anonymes) puis redirigé vers la page
    expect(e.html).toContain(encodeURIComponent(base.statsUrl))
    expect(e.html).toContain('/api/e/c?c=bilan-pro&amp;b=voir-mes-statistiques')
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

describe('bilan mensuel du dépannage (31/10/2026)', () => {
  it('nomme la bonne fiche', () => {
    const m = buildProMonthlyEmail({ ...base, metier: 'depannage' })
    expect(m.html).toContain('ta fiche dépannage')
    expect(m.html).not.toContain('équipe de ménage')
  })
})

describe('bilan mensuel : évolution, signature et récap', () => {
  it('évolutions affichées, signature de Jason avec sa photo', () => {
    const e = buildProMonthlyEmail({ ...base, pct: { visitors: 25, views: -10, demandes: null, google: 0 }, clicks: 4, city: { label: 'Photographes à Lyon', visitors: 80, toFiche: 12 } })
    expect(e.html).toContain('+25 %')
    expect(e.html).toContain('-10 %')
    expect(e.html).toContain('comparent avec le mois d’août')
    expect(e.html).toContain('Clics vers tes liens')
    expect(e.html).toContain('dont 12 qui sont passés sur ta fiche')
    expect(e.html).toContain('signature-jason.jpg')
    expect(e.html).toContain('Ton bilan')
  })
  it('pas de pourcentage sans comparaison', () => {
    expect(buildProMonthlyEmail(base).html).not.toContain('comparent avec')
  })
  it('récap pour Jason : envoyés, totaux, meilleures fiches, retard', () => {
    const r = buildMonthlyRecapEmail({
      month: previousMonth('2026-12-01'), served: 3, total: 4, failed: 1, lastDay: true, adminUrl: 'https://app.jasonmarinho.com/dashboard/admin/qg',
      lines: [
        { nom: 'Clara Photo', metier: 'photographe', visitors: 120, demandes: 2, sent: true },
        { nom: 'Net & Clean', metier: 'menage', visitors: 0, demandes: 0, sent: true },
        { nom: 'Fix Pro', metier: 'depannage', visitors: 30, demandes: 0, sent: false },
      ],
    })
    expect(r.subject).toBe('Bilans des pros de novembre 2026 : 3/4 envoyés, 2 demandes')
    expect(r.html).toContain('Clara Photo')
    expect(r.html).toContain('150')
    expect(r.html).toContain('1 envoi a échoué')
    expect(r.html).toContain('Dernier jour du rattrapage')
    expect(r.html).toContain('&amp; Clean')
    expect(r.html + r.subject).not.toMatch(/\u2014/)
  })
})
