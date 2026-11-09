#!/usr/bin/env node
// Registre géographique : contrôle et copie pour l'app (étape 2 de la feuille
// de route « géographie, pied de page et fil d'Ariane », 09/11/2026).
//
//   node scripts/build-registre-geo.mjs           → contrôle + écrit la copie de l'app
//   node scripts/build-registre-geo.mjs --check   → contrôle seulement, échoue si la
//                                                   copie de l'app n'est pas à jour
//
// Contrôles : chaque ville du registre a ses pages sur le disque ; le registre
// et les listes existantes (CITIES de footer.js, VILLES_INTERNATIONAL, études
// de revenus de /calculateurs, CITY_PAGE_SLUGS de l'app) disent la même chose.
// Tant que ces listes existent (étape 3 : elles seront lues dans le registre),
// ce contrôle empêche qu'elles divergent.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villesRegistre, regionsRegistre } from './lib/registre-geo.mjs'
import { PAYS, LES_4 } from './data/registre-geo.mjs'
import { VILLES_INTERNATIONAL } from './data/villes-international.mjs'
import { loadCities } from './verifier-villes.mjs'
import { normNom } from './lib/secteur.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP_FILE = path.join(ROOT, 'jason-app', 'lib', 'geo', 'registre.ts')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const pageExists = url => fs.existsSync(path.join(ROOT, url.slice(1), 'index.html'))

export function checkRegistre() {
  const villes = villesRegistre()
  const problems = []
  const bySlug = new Map(villes.map(v => [v.slug, v]))

  // 1. Toutes les pages annoncées existent
  for (const v of villes) {
    for (const [kind, url] of Object.entries(v.pages)) {
      if (!pageExists(url)) problems.push(`${v.slug} : page ${kind} absente (${url})`)
    }
  }

  // 1 bis. Le code INSEE désigne bien la ville : le nom IGN (sans article,
  // parfois plus long : « Chamonix-Mont-Blanc », « Baule-Escoublac ») commence
  // par le nom du registre sans son article
  const norm = s => normNom(s).replace(/^(la|le|les|l) /, '')
  for (const v of villes.filter(x => x.pays === 'FR')) {
    if (!norm(v.communeIgn).startsWith(norm(v.nom).split(' ')[0])) problems.push(`${v.slug} : le code ${v.insee} est « ${v.communeIgn} » pour l'IGN, pas « ${v.nom} »`)
  }

  // 2. CITIES (footer.js) = villes françaises à 4 pages, mêmes noms
  const cities = loadCities()
  const reseau = villes.filter(v => LES_4.every(k => v.pages[k]))
  for (const c of cities) {
    const v = bySlug.get(c.slug)
    if (!v) { problems.push(`${c.slug} : dans CITIES (footer.js) mais pas dans le registre`); continue }
    if (!LES_4.every(k => v.pages[k])) problems.push(`${c.slug} : dans CITIES mais sans ses 4 pages dans le registre`)
    if (v.nom !== c.name) problems.push(`${c.slug} : nom « ${v.nom} » dans le registre, « ${c.name} » dans CITIES`)
  }
  for (const v of reseau) if (!cities.some(c => c.slug === v.slug)) problems.push(`${v.slug} : 4 pages dans le registre mais absente de CITIES`)

  // 3. Villes hors de France à pages (Québec)
  for (const [slug, intl] of Object.entries(VILLES_INTERNATIONAL)) {
    const v = bySlug.get(slug)
    if (!v) { problems.push(`${slug} : dans VILLES_INTERNATIONAL mais pas dans le registre`); continue }
    const kinds = intl.pages.map(p => ({ 'photographe-lcd': 'photographe', 'menage-lcd': 'menage', 'depannage-lcd': 'depannage', 'devenir-hote-airbnb': 'hote' })[p])
    const reg = Object.keys(v.pages).filter(k => k !== 'revenus')
    if (kinds.sort().join() !== reg.sort().join()) problems.push(`${slug} : pages ${reg.join(', ')} dans le registre, ${kinds.join(', ')} dans VILLES_INTERNATIONAL`)
    if (PAYS[v.pays] !== intl.pays) problems.push(`${slug} : pays ${v.paysNom} dans le registre, ${intl.pays} dans VILLES_INTERNATIONAL`)
  }

  // 4. Toutes les études de revenus de /calculateurs sont rattachées à une ville
  const etudes = fs.readdirSync(path.join(ROOT, 'calculateurs')).filter(d => /^revenus?-(lcd|airbnb)-/.test(d) && pageExists(`/calculateurs/${d}`))
  const rattachees = new Set(villes.map(v => v.pages.revenus).filter(Boolean).map(u => u.split('/').pop()))
  for (const d of etudes) if (!rattachees.has(d)) problems.push(`/calculateurs/${d} : étude de revenus sans ville dans le registre`)

  // 5. L'app connaît les mêmes villes à pages pros
  const appSlugs = [...read('jason-app/lib/visibility/city-page.ts').split('] as const')[0].matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1])
  const fr = villes.filter(v => v.pays === 'FR' && v.pages.photographe).map(v => v.slug)
  for (const s of fr) if (!appSlugs.includes(s)) problems.push(`${s} : absente de CITY_PAGE_SLUGS (app)`)
  for (const s of appSlugs) if (!fr.includes(s)) problems.push(`${s} : dans CITY_PAGE_SLUGS (app) mais pas ville française à pages dans le registre`)

  return { villes, problems }
}

/** Copie TypeScript du registre pour l'app (données seulement) */
export function appSource(villes = villesRegistre()) {
  const rows = villes.map(v => ({
    slug: v.slug, nom: v.nom, pays: v.pays,
    departement: v.departement?.code ?? null,
    region: v.region?.code ?? null,
    province: v.province,
    pages: v.pages,
  }))
  const deps = {}
  for (const v of villes) if (v.departement) deps[v.departement.code] = { nom: v.departement.nom, region: v.region.code }
  const regions = Object.fromEntries(regionsRegistre().map(r => [r.code, r.nom]))
  const j = x => JSON.stringify(x)
  return `// Fichier généré par scripts/build-registre-geo.mjs depuis scripts/data/registre-geo.mjs
// (registre géographique unique, 09/11/2026). Ne pas modifier à la main :
// changer le registre puis relancer le script. Test : registre.test.ts.

export type PaysCode = ${Object.keys(PAYS).map(k => `'${k}'`).join(' | ')}
export type PageKind = 'photographe' | 'menage' | 'depannage' | 'hote' | 'revenus'

export interface VilleGeo {
  slug: string
  nom: string
  pays: PaysCode
  /** Code du département (France) */
  departement: string | null
  /** Code INSEE de la région (France) */
  region: string | null
  /** Province ou région hors de France, quand elle compte (Québec) */
  province: string | null
  pages: Partial<Record<PageKind, string>>
}

export const PAYS_GEO: Record<PaysCode, string> = ${j(PAYS)}

/** Régions françaises qui ont au moins une ville sur le site (code INSEE → nom) */
export const REGIONS_GEO: Record<string, string> = ${j(regions)}

/** Départements qui ont au moins une ville sur le site (code → nom, région) */
export const DEPARTEMENTS_GEO: Record<string, { nom: string; region: string }> = ${j(deps)}

export const VILLES_GEO: VilleGeo[] = [
${rows.map(r => `  ${j(r)},`).join('\n')}
]
`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { villes, problems } = checkRegistre()
  const src = appSource(villes)
  const current = fs.existsSync(APP_FILE) ? fs.readFileSync(APP_FILE, 'utf8') : ''
  if (process.argv.includes('--check')) {
    if (current !== src) problems.push('jason-app/lib/geo/registre.ts pas à jour : lancer node scripts/build-registre-geo.mjs')
  } else if (current !== src) {
    fs.mkdirSync(path.dirname(APP_FILE), { recursive: true })
    fs.writeFileSync(APP_FILE, src)
    console.log('Copie de l\'app écrite : jason-app/lib/geo/registre.ts')
  }
  const fr = villes.filter(v => v.pays === 'FR')
  console.log(`Registre : ${villes.length} villes (${fr.length} en France, ${villes.length - fr.length} hors de France), ${regionsRegistre().length} régions, ${new Set(fr.map(v => v.departement.code)).size} départements`)
  if (problems.length) {
    for (const p of problems) console.log(`::error::${p}`)
    process.exit(1)
  }
  console.log('Registre cohérent avec les pages et les listes existantes.')
}
