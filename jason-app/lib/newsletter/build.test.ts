import { describe, it, expect } from 'vitest'
import { isPreparationDay, sendAt, parseRss, buildNewsletter, monthLabel, withUtm, pickFigure } from './build'

const actu = (i: number, o: Record<string, unknown> = {}) => ({ id: `a${i}`, title: `Titre ${i}`, summary: `Résumé ${i}. Deuxième phrase avec 10 000 €.`, category: 'fiscalite', source_url: null, published_at: '2026-10-05T08:00:00Z', ...o })

describe('newsletter', () => {
  it('calendrier : premier lundi du mois, envoi le lendemain 9 h 30 à Paris', () => {
    expect(isPreparationDay('2026-11-02')).toBe(true)
    expect(isPreparationDay('2026-11-09')).toBe(false)
    expect(isPreparationDay('2026-11-03')).toBe(false)
    expect(sendAt('2026-11-02')).toBe('2026-11-03T08:30:00.000Z')
    expect(sendAt('2026-07-06')).toBe('2026-07-07T07:30:00.000Z')
    expect(monthLabel('2026-11-02')).toBe('novembre 2026')
  })

  it('lit le flux RSS du blog', () => {
    const xml = `<rss><channel><item><title>Noël en LCD : 7 actions d&apos;octobre</title><link>https://jasonmarinho.com/blog/noel</link><pubDate>Fri, 02 Oct 2026 08:00:00 GMT</pubDate><description>Tarifs &amp; séjours</description></item><item><title>X</title><link>https://evil.com/x</link></item></channel></rss>`
    expect(parseRss(xml)).toEqual([{ title: "Noël en LCD : 7 actions d'octobre", link: 'https://jasonmarinho.com/blog/noel', description: 'Tarifs & séjours', pubDate: 'Fri, 02 Oct 2026 08:00:00 GMT' }])
  })

  it('compose une lettre propre, ou rien s\'il manque de matière', () => {
    expect(buildNewsletter({ parisDate: '2026-11-02', actus: [actu(1)], articles: [], changes: [] })).toBeNull()
    const n = buildNewsletter({
      parisDate: '2026-11-02',
      actus: [actu(1, { source_url: 'https://www.service-public.fr/x' }), actu(2), actu(3, { title: '<script>' })],
      articles: [{ title: 'Guide', link: 'https://jasonmarinho.com/blog/guide', description: 'Desc', pubDate: '' }],
      changes: [{ title: 'Nouveau', description: 'Une chose. Puis une autre.', date: '2026-10-20' }],
    })!
    expect(n.subject).toBe('Titre 1')
    expect(n.counts).toEqual({ actus: 3, articles: 1, changes: 1 })
    expect(n.html).toContain('{{ unsubscribe }}')
    expect(n.html).toContain('{{ mirror }}')
    expect(n.html).toContain('https://jasonmarinho.com/blog/guide?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=lettre-2026-11')
    expect(n.html).toContain('https://www.service-public.fr/x')
    expect(n.html).not.toContain('<script>')
    expect(n.html).toContain('10 000 €')
    expect(n.html).not.toMatch(/—/)
  })

  it('utm seulement sur nos domaines', () => {
    expect(withUtm('https://legifrance.gouv.fr/a', 'c')).toBe('https://legifrance.gouv.fr/a')
    expect(withUtm('https://app.jasonmarinho.com/dashboard', 'c')).toContain('utm_campaign=c')
  })
  it('chiffre du mois : une phrase avec un nombre et son unité, pas une année', () => {
    const a = (title: string, summary: string) => ({ id: title, title, summary, category: null, source_url: null, published_at: null })
    expect(pickFigure([a('Une', 'Rien ici en 2026.'), a('Deux', 'Intro. L\'amende peut atteindre 10 000 euros. Fin.')]))
      .toEqual({ value: '10\u00a0000\u00a0€', caption: 'L\'amende peut atteindre 10\u00a0000 euros.' })
    expect(pickFigure([a('Airbnb passe à 15,5 %', 'Sans chiffre.')])).toEqual({ value: '15,5\u00a0%', caption: 'Airbnb passe à 15,5\u00a0%' })
    expect(pickFigure([a('Bilan 2026', 'Le 1er janvier 2027.')])).toBeNull()
  })

  it('rubriques fixes et liens vers nos pages', () => {
    const n = buildNewsletter({
      parisDate: '2026-11-02', issueNumber: 4,
      actus: [
        { id: 'a', title: 'Une', summary: 'Résumé.', category: 'reglementation', source_url: 'https://jasonmarinho.com/blog/x', published_at: null, deadline_date: '2026-12-01' },
        { id: 'b', title: 'Deux', summary: 'Résumé deux.', category: 'fiscalite', source_url: 'https://www.impots.gouv.fr/y', published_at: null },
      ],
      articles: [{ title: 'Guide', link: 'https://jasonmarinho.com/blog/guide', description: 'Desc', pubDate: '', category: 'Revenus' }],
      changes: [],
    })!
    expect(n.html).toContain('N°&nbsp;4')
    expect(n.html).toContain('Lire la suite')
    expect(n.html).toContain('Source : impots.gouv.fr')
    expect(n.html).toContain('1 déc.')
    expect(n.html).toContain('L\'outil du mois')
    expect(n.html).toContain('Le bon plan partenaire')
    expect(n.html).toContain('La question du mois')
    expect(n.html).toContain('je touche une commission')
    expect(Buffer.byteLength(n.html)).toBeLessThan(100_000)
  })
})
