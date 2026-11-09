import { describe, it, expect } from 'vitest'
import { VILLES_GEO, REGIONS_GEO, DEPARTEMENTS_GEO, PAYS_GEO } from './registre'
import { CITY_PAGE_SLUGS, INTL_CITY_PAGES, cityLabel } from '@/lib/visibility/city-page'

// Registre géographique unique (09/11/2026) : la copie générée pour l'app doit
// dire la même chose que les listes que l'app utilise déjà.
describe('registre géographique', () => {
  it('connaît exactement les villes françaises à pages pros de l’app', () => {
    const fr = VILLES_GEO.filter(v => v.pays === 'FR' && v.pages.photographe).map(v => v.slug).sort()
    expect(fr).toEqual([...CITY_PAGE_SLUGS].sort())
  })

  it('range chaque ville française dans un département et une région connus', () => {
    for (const v of VILLES_GEO.filter(x => x.pays === 'FR')) {
      expect(v.departement, v.slug).toBeTruthy()
      expect(DEPARTEMENTS_GEO[v.departement!]?.region, v.slug).toBe(v.region)
      expect(REGIONS_GEO[v.region!], v.slug).toBeTruthy()
    }
    expect(Object.keys(REGIONS_GEO)).toHaveLength(13)
  })

  it('garde Québec hors de France, avec le même pays que l’app', () => {
    for (const [slug, intl] of Object.entries(INTL_CITY_PAGES)) {
      const v = VILLES_GEO.find(x => x.slug === slug)
      expect(v, slug).toBeDefined()
      expect(PAYS_GEO[v!.pays]).toBe(intl.pays)
      expect(v!.departement).toBeNull()
    }
  })

  it('affiche les mêmes noms de ville que l’app', () => {
    for (const s of CITY_PAGE_SLUGS) expect(VILLES_GEO.find(v => v.slug === s)?.nom).toBe(cityLabel(s))
  })
})
