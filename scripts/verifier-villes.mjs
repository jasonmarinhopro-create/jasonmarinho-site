#!/usr/bin/env node
// Contrôle des villes (17/10/2026, Jason : « à partir de maintenant, quand on
// crée une nouvelle ville, on la crée pour tout le monde »). Chaque ville de
// CITIES (footer.js) doit avoir ses 3 pages (photographe, ménage, devenir
// hôte), ses 3 adresses dans le sitemap, son contenu vérifié dans
// scripts/data/villes-local.mjs, sa place dans la liste de l'app
// (CITY_PAGE_SLUGS) et dans la réserve de prospection. Lancé par le workflow
// « Site statique » : échoue s'il manque quelque chose.
// Pour créer une ville : node scripts/creer-ville.mjs <slug> "<commune>".
//   node scripts/verifier-villes.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VILLES_LOCAL } from './data/villes-local.mjs'
import { VILLES_INTERNATIONAL } from './data/villes-international.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export const PAGE_PREFIXES = ['photographe-lcd', 'menage-lcd', 'devenir-hote-airbnb']

export function loadCities() {
  const src = read('footer.js')
  const open = src.indexOf('[', src.indexOf('var CITIES = ['))
  return new Function('return ' + src.slice(open, src.indexOf('];', open) + 1))()
}

export function checkVilles() {
  const cities = loadCities()
  const sitemap = read('sitemap.xml')
  const appSlugs = [...read('jason-app/lib/visibility/city-page.ts').matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1])
  const reserve = read('.github/workflows/prospection-reserve.yml')
  const reserveSlugs = [...(reserve.match(/CITIES=\(([\s\S]*?)\)\n/)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map(m => slugify(m[1]))
  const problems = []
  for (const c of cities) {
    const miss = []
    if (c.prosOnly) miss.push('marquée prosOnly (une ville = 3 pages)')
    for (const p of PAGE_PREFIXES) {
      if (!fs.existsSync(path.join(ROOT, `${p}-${c.slug}`, 'index.html'))) miss.push(`page ${p}-${c.slug}`)
      if (!sitemap.includes(`<loc>https://jasonmarinho.com/${p}-${c.slug}</loc>`)) miss.push(`sitemap ${p}-${c.slug}`)
    }
    if (!VILLES_LOCAL[c.slug]) miss.push('contenu vérifié (villes-local.mjs)')
    if (!appSlugs.includes(c.slug)) miss.push('CITY_PAGE_SLUGS (app)')
    if (!reserveSlugs.some(r => r === c.slug || r.startsWith(`${c.slug}-`) || c.slug.startsWith(r))) miss.push('réserve de prospection')
    if (miss.length) problems.push(`${c.slug} : ${miss.join(', ')}`)
  }
  // Pages sans ville déclarée (orphelines)
  for (const p of PAGE_PREFIXES) {
    for (const d of fs.readdirSync(ROOT).filter(x => x.startsWith(`${p}-`))) {
      const slug = d.slice(p.length + 1)
      if (VILLES_INTERNATIONAL[slug]?.pages.includes(p)) continue
      if (!cities.some(c => c.slug === slug)) problems.push(`${d} : ville absente de CITIES (footer.js)`)
    }
  }
  // Villes hors de France : leurs pages et leurs adresses du sitemap
  for (const [slug, v] of Object.entries(VILLES_INTERNATIONAL)) {
    for (const p of v.pages) {
      if (!fs.existsSync(path.join(ROOT, `${p}-${slug}`, 'index.html'))) problems.push(`${slug} (${v.pays}) : page ${p}-${slug}`)
      if (!sitemap.includes(`<loc>https://jasonmarinho.com/${p}-${slug}</loc>`)) problems.push(`${slug} (${v.pays}) : sitemap ${p}-${slug}`)
    }
  }
  return { count: cities.length, problems }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { count, problems } = checkVilles()
  if (problems.length) {
    console.error(`Villes : ${problems.length} problème(s) sur ${count} villes`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log(`Villes : ${count} villes, 3 pages chacune, tout est en ordre`)
}
