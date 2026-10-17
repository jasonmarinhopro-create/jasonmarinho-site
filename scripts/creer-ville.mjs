#!/usr/bin/env node
// Créer une ville, pour tout le monde (17/10/2026, décision de Jason : « quand
// on crée une nouvelle ville, on la crée pour tout le monde » : photographe,
// ménage ET devenir hôte, au même niveau).
//
// Avant de lancer (seule partie manuelle, faits vérifiés par recherche web) :
//  1. footer.js, tableau CITIES : { slug, name, adr, occ, ann, desc } ;
//  2. scripts/data/villes-local.mjs : bloc de la ville (réglementation, taxe,
//     saisons, conseils ménage et photo, sources) avec `marche` (source et mois
//     des chiffres adr / occ / ann).
// Puis : node scripts/creer-ville.mjs <slug> "<commune officielle>"
// (la commune sert à la réserve de prospection OpenStreetMap, ex. « Sarlat-la-Canéda »).
//
// Le script, dans l'ordre :
//  - génère les pages photographe et ménage de la ville (build-pages-pros-villes,
//    pour cette ville seulement) et le guide hôte (build-guide-hote, sans écraser
//    un guide écrit à la main) ;
//  - relance toutes les injections (idempotentes) : contenu local, taxe de
//    séjour, estimation, liens entre les 3 pages, chiffres Google, demande
//    inversée ;
//  - ajoute la ville au sitemap, à l'app (CITY_PAGE_SLUGS, libellé), aux
//    libellés des fiches pros, à la réserve de prospection, et met à jour les
//    compteurs « N villes » ;
//  - régénère les pages Pour qui (compteur de villes) ;
//  - vérifie le tout (verifier-villes.mjs).
// Ensuite : lancer les tests de l'app, relire les 3 pages, pousser.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { VILLES_LOCAL } from './data/villes-local.mjs'
import { loadCities, checkVilles, PAGE_PREFIXES } from './verifier-villes.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [slug, communeArg] = process.argv.slice(2)
if (!slug) throw new Error('Usage : node scripts/creer-ville.mjs <slug> "<commune officielle>"')

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s)
const run = (...args) => execFileSync('node', args, { cwd: ROOT, stdio: 'inherit' })
const step = s => console.log(`\n── ${s}`)

// 0. Données préalables
const city = loadCities().find(c => c.slug === slug)
if (!city) throw new Error(`${slug} : ajoute d'abord la ville au tableau CITIES de footer.js`)
if (city.prosOnly) throw new Error(`${slug} : retire « prosOnly » dans footer.js (une ville = 3 pages)`)
const L = VILLES_LOCAL[slug]
if (!L) throw new Error(`${slug} : ajoute d'abord son bloc vérifié dans scripts/data/villes-local.mjs`)
if (!L.marche?.sources?.length) throw new Error(`${slug} : indique dans villes-local.mjs la source des chiffres du marché (marche.sources, marche.releve)`)
const commune = communeArg || city.name
const before = fs.readdirSync(ROOT).filter(d => d.startsWith('photographe-lcd-')).length

// 1. Pages
step('Pages photographe et ménage')
// Jamais de régénération d'une page existante (elles reçoivent des injections et des retouches en place)
if (['photographe-lcd', 'menage-lcd'].every(p => fs.existsSync(path.join(ROOT, `${p}-${slug}`, 'index.html')))) console.log('déjà présentes, gardées')
else run('scripts/build-pages-pros-villes.mjs', slug)
step('Guide devenir hôte')
run('scripts/build-guide-hote.mjs', slug)

// 2. Injections (toutes idempotentes, sur toutes les pages)
for (const s of ['inject-local-villes', 'inject-taxe-villes', 'inject-estimate-cta', 'inject-pros-links', 'inject-chiffres-ville', 'inject-demande-cta']) {
  step(s)
  run(`scripts/${s}.mjs`)
}

// 3. Sitemap
step('Sitemap')
let sitemap = read('sitemap.xml')
const today = new Date().toISOString().slice(0, 10)
for (const p of PAGE_PREFIXES) {
  const loc = `https://jasonmarinho.com/${p}-${slug}`
  if (sitemap.includes(`<loc>${loc}</loc>`)) continue
  sitemap = sitemap.replace('</urlset>', `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`)
  console.log(`+ ${loc}`)
}
write('sitemap.xml', sitemap)

// 4. App : liste des villes et libellé
step('App et fiches pros')
const simple = slug.charAt(0).toUpperCase() + slug.slice(1)
let cp = read('jason-app/lib/visibility/city-page.ts')
if (!cp.includes(`'${slug}'`)) {
  cp = cp.replace(/\n\] as const/, `\n  '${slug}',\n] as const`)
  if (city.name !== simple) cp = cp.replace(/(const special: Record<string, string> = \{\n)/, `$1    '${slug}': ${JSON.stringify(city.name)},\n`)
  write('jason-app/lib/visibility/city-page.ts', cp)
  console.log('+ CITY_PAGE_SLUGS')
}
if (city.name !== simple) {
  let iv = read('scripts/lib/inject-ville-pros.mjs')
  if (!iv.includes(`'${slug}':`)) {
    iv = iv.replace(/(const VILLE_LABELS = \{\n)/, `$1  '${slug}': ${JSON.stringify(city.name)},\n`)
    write('scripts/lib/inject-ville-pros.mjs', iv)
    console.log('+ VILLE_LABELS')
  }
}

// 5. Réserve de prospection
step('Réserve de prospection')
let wf = read('.github/workflows/prospection-reserve.yml')
const block = wf.match(/CITIES=\(([\s\S]*?)\)\n/)
if (block && !block[1].includes(`"${commune}"`)) {
  wf = wf.replace(block[0], `CITIES=(${block[1]} \\\n            "${commune}")\n`)
  write('.github/workflows/prospection-reserve.yml', wf)
  console.log(`+ ${commune}`)
}

// 6. Compteurs « N villes » écrits en dur
step('Compteurs')
const after = fs.readdirSync(ROOT).filter(d => d.startsWith('photographe-lcd-')).length
if (after !== before) {
  for (const f of ['devenir-photographe-lcd/index.html', 'devenir-prestataire-menage-lcd/index.html', 'llms.txt', 'jason-app/lib/acquisition/groupes.ts', '.github/workflows/prospection-reserve.yml']) {
    const s = read(f)
    const t = s.replace(new RegExp(`\\b${before} (villes|pages ville|pages de ville)`, 'g'), `${after} $1`).replace(new RegExp(`nos ${before} pages`, 'g'), `nos ${after} pages`)
    if (t !== s) { write(f, t); console.log(`~ ${f}`) }
  }
}
run('scripts/build-pour-qui-pros.mjs')

// 7. Vérification
step('Vérification')
const { count, problems } = checkVilles()
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
console.log(`\n${city.name} créée : 3 pages, ${count} villes en tout. Reste à lancer les tests de l'app (npx vitest run) et à relire les pages.`)
