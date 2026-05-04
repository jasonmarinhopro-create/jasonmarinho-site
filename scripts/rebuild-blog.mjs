#!/usr/bin/env node
// Régénère blog/index.html (cartes + compteurs filtres + total) et sitemap.xml
// depuis blog/articles-data.mjs (source de vérité unique).
//
// Usage : node scripts/rebuild-blog.mjs   (ou : npm run blog:rebuild)
//
// Idempotent. Aucune action manuelle ailleurs n'est nécessaire après modif de articles-data.mjs.

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const dataPath  = resolve(ROOT, 'blog/articles-data.mjs')
const indexPath = resolve(ROOT, 'blog/index.html')
const sitePath  = resolve(ROOT, 'sitemap.xml')

const { articles, CATEGORIES } = await import(`${pathToFileURL(dataPath).href}?t=${Date.now()}`)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Tri descendant par date — articles les plus récents en premier
function sortArticles(arr) {
  return [...arr].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date)
    return a.slug.localeCompare(b.slug)
  })
}

// ─── Cartes ───────────────────────────────────────────────────────────────────

function buildCard(art) {
  const cat = CATEGORIES[art.categorySlug]
  if (!cat) throw new Error(`Catégorie inconnue : ${art.categorySlug} (slug=${art.slug})`)
  const title = art.title
  const desc  = art.description || ''
  return `      <article data-cat="${art.categorySlug}" data-title="${escAttr(title)}" data-desc="${escAttr(desc)}" class="blog-card rv">
        <div class="bc-bar" style="background:${cat.barColor}"></div>
        <div class="bc-body">
          <div class="bc-cat" style="color:${cat.catColor}"><span style="background:${cat.barColor}"></span>${cat.label}</div>
          <h2 class="bc-title">${title}</h2>
          <p class="bc-desc">${desc}</p>
          <div class="bc-foot">
            <span class="bc-time">${art.readTime} min de lecture</span>
            <a href="/blog/${art.slug}" class="bc-lk">Lire <i class="ph-bold ph-arrow-right"></i></a>
          </div>
        </div>
      </article>`
}

// ─── Régénération blog/index.html ─────────────────────────────────────────────

function rebuildIndex() {
  const sorted = sortArticles(articles)
  let html = readFileSync(indexPath, 'utf8')

  // 1) Cartes — remplace tout entre les marqueurs
  const cardsHtml = sorted.map(buildCard).join('\n\n')
  const markerRegex = /<!-- BLOG:CARDS:START -->[\s\S]*?<!-- BLOG:CARDS:END -->/
  if (!markerRegex.test(html)) {
    throw new Error('Marqueurs <!-- BLOG:CARDS:START --> / <!-- BLOG:CARDS:END --> introuvables dans blog/index.html')
  }
  html = html.replace(markerRegex, `<!-- BLOG:CARDS:START -->\n${cardsHtml}\n<!-- BLOG:CARDS:END -->`)

  // 2) Compteur total (id="articles-count")
  const total = sorted.length
  html = html.replace(
    /(<span id="articles-count"[^>]*>)[^<]*(<\/span>)/,
    `$1${total} ressources gratuites$2`,
  )

  // 3) Compteurs par filtre (data-filter="..." → blog-cat-count)
  const counts = { all: total }
  for (const art of sorted) {
    counts[art.categorySlug] = (counts[art.categorySlug] || 0) + 1
  }
  html = html.replace(
    /(data-filter="([a-z]+)"[^>]*>[^<]*<i[^>]*><\/i>[^<]*<span class="blog-cat-count">)\d+(<\/span>)/g,
    (m, prefix, key, suffix) => `${prefix}${counts[key] || 0}${suffix}`,
  )

  writeFileSync(indexPath, html, 'utf8')
  console.log(`✓ blog/index.html : ${total} cartes, compteurs filtres mis à jour`)
}

// ─── Régénération sitemap.xml (section Blog uniquement) ───────────────────────

function rebuildSitemap() {
  const sorted = sortArticles(articles)
  let xml = readFileSync(sitePath, 'utf8')

  const blogEntries = sorted.map(art => {
    const lastmod = art.date
    return `  <url>
    <loc>https://jasonmarinho.com/blog/${art.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  }).join('\n')

  // La section Blog va de <!-- ── Blog ── --> jusqu'à la fin de </urlset>
  const blogSectionRegex = /(  <!-- ── Blog ── -->\n)[\s\S]*?(\n<\/urlset>\s*)$/
  if (!blogSectionRegex.test(xml)) {
    throw new Error('Section Blog introuvable dans sitemap.xml')
  }
  xml = xml.replace(blogSectionRegex, `$1${blogEntries}\n</urlset>\n`)

  writeFileSync(sitePath, xml, 'utf8')
  console.log(`✓ sitemap.xml : ${sorted.length} URLs blog`)
}

// ─── Run ──────────────────────────────────────────────────────────────────────

rebuildIndex()
rebuildSitemap()

console.log(`\n🎉 Blog régénéré depuis articles-data.mjs (${articles.length} articles)`)
