#!/usr/bin/env node
// Données structurées « Course » des pages publiques /services/formations/<slug>
// (24/11/2026, Jason : « fais en sorte que les prochains cours aient déjà tous
// les bons paramètres »). Avant : 2 pages sur 22 avaient un Course minimal.
// Le bloc est tiré du contenu de l'app (jason-app/app/dashboard/formations/
// <slug>/content.ts) : titre, description, durée, niveau, objectifs, nombre
// de modules et de leçons. Lancé au build (scripts/build-site.sh) et contrôlé
// en CI (--check) : une nouvelle formation reçoit son bloc sans rien faire.
// Offre « Partially Free » : le compte gratuit donne accès à une partie des
// formations (places Découverte, FormationsGrid.tsx), le reste avec l'abonnement.
// Marqueurs COURSE ; les anciens blocs Course écrits à la main sont remplacés.
//   node scripts/inject-course-formations.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const APP = path.join(ROOT, 'jason-app/app/dashboard/formations')
const SITE = 'https://jasonmarinho.com'

const chaine = (src, cle) => {
  const m = src.match(new RegExp(`\\n\\s*${cle}:\\s*(['\`"])((?:\\\\.|(?!\\1)[\\s\\S])*?)\\1`))
  return m ? m[2].replace(/\\(['`"])/g, '$1').replace(/\s+/g, ' ').trim() : null
}

/** Durée « 2h30 », « 45 min » → ISO 8601 « PT2H30M » */
export function dureeIso(d) {
  if (!d) return null
  const h = d.match(/(\d+)\s*h/i)?.[1], m = d.match(/h\s*(\d+)|(\d+)\s*min/i)
  const min = m ? (m[1] || m[2]) : null
  if (!h && !min) return null
  return `PT${h ? `${+h}H` : ''}${min && +min ? `${+min}M` : ''}`
}

export function lireFormation(src) {
  const titre = chaine(src, 'title')
  const description = chaine(src, 'description')
  const duree = chaine(src, 'duration')
  const niveau = chaine(src, 'level')
  const obj = src.match(/objectifs:\s*\[([\s\S]*?)\n\s*\],/)?.[1] ?? ''
  const objectifs = [...obj.matchAll(/(['`"])((?:\\.|(?!\1)[^\n])*)\1/g)].map(m => m[2].replace(/\\(['`"])/g, '$1').trim()).filter(Boolean)
  const modulesBloc = src.slice(src.indexOf('modules:'))
  const lecons = (modulesBloc.match(/\bcontent:\s*`/g) || []).length
  const modules = (modulesBloc.match(/\n\s*lessons:\s*\[/g) || []).length
  return { titre, description, duree, niveau, objectifs, lecons, modules }
}

export function courseJsonLd(slug, f) {
  const url = `${SITE}/services/formations/${slug}`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: f.titre,
    description: f.description,
    url,
    inLanguage: 'fr',
    provider: { '@type': 'Organization', name: 'Jason Marinho', sameAs: SITE },
    ...(f.niveau ? { educationalLevel: f.niveau } : {}),
    ...(f.objectifs.length ? { teaches: f.objectifs } : {}),
    ...(f.lecons ? { numberOfLessons: f.lecons } : {}),
    offers: { '@type': 'Offer', category: 'Partially Free', url },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      ...(dureeIso(f.duree) ? { courseWorkload: dureeIso(f.duree) } : {}),
    },
  }
  return `<!-- COURSE:START -->\n<script type="application/ld+json">${JSON.stringify(data)}</script>\n<!-- COURSE:END -->`
}

let ecrites = 0
const ecarts = [], manques = []
for (const slug of fs.readdirSync(path.join(ROOT, 'services/formations')).sort()) {
  const page = path.join(ROOT, 'services/formations', slug, 'index.html')
  const src = path.join(APP, slug, 'content.ts')
  if (!fs.existsSync(page)) continue
  if (!fs.existsSync(src)) { manques.push(slug); continue }
  const f = lireFormation(fs.readFileSync(src, 'utf8'))
  if (!f.titre || !f.description) { manques.push(slug); continue }
  let html = fs.readFileSync(page, 'utf8')
  const avant = html
  html = html.replace(/\n?<!-- COURSE:START -->[\s\S]*?<!-- COURSE:END -->/, '')
  // anciens blocs Course écrits à la main
  html = html.replace(/\n?\s*<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/g, (all, json) => {
    try { return JSON.parse(json)['@type'] === 'Course' ? '' : all } catch { return all }
  })
  html = html.replace('</head>', `${courseJsonLd(slug, f)}\n</head>`)
  if (html === avant) continue
  if (CHECK) { ecarts.push(slug); continue }
  fs.writeFileSync(page, html)
  ecrites++
}
// Paramètres SEO de chaque page publique de formation (contrôlés aussi en --check)
const defauts = []
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')
for (const slug of fs.readdirSync(path.join(ROOT, 'services/formations')).sort()) {
  const page = path.join(ROOT, 'services/formations', slug, 'index.html')
  if (!fs.existsSync(page) || !fs.existsSync(path.join(APP, slug, 'content.ts'))) continue
  const h = fs.readFileSync(page, 'utf8')
  const dec = t => t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  const titre = dec(h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
  const desc = dec(h.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
  const url = `${SITE}/services/formations/${slug}`
  if (!titre || titre.length > 60) defauts.push(`${slug} : titre de ${titre.length} caractères (60 au plus)`)
  if (!desc || desc.length > 155) defauts.push(`${slug} : description de ${desc.length} caractères (155 au plus)`)
  if (!h.includes(`<link rel="canonical" href="${url}"`)) defauts.push(`${slug} : adresse canonique absente ou différente`)
  if (!sitemap.includes(`<loc>${url}</loc>`)) defauts.push(`${slug} : absente de sitemap.xml`)
}
if (defauts.length) { console.error(`Pages de formation à corriger :\n- ${defauts.join('\n- ')}`); if (CHECK) process.exit(1) }
if (manques.length) console.log(`Sans contenu dans l'app (ignorées) : ${manques.join(', ')}`)
if (CHECK) {
  if (ecarts.length) { console.error(`Données Course à mettre à jour : ${ecarts.join(', ')} (node scripts/inject-course-formations.mjs)`); process.exit(1) }
  console.log('Données Course des formations : à jour')
} else console.log(`Données Course des formations : ${ecrites} pages écrites`)
