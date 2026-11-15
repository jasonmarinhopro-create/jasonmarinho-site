// Photos de couverture des articles du blog (15/11/2026, demande de Jason :
// « des photos dans les articles, automatisé avec Pexels, en faisant
// attention à la pertinence »). Lancé par le workflow « Couvertures blog »
// (l'environnement de Claude ne joint pas api.pexels.com).
//
//   node scripts/blog-covers.mjs chercher [slug,slug…|tout]
//       → propose une photo par article sans couverture (recherche de
//         data/blog-covers-queries.mjs), planches à regarder dans
//         .github/blog-covers/ (aucun changement sur le site)
//   node scripts/blog-covers.mjs variantes slug[=recherche];…
//       → 6 photos par article, pour remplacer une proposition refusée
//   node scripts/blog-covers.mjs prendre tout | slug,slug… | slug=id,…
//       → télécharge les photos retenues dans img/blog/ et les inscrit
//         dans data/blog-covers.json (alors seulement visibles sur le site)
//   node scripts/blog-covers.mjs auto
//       → articles publiés sans couverture : 1re photo pertinente, directement
//         (articles écrits par la routine ; recherche `photo` de l'article)
//   node scripts/blog-covers.mjs driing
//       → récupère les images de la page d'accueil de driing.co
//
// Photos Pexels : utilisation libre et gratuite, sans attribution obligatoire
// (https://www.pexels.com/license/) ; on cite quand même le photographe.
// API : 200 requêtes par heure, 20 000 par mois : une requête toutes les 19 s.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const OUT = '.github/blog-covers'
const IMG = 'img/blog'
const DATA = 'data/blog-covers.json'
const PROPOSALS = `${OUT}/propositions.json`
const KEY = process.env.PEXELS_API_KEY
const UA = 'jasonmarinho.com blog covers'
const wait = ms => new Promise(r => setTimeout(r, ms))

const [mode = '', arg = ''] = process.argv.slice(2)
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(IMG, { recursive: true })

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return d } }
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
const covers = readJson(DATA, {})
const { articles } = await import(pathToFileURL(path.join(ROOT, 'blog/articles-data.mjs')).href)
const { QUERIES, CATEGORY_QUERIES } = await import(pathToFileURL(path.join(ROOT, 'data/blog-covers-queries.mjs')).href)
const usedIds = new Set(Object.values(covers).map(c => String(c.id)))

let lastCall = 0
async function pexels(url) {
  if (!KEY) throw new Error('PEXELS_API_KEY manquante (secret GitHub)')
  for (let i = 0; i < 5; i++) {
    const gap = Date.now() - lastCall
    if (gap < 19000) await wait(19000 - gap)
    lastCall = Date.now()
    const r = await fetch(url, { headers: { Authorization: KEY, 'user-agent': UA } })
    if (r.status === 429 || r.status >= 500) { await wait(30000 * (i + 1)); continue }
    if (!r.ok) throw new Error(`Pexels ${r.status}`)
    return r.json()
  }
  throw new Error('Pexels indisponible')
}

async function download(url, file) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA } })
      if (r.ok) { fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); return true }
    } catch { /* réseau */ }
    await wait(3000 * (i + 1))
  }
  return false
}

// Recherche : champ `photo` de scripts/articles/<slug>.mjs (écrit par la
// routine Rédaction), sinon data/blog-covers-queries.mjs, sinon la catégorie
const articlePhoto = {}
for (const a of articles) {
  const f = path.join(ROOT, 'scripts/articles', `${a.slug}.mjs`)
  if (!fs.existsSync(f)) continue
  const m = fs.readFileSync(f, 'utf8').match(/^\s*photo:\s*(['"])(.+?)\1/m)
  if (m) articlePhoto[a.slug] = m[2]
}
function queryFor(a) {
  return articlePhoto[a.slug] || QUERIES[a.slug] || CATEGORY_QUERIES[a.categorySlug] || 'vacation rental interior'
}

/** Photos paysage, bien définies, pas déjà utilisées par un autre article */
async function search(q, n) {
  const u = `https://api.pexels.com/v1/search?${new URLSearchParams({ query: q, orientation: 'landscape', size: 'large', per_page: '15' })}`
  const d = await pexels(u)
  return (d.photos || [])
    .filter(p => p.width >= 1600 && p.width / p.height >= 1.3 && !usedIds.has(String(p.id)))
    .slice(0, n)
    .map(p => ({ id: p.id, w: p.width, h: p.height, photographer: p.photographer, photographer_url: p.photographer_url, alt: p.alt || '', page: p.url, src: p.src.original, thumb: p.src.medium }))
}

// Planche : vignettes numérotées avec le nom de l'article
function sheet(items, file, cols = 5) {
  const dir = `${OUT}/tmp`
  fs.mkdirSync(dir, { recursive: true })
  const args = []
  items.forEach((it, i) => { const f = `${dir}/${i}.jpg`; if (fs.existsSync(f)) args.push('-label', it.label, f) })
  if (!args.length) return
  execFileSync('montage', [...args, '-tile', `${cols}x`, '-geometry', '300x170+6+6', '-pointsize', '13', '-background', '#f4f1ea', file])
  fs.rmSync(dir, { recursive: true, force: true })
}

async function thumbs(items) {
  const dir = `${OUT}/tmp`
  fs.mkdirSync(dir, { recursive: true })
  for (let i = 0; i < items.length; i++) await download(items[i].thumb, `${dir}/${i}.jpg`)
}

// Couverture 1200 x 630 (format des aperçus Facebook, LinkedIn, Google Discover
// à 1200 px de large) et 600 x 315 pour les téléphones, en WebP léger
function toWebp(srcFile, slug) {
  for (const [w, h, q] of [[1200, 630, '68'], [600, 315, '66']]) {
    execFileSync('convert', [srcFile, '-auto-orient', '-resize', `${w}x${h}^`, '-gravity', 'center', '-extent', `${w}x${h}`, '-strip', '-quality', q, `${IMG}/${slug}${w === 600 ? '-600' : ''}.webp`])
  }
}

async function take(slug, p) {
  const tmp = `${OUT}/${slug}.src`
  if (!(await download(`${p.src}?auto=compress&cs=tinysrgb&w=1800`, tmp))) throw new Error(`téléchargement ${slug}`)
  toWebp(tmp, slug)
  fs.rmSync(tmp)
  covers[slug] = { source: 'pexels', id: p.id, photographer: p.photographer, photographer_url: p.photographer_url, page: p.page, alt: p.alt }
  usedIds.add(String(p.id))
}

const short = s => (s.length > 42 ? s.slice(0, 41) + '…' : s)
const pick = list => (list === 'tout' || !list) ? articles.filter(a => !covers[a.slug]) : articles.filter(a => list.split(',').map(s => s.trim()).includes(a.slug))

if (mode === 'chercher') {
  const props = readJson(PROPOSALS, {})
  const todo = pick(arg).filter(a => a.slug !== 'driing-plateforme-vacances-sans-commissions' && (arg !== 'tout' && arg !== '' || !props[a.slug]))
  let n = 0
  for (const a of todo) {
    const [p] = await search(queryFor(a), 1)
    if (p) { props[a.slug] = { ...p, query: queryFor(a) }; usedIds.add(String(p.id)) }
    else console.log(`Aucune photo : ${a.slug} (${queryFor(a)})`)
    if (++n % 20 === 0) { writeJson(PROPOSALS, props); console.log(`${n}/${todo.length}`) }
  }
  writeJson(PROPOSALS, props)
  // Planches de 30 (5 x 6), numérotées dans l'ordre de propositions.json
  const list = Object.entries(props).filter(([s]) => !covers[s])
  fs.readdirSync(OUT).filter(f => /^planche-\d+\.jpg$/.test(f)).forEach(f => fs.rmSync(`${OUT}/${f}`))
  for (let k = 0; k * 30 < list.length; k++) {
    const part = list.slice(k * 30, k * 30 + 30).map(([s, p], i) => ({ thumb: p.thumb, label: `${k * 30 + i + 1}. ${short(s)}` }))
    await thumbs(part)
    sheet(part, `${OUT}/planche-${String(k + 1).padStart(2, '0')}.jpg`)
  }
  writeJson(`${OUT}/index.json`, list.map(([s], i) => `${i + 1}. ${s}`))
  console.log(`${list.length} propositions, ${Math.ceil(list.length / 30)} planche(s)`)
} else if (mode === 'variantes') {
  const out = {}
  for (const part of arg.split(';').map(s => s.trim()).filter(Boolean)) {
    const [slug, q] = part.split('=')
    const a = articles.find(x => x.slug === slug.trim())
    if (!a) { console.log(`Article inconnu : ${slug}`); continue }
    const list = await search(q?.trim() || queryFor(a), 6)
    out[a.slug] = { query: q?.trim() || queryFor(a), photos: list }
    const items = list.map(p => ({ thumb: p.thumb, label: `${a.slug.slice(0, 24)} = ${p.id}` }))
    await thumbs(items)
    sheet(items, `${OUT}/variantes-${a.slug.slice(0, 40)}.jpg`, 3)
  }
  writeJson(`${OUT}/variantes.json`, { ...readJson(`${OUT}/variantes.json`, {}), ...out })
} else if (mode === 'prendre') {
  const props = readJson(PROPOSALS, {})
  const vars = readJson(`${OUT}/variantes.json`, {})
  const parts = arg === 'tout' ? Object.keys(props).filter(s => !covers[s]) : arg.split(',').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const [slug, id] = part.split('=')
    let p = props[slug]
    if (id) {
      p = vars[slug]?.photos?.find(x => String(x.id) === id)
      if (!p) {
        const d = await pexels(`https://api.pexels.com/v1/photos/${id}`)
        p = { id: d.id, photographer: d.photographer, photographer_url: d.photographer_url, alt: d.alt || '', page: d.url, src: d.src.original }
      }
    }
    if (!p) { console.log(`Rien à prendre pour ${slug}`); continue }
    await take(slug, p)
    delete props[slug]
  }
  writeJson(DATA, covers)
  writeJson(PROPOSALS, props)
  console.log(`${Object.keys(covers).length} couvertures`)
} else if (mode === 'auto') {
  // Articles des 30 derniers jours sans couverture (publiés par la routine)
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  for (const a of articles.filter(x => !covers[x.slug] && x.date >= since)) {
    const [p] = await search(queryFor(a), 1)
    if (p) { await take(a.slug, p); console.log(`Couverture ajoutée : ${a.slug}`) }
  }
  writeJson(DATA, covers)
} else if (mode === 'driing') {
  const r = await fetch('https://www.driing.co/', { headers: { 'user-agent': 'Mozilla/5.0' } })
  const html = await r.text()
  const urls = new Set()
  for (const m of html.matchAll(/(?:src|href|content|srcSet|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(' ')[0].replace(/&amp;/g, '&')
      if (/\.(jpe?g|png|webp|avif)(\?|$)|\/_next\/image\?url=/i.test(u)) urls.add(new URL(u, 'https://www.driing.co/').href)
    }
  }
  for (const m of html.matchAll(/url\(([^)]+)\)/g)) urls.add(new URL(m[1].replace(/["']/g, ''), 'https://www.driing.co/').href)
  const dir = `${OUT}/driing`
  fs.mkdirSync(dir, { recursive: true })
  const list = []
  let i = 0
  for (const u of urls) {
    const real = u.includes('/_next/image?') ? new URL(new URL(u).searchParams.get('url'), 'https://www.driing.co/').href : u
    const f = `${dir}/${String(++i).padStart(2, '0')}${path.extname(new URL(real).pathname) || '.img'}`
    if (await download(real, f)) list.push({ fichier: f, url: real, octets: fs.statSync(f).size })
  }
  writeJson(`${dir}/liste.json`, list)
  console.log(`${list.length} images récupérées sur driing.co`)
} else {
  console.log('Mode : chercher | variantes | prendre | auto | driing')
  process.exit(1)
}
