#!/usr/bin/env node
// Photo de couverture en tête de chaque article du blog (15/11/2026).
// Source : data/blog-covers.json + img/blog/<slug>.webp (scripts/blog-covers.mjs).
// - une vraie <img> en haut du texte (1200 x 630, 600 px sur téléphone) avec
//   le nom du photographe ;
// - image de partage (og:image, twitter:image) et image des données
//   structurées BlogPosting : chaque article a enfin son propre visuel
//   (avant : la même couverture-jason.webp pour les 230 articles) ;
// - max-image-preview:large, que Google demande pour montrer une grande image
//   dans Discover (developers.google.com/search/docs/appearance/google-discover).
// - fetchpriority="high" : la photo est l'élément le plus grand du premier
//   écran (LCP), le navigateur la demande avant le reste (audit SEO 18/11/2026).
// Idempotent (marqueurs COVER), lancé au déploiement (build-site.sh) après les
// générateurs. Un article sans couverture reste tel quel.
//   node scripts/inject-blog-covers.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const SITE = 'https://jasonmarinho.com'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const RE = /<!-- COVER:START -->[\s\S]*?<!-- COVER:END -->\n?/
const CSS = '.art-cover{margin:0 0 32px}.art-cover img{display:block;width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover;border-radius:18px;background:#e9e5dc}'
  + '.art-cover figcaption{margin-top:8px;font-size:11.5px;color:#7a8a77}.art-cover figcaption a{color:inherit}'

let covers = {}
try { covers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/blog-covers.json'), 'utf8')) } catch { /* aucune couverture */ }

function credit(c) {
  if (c.source === 'pexels') return `Photo : <a href="${esc(c.photographer_url || c.page)}" target="_blank" rel="noopener nofollow">${esc(c.photographer)}</a> sur <a href="${esc(c.page)}" target="_blank" rel="noopener nofollow">Pexels</a>`
  if (c.credit) return esc(c.credit)
  return ''
}

let n = 0, missing = 0
for (const [slug, c] of Object.entries(covers)) {
  const file = path.join(ROOT, 'blog', slug, 'index.html')
  const img = path.join(ROOT, 'img/blog', `${slug}.webp`)
  if (!fs.existsSync(file) || !fs.existsSync(img)) { missing++; continue }
  const src = fs.readFileSync(file, 'utf8')
  const title = (src.match(/<h1 class="art-title">([\s\S]*?)<\/h1>/)?.[1] || '').replace(/<[^>]+>/g, '').trim()
  const alt = c.alt_fr || `Illustration de l'article : ${title}`
  const url = `${SITE}/img/blog/${slug}.webp`
  const small = fs.existsSync(path.join(ROOT, 'img/blog', `${slug}-600.webp`))
  const cap = credit(c)
  const bloc = `<!-- COVER:START --><figure class="art-cover"><img src="/img/blog/${slug}.webp"`
    + (small ? ` srcset="/img/blog/${slug}-600.webp 600w, /img/blog/${slug}.webp 1200w" sizes="(max-width: 760px) 100vw, 700px"` : '')
    + ` alt="${esc(alt)}" width="1200" height="630" fetchpriority="high" decoding="async">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure><style>${CSS}</style><!-- COVER:END -->\n`

  let out = src.replace(RE, '')
  if (!out.includes('<div class="art-body">')) { missing++; continue }
  // sans_figure : image de partage seulement, pas de photo en haut du texte
  // (article Driing, 15/11/2026 : Jason préfère la capture de driing.co)
  if (!c.sans_figure) {
    out = out.replace('<div class="art-body">\n', `<div class="art-body">\n${bloc}`)
    if (!out.includes('<!-- COVER:START -->')) out = out.replace('<div class="art-body">', `<div class="art-body">\n${bloc}`)
  }
  // Images de partage : toutes les balises existantes pointent vers la couverture
  out = out.replace(/<meta property="og:image" content="[^"]*">/g, `<meta property="og:image" content="${url}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/g, `<meta name="twitter:image" content="${url}">`)
    .replace(/<meta property="og:image:width" content="\d+">/g, '<meta property="og:image:width" content="1200">')
    .replace(/<meta property="og:image:height" content="\d+">/g, '<meta property="og:image:height" content="630">')
  // Doublon d'og:image (page Driing) : on garde la première
  let seen = false
  out = out.replace(new RegExp(`<meta property="og:image" content="${url.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}">\\n?`, 'g'), m => (seen ? '' : (seen = true, m)))
  // Grande image autorisée dans Google (Discover, Images)
  out = out.replace(/<meta name="robots" content="index, follow">/, '<meta name="robots" content="index, follow, max-image-preview:large">')
  // Données structurées : image du BlogPosting
  out = out.replace(/("@type":\s*"BlogPosting",)(\s*)(?:"image":\s*"[^"]*",\s*)?/, (m, a, sp) => `${a}${sp}"image": "${url}",${sp}`)
  if (out !== src) {
    n++
    if (!check) fs.writeFileSync(file, out)
  }
}
console.log(`[blog-covers] ${n} article(s) ${check ? 'à mettre à jour' : 'mis à jour'}, ${Object.keys(covers).length} couverture(s)${missing ? `, ${missing} ignorée(s) (article ou image absents)` : ''}`)
