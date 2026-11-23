import { describe, it, expect } from 'vitest'
import { fusionnerSitemaps, parseSitemap, SITEMAPS } from './sitemap'

const xml = (...urls: string[]) => `<urlset>${urls.map(u => `<url><loc>${u}</loc><lastmod>2026-11-20</lastmod></url>`).join('')}</urlset>`

describe('sitemaps de l’indexation', () => {
  it('lit les adresses et leur date', () => {
    expect(parseSitemap(xml('https://jasonmarinho.com/a'), 'pros')).toEqual([{ url: 'https://jasonmarinho.com/a', lastmod: '2026-11-20', famille: 'pros' }])
  })

  it('réunit les sitemaps sans doublon et garde la famille', () => {
    const e = fusionnerSitemaps([
      { xml: xml('https://jasonmarinho.com/', 'https://jasonmarinho.com/annuaires/photographes'), famille: 'site' },
      { xml: xml('https://jasonmarinho.com/annuaires/photographes', 'https://jasonmarinho.com/annuaires/photographes/jean'), famille: 'pros' },
    ])
    expect(e.map(x => [x.url.replace('https://jasonmarinho.com', ''), x.famille])).toEqual([['/', 'site'], ['/annuaires/photographes', 'site'], ['/annuaires/photographes/jean', 'pros']])
  })

  it('suit les 5 sitemaps de robots.txt', () => {
    expect(SITEMAPS.map(s => s.file)).toEqual(['sitemap.xml', 'sitemap-photographes.xml', 'sitemap-menages.xml', 'sitemap-depannage.xml', 'sitemap-signalements.xml'])
  })
})
