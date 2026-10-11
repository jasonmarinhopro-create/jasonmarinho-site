import { describe, it, expect } from 'vitest'
import { isPreparationDay, sendAt, parseRss, buildNewsletter, monthLabel, withUtm } from './build'

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
})
