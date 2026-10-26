import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Une nouvelle formation doit être visible partout (26/10/2026, Jason : « dès
// qu'il y a une nouvelle formation, il faut une page, la mettre dans Services
// et Formations, et que tous les chiffres soient connectés »). Les compteurs
// (« 22 formations ») sont réécrits par scripts/sync-counts.mjs à chaque build.
const ROOT = join(__dirname, '..', '..', '..')
const DIR = join(ROOT, 'jason-app/app/dashboard/formations')
const EXCLUDE = new Set(['parcours', 'favoris', 'profil-apprenant'])
const slugs = readdirSync(DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !EXCLUDE.has(d.name) && existsSync(join(DIR, d.name, 'content.ts')))
  .map(d => d.name)
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('chaque formation est branchée partout', () => {
  const catalogue = read('services/formations/index.html')
  const sitemap = read('sitemap.xml')
  const order = read('jason-app/app/dashboard/formations/page.tsx')
  const grid = read('jason-app/app/dashboard/formations/FormationsGrid.tsx')
  const admin = read('jason-app/app/dashboard/admin/formations/[slug]/contentMap.ts')
  it.each(slugs)('%s', slug => {
    expect(existsSync(join(ROOT, 'services/formations', slug, 'index.html')), 'page de présentation').toBe(true)
    expect(catalogue, 'carte du catalogue /services/formations').toContain(`/services/formations/${slug}"`)
    expect(sitemap, 'sitemap.xml').toContain(`/services/formations/${slug}<`)
    expect(order, 'ordre du catalogue de l’app').toContain(`'${slug}'`)
    expect(grid, 'catégorie dans FormationsGrid').toContain(`'${slug}':`)
    expect(admin, 'éditeur admin').toContain(`'${slug}':`)
  })
  it('les compteurs suivent le nombre de formations', () => {
    expect(read('jason-app/lib/constants/auto-counts.ts')).toContain(`FORMATIONS_TOTAL = ${slugs.length}`)
    expect(read('services/formations/index.html')).toContain(`${slugs.length} formations`)
  })
  it('les filtres du catalogue du site suivent les cartes', () => {
    const html = read('services/formations/index.html')
    const cards = [...html.matchAll(/<div class="f-card" data-cat="([a-z-]+)"/g)].map(m => m[1])
    expect(cards.length).toBe(slugs.length)
    for (const m of html.matchAll(/data-filter="([a-z-]+)"[^>]*>[\s\S]*?<span class="f-cat-btn-count">(\d+)</g)) {
      const n = m[1] === 'all' ? cards.length : cards.filter(c => c === m[1]).length
      expect(Number(m[2]), `filtre ${m[1]}`).toBe(n)
    }
    // Pas de badge « Nouveauté » écrit en dur : il est posé d'après data-depuis
    expect(html).not.toMatch(/class="f-bge"[^>]*>Nouveauté</)
  })
})
