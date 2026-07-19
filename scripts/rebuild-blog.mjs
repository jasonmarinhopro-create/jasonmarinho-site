#!/usr/bin/env node
// Régénère blog/index.html (cartes + compteurs filtres + total), sitemap.xml,
// rss.xml et les pages catégories /blog/categorie/{slug}/ depuis
// blog/articles-data.mjs (source de vérité unique).
//
// Usage : node scripts/rebuild-blog.mjs   (ou : npm run blog:rebuild)
//
// Idempotent. Aucune action manuelle ailleurs n'est nécessaire après modif de articles-data.mjs.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
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

// Tri descendant par date : articles les plus récents en premier
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

  // 1) Cartes : remplace tout entre les marqueurs
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

  // Pages catégories en tête de section blog
  const catEntries = Object.keys(CATEGORIES)
    .filter(slug => articles.some(a => a.categorySlug === slug))
    .map(slug => `  <url>
    <loc>https://jasonmarinho.com/blog/categorie/${slug}</loc>
    <lastmod>${sortArticles(articles.filter(a => a.categorySlug === slug))[0].date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`)
    .join('\n')

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
  xml = xml.replace(blogSectionRegex, `$1${catEntries}\n${blogEntries}\n</urlset>\n`)

  writeFileSync(sitePath, xml, 'utf8')
  console.log(`✓ sitemap.xml : ${sorted.length} URLs blog + pages catégories`)
}

// ─── Flux RSS (/rss.xml) : 50 derniers articles ───────────────────────────────

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function rebuildRss() {
  const sorted = sortArticles(articles).slice(0, 50)
  const items = sorted.map(art => `    <item>
      <title>${escXml(art.title)}</title>
      <link>https://jasonmarinho.com/blog/${art.slug}</link>
      <guid isPermaLink="true">https://jasonmarinho.com/blog/${art.slug}</guid>
      <pubDate>${new Date(art.date + 'T08:00:00Z').toUTCString()}</pubDate>
      <description>${escXml(art.description)}</description>
      <category>${escXml(CATEGORIES[art.categorySlug].label)}</category>
    </item>`).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jason Marinho : Blog location courte durée</title>
    <link>https://jasonmarinho.com/blog</link>
    <atom:link href="https://jasonmarinho.com/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Conseils pratiques pour hôtes et conciergeries LCD : revenus, visibilité, réservation directe, fiscalité, expérience voyageur. Par Jason Marinho, expert LCD et co-fondateur de Driing.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(sorted[0].date + 'T08:00:00Z').toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
  writeFileSync(resolve(ROOT, 'rss.xml'), rss, 'utf8')
  console.log(`✓ rss.xml : ${sorted.length} items`)
}

// ─── Pages catégories statiques /blog/categorie/{slug}/ ───────────────────────

const CAT_DESCRIPTIONS = {
  revenus:        'Tarification, réservation directe, rentabilité : tous les articles pour augmenter les revenus de ta location courte durée.',
  visibilite:     'Photos, annonce, Google Business, réseaux sociaux : tous les articles pour rendre ton logement LCD plus visible.',
  experience:     'Accueil, ménage, avis 5 étoiles, gestion voyageurs : tous les articles pour une expérience voyageur irréprochable.',
  ressources:     'Outils, communauté, partenaires validés : les ressources pratiques pour hôtes et conciergeries LCD.',
  automatisation: 'Messages automatiques, PMS, channel manager : tous les articles pour gagner du temps en location courte durée.',
  reglementation: "Numéro d'enregistrement, quotas, obligations légales : tous les articles pour rester en règle en LCD.",
  conciergerie:   'Créer, structurer et développer sa conciergerie LCD : tous les articles dédiés aux professionnels de la gestion.',
  fiscalite:      'LMNP, micro-BIC, régime réel, déclarations : tous les articles fiscalité de la location courte durée.',
  driing:         'Driing, la plateforme de réservation sans commission co-fondée par Jason Marinho : actualités et guides.',
}

function buildCategoryPage(slug, cat, arts) {
  const url = `https://jasonmarinho.com/blog/categorie/${slug}`
  const desc = CAT_DESCRIPTIONS[slug] || `Tous les articles ${cat.label} du blog LCD de Jason Marinho.`
  const cards = arts.map(art => `      <a href="/blog/${art.slug}" class="card">
        <div class="card-bar" style="background:${cat.barColor}"></div>
        <div class="card-body">
          <h2 class="card-t">${art.title}</h2>
          <p class="card-d">${art.description}</p>
          <span class="card-m">${art.readTime} min de lecture · Lire l'article →</span>
        </div>
      </a>`).join('\n')

  const otherCats = Object.entries(CATEGORIES)
    .filter(([s]) => s !== slug && articles.some(a => a.categorySlug === s))
    .map(([s, c]) => `<a href="/blog/categorie/${s}">${c.label}</a>`)
    .join('')

  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${cat.label} : Blog location courte durée`,
      description: desc,
      url,
      inLanguage: 'fr-FR',
      isPartOf: { '@type': 'Blog', name: 'Blog Jason Marinho', url: 'https://jasonmarinho.com/blog' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://jasonmarinho.com/blog' },
        { '@type': 'ListItem', position: 3, name: cat.label, item: url },
      ],
    },
  ])

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cat.label} : Blog location courte durée (${arts.length} articles) | Jason Marinho</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${cat.label} : Blog LCD | Jason Marinho">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="alternate" type="application/rss+xml" title="Blog Jason Marinho" href="/rss.xml">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=2026-07-19">
<style>
:root{--g:#004C3F;--gd:#003329;--ol:#556B2F;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.09)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:48px 0;color:#fff}
.s-in{max-width:1000px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:18px}
.brd a{color:rgba(255,255,255,.55);text-decoration:none}
h1{font-family:'Fraunces',serif;font-size:clamp(28px,4vw,42px);font-weight:400;line-height:1.15;letter-spacing:-.4px;margin:0 0 12px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:15px;color:rgba(255,255,255,.65);line-height:1.7;max-width:640px}
.count-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,213,107,.1);border:1px solid rgba(255,213,107,.25);border-radius:100px;padding:7px 16px;font-size:13px;font-weight:600;color:#FFD56B;margin-top:14px}
.main{max-width:1000px;margin:0 auto;padding:40px clamp(16px,5vw,40px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--bd);border-radius:14px;overflow:hidden;text-decoration:none;transition:transform .18s,box-shadow .18s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,76,63,.1)}
.card-bar{height:5px}
.card-body{padding:18px 20px;display:flex;flex-direction:column;gap:8px;flex:1}
.card-t{font-family:'Fraunces',serif;font-size:16.5px;font-weight:400;color:var(--td);line-height:1.35;margin:0}
.card-d{font-size:13px;color:var(--tm);line-height:1.65;margin:0;flex:1}
.card-m{font-size:12px;font-weight:600;color:var(--g)}
.other-cats{max-width:1000px;margin:0 auto;padding:0 clamp(16px,5vw,40px) 48px}
.other-cats h2{font-family:'Fraunces',serif;font-size:19px;font-weight:400;color:var(--td);margin:0 0 12px}
.oc-chips{display:flex;flex-wrap:wrap;gap:7px}
.oc-chips a{font-size:12.5px;padding:6px 12px;border-radius:8px;background:#fff;color:var(--tm);text-decoration:none;border:1px solid var(--bd);transition:all .18s}
.oc-chips a:hover{color:var(--g);border-color:rgba(0,76,63,.25)}
.back-blog{display:inline-flex;align-items:center;gap:6px;margin-top:16px;font-size:13px;font-weight:600;color:var(--g);text-decoration:none}
</style>
<script type="application/ld+json">
${jsonLd}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/blog">Blog</a> · <span>${cat.label}</span></div>
    <h1>${cat.label} <em>en location courte durée</em></h1>
    <p class="lead">${desc}</p>
    <span class="count-pill">${arts.length} article${arts.length > 1 ? 's' : ''}</span>
  </div>
</header>
<main class="main">
  <div class="grid">
${cards}
  </div>
</main>
<div class="other-cats">
  <h2>Explorer les autres catégories</h2>
  <div class="oc-chips">${otherCats}</div>
  <br>
  <a href="/blog" class="back-blog">← Tous les articles du blog</a>
</div>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

function rebuildCategoryPages() {
  let count = 0
  for (const [slug, cat] of Object.entries(CATEGORIES)) {
    const arts = sortArticles(articles.filter(a => a.categorySlug === slug))
    if (arts.length === 0) continue
    const dir = resolve(ROOT, 'blog', 'categorie', slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, 'index.html'), buildCategoryPage(slug, cat, arts), 'utf8')
    count++
  }
  console.log(`✓ blog/categorie/ : ${count} pages catégories`)
}

// ─── Run ──────────────────────────────────────────────────────────────────────

rebuildIndex()
rebuildSitemap()
rebuildRss()
rebuildCategoryPages()

console.log(`\n🎉 Blog régénéré depuis articles-data.mjs (${articles.length} articles)`)
