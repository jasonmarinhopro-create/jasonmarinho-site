/**
 * Script de génération automatique des cartes blog dans blog/index.html
 * Usage : node scripts/generate-blog.mjs
 * - Lit tous les .md dans blog/articles/
 * - Ne publie que les articles dont la date <= aujourd'hui
 * - Injecte les cartes entre les marqueurs dans blog/index.html
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ARTICLES_DIR = resolve(ROOT, 'blog/articles')
const INDEX_PATH = resolve(ROOT, 'blog/index.html')

const CAT_STYLES = {
  'visibilité':     { bar: 'var(--g)',    text: 'var(--g)',    dot: 'var(--g)',    filter: 'visibilite' },
  'revenus':        { bar: '#E8A020',     text: '#B06010',     dot: '#E8A020',     filter: 'revenus' },
  'automatisation': { bar: '#3B82F6',     text: '#2563EB',     dot: '#3B82F6',     filter: 'automatisation' },
  'expérience':     { bar: '#D97706',     text: '#92400E',     dot: '#D97706',     filter: 'experience' },
  'fiscalité':      { bar: 'var(--ol)',   text: 'var(--ol)',   dot: 'var(--ol)',   filter: 'fiscalite' },
  'conciergerie':   { bar: 'var(--gd)',   text: 'var(--gd)',   dot: 'var(--gd)',   filter: 'conciergerie' },
  'driing':         { bar: '#0EA5E9',     text: '#0369A1',     dot: '#0EA5E9',     filter: 'driing' },
  'réglementation': { bar: '#DC2626',     text: '#991B1B',     dot: '#DC2626',     filter: 'reglementation' },
  'ressources':     { bar: '#8B5CF6',     text: '#6D28D9',     dot: '#8B5CF6',     filter: 'ressources' },
  'réservation':    { bar: '#0EA5E9',     text: '#0369A1',     dot: '#0EA5E9',     filter: 'reservation' },
  'plateforme':     { bar: 'var(--g)',    text: 'var(--g)',    dot: 'var(--g)',     filter: 'plateforme' },
}

function getStyle(category) {
  const key = category.toLowerCase()
  return CAT_STYLES[key] || { bar: 'var(--g)', text: 'var(--g)', dot: 'var(--g)', filter: key }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const fm = {}
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim().replace(/^"|"$/g, '')
    }
  })
  return fm
}

function generateCard(fm, delay = '') {
  const style = getStyle(fm.category)
  const delayClass = delay ? ` ${delay}` : ''
  return `
      <article data-cat="${style.filter}" data-title="${fm.title}" data-desc="${fm.description}" class="blog-card rv${delayClass}">
        <div class="bc-bar" style="background:${style.bar}"></div>
        <div class="bc-body">
          <div class="bc-cat" style="color:${style.text}"><span style="background:${style.dot}"></span>${fm.category}</div>
          <h2 class="bc-title">${fm.title}</h2>
          <p class="bc-desc">${fm.description}</p>
          <div class="bc-foot">
            <span class="bc-time">${fm.readTime}</span>
            <a href="/blog/${fm.slug}" class="bc-lk">Lire <i class="ph-bold ph-arrow-right"></i></a>
          </div>
        </div>
      </article>`
}

function run() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const files = readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  console.log(`\n📄 ${files.length} articles trouvés dans blog/articles/`)

  const published = []
  const pending = []

  for (const file of files) {
    const content = readFileSync(resolve(ARTICLES_DIR, file), 'utf8')
    const fm = parseFrontmatter(content)
    if (!fm || !fm.title || !fm.slug || !fm.date) {
      console.warn(`⚠️  Frontmatter incomplet : ${file}`)
      continue
    }
    const pubDate = new Date(fm.date)
    pubDate.setHours(0, 0, 0, 0)
    if (pubDate <= today) published.push(fm)
    else pending.push(fm)
  }

  published.sort((a, b) => new Date(b.date) - new Date(a.date))

  console.log(`✅ ${published.length} articles publiés`)
  console.log(`⏳ ${pending.length} articles en attente\n`)

  const delays = ['', 'd1', 'd2']
  const cardsHtml = published.map((fm, i) => generateCard(fm, delays[i % 3])).join('\n')

  let html = readFileSync(INDEX_PATH, 'utf8')

  const startMarker = '<!-- BLOG:CARDS:START -->'
  const endMarker = '<!-- BLOG:CARDS:END -->'

  if (!html.includes(startMarker)) {
    console.error(`❌ Marqueur "${startMarker}" introuvable dans blog/index.html`)
    console.error('   Ajoute ces deux commentaires dans <div id="articles-grid"> :')
    console.error('   <!-- BLOG:CARDS:START -->')
    console.error('   <!-- BLOG:CARDS:END -->')
    process.exit(1)
  }

  const before = html.indexOf(startMarker) + startMarker.length
  const after = html.indexOf(endMarker)
  html = html.slice(0, before) + '\n' + cardsHtml + '\n    ' + html.slice(after)

  html = html.replace(
    /(<span id="articles-count"[^>]*>)[^<]*(<\/span>)/,
    `$1${published.length} ressource${published.length > 1 ? 's' : ''} gratuite${published.length > 1 ? 's' : ''}$2`
  )

  writeFileSync(INDEX_PATH, html, 'utf8')
  console.log(`✅ ${published.length} cartes injectées dans blog/index.html`)

  const byCat = {}
  published.forEach(fm => { byCat[fm.category] = (byCat[fm.category] ?? 0) + 1 })
  Object.entries(byCat).sort((a, b) => b[1] - a[1])
    .forEach(([cat, n]) => console.log(`  ${cat.padEnd(18)} ${n} article(s)`))

  console.log('\nTerminé 🎉\n')
}

run()
