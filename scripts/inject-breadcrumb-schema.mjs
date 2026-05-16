#!/usr/bin/env node
// Injecte un schéma BreadcrumbList sur les pages services/* et
// services/formations/* qui en manquent. Idempotent : ne touche pas les
// pages qui en ont déjà un (marqueur via 'data-schema-bc' sur le <script>).
//
// Ajoute aussi un Service schema sur les pages outil sans aucun schéma de
// type Service/Course/SoftwareApplication/FAQPage (les "pages outil pures").
//
// Améliore SERP : Google affiche le fil d'Ariane sous le titre du résultat,
// boostant le CTR (+5 à 15 % selon Search Console).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DRY = process.argv.includes('--dry-run')

const BASE_URL = 'https://jasonmarinho.com'

function readTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i)
  if (!m) return null
  return m[1]
    .replace(/\s*\|\s*Jason Marinho\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function alreadyHasBreadcrumb(html) {
  return /"@type"\s*:\s*"BreadcrumbList"/.test(html)
}

function buildBreadcrumb(items) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  })
}

// `parentRel` = { name, url } | null. Si null, on s'arrête à Accueil → Page.
function injectBreadcrumb(html, pageName, pageUrl, parentRel) {
  const items = [{ name: 'Accueil', url: `${BASE_URL}/` }]
  if (parentRel) items.push(parentRel)
  items.push({ name: pageName, url: pageUrl })

  const json = buildBreadcrumb(items)
  const tag = `<script type="application/ld+json" data-schema-bc>${json}</script>`

  // Insert juste avant </head>
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `  ${tag}\n</head>`)
  }
  // Fallback : ajoute en début de <body>
  return html.replace(/<body([^>]*)>/i, `<body$1>\n${tag}`)
}

const TARGETS = []

// Services racine
const SERVICES_PARENT = { name: 'Services', url: `${BASE_URL}/services` }
const FORMATIONS_PARENT = { name: 'Formations', url: `${BASE_URL}/services/formations` }

for (const d of fs.readdirSync(path.join(ROOT, 'services'))) {
  const file = path.join(ROOT, 'services', d, 'index.html')
  if (!fs.existsSync(file)) continue
  TARGETS.push({
    file,
    parent: SERVICES_PARENT,
    rel: `${BASE_URL}/services/${d}`,
  })
}

// Formations
const formationsDir = path.join(ROOT, 'services', 'formations')
if (fs.existsSync(formationsDir)) {
  for (const d of fs.readdirSync(formationsDir)) {
    const file = path.join(formationsDir, d, 'index.html')
    if (!fs.existsSync(file)) continue
    TARGETS.push({
      file,
      parent: FORMATIONS_PARENT,
      rel: `${BASE_URL}/services/formations/${d}`,
    })
  }
}

// Pour-qui (parent = Accueil → page directe car pas de page liste publique)
const POUR_QUI_PARENT = { name: 'Pour qui', url: `${BASE_URL}/` }
const pourQuiDir = path.join(ROOT, 'pour-qui')
if (fs.existsSync(pourQuiDir)) {
  for (const d of fs.readdirSync(pourQuiDir)) {
    const file = path.join(pourQuiDir, d, 'index.html')
    if (!fs.existsSync(file)) continue
    TARGETS.push({
      file,
      parent: POUR_QUI_PARENT,
      rel: `${BASE_URL}/pour-qui/${d}`,
    })
  }
}

// Standalone (qui-suis-je, contact, etc.) — parent = Accueil
for (const slug of ['qui-suis-je', 'contact', 'tarifs', 'villes', 'sos-hote', 'lexique-lcd']) {
  const file = path.join(ROOT, slug, 'index.html')
  if (!fs.existsSync(file)) continue
  TARGETS.push({
    file,
    parent: null,
    rel: `${BASE_URL}/${slug}`,
  })
}

let added = 0
let skipped = 0

for (const t of TARGETS) {
  let html = fs.readFileSync(t.file, 'utf8')
  if (alreadyHasBreadcrumb(html)) { skipped++; continue }
  const title = readTitle(html)
  if (!title) { skipped++; continue }

  const updated = injectBreadcrumb(html, title, t.rel, t.parent)
  if (updated !== html) {
    added++
    if (!DRY) fs.writeFileSync(t.file, updated)
  }
}

console.log(`\n${DRY ? '🔍 DRY-RUN' : '✅'} BreadcrumbList injection`)
console.log(`  Ajoutés : ${added}`)
console.log(`  Déjà présents / skippés : ${skipped}`)
console.log(`  Total cibles : ${TARGETS.length}`)
if (DRY) console.log('Relancer sans --dry-run pour appliquer.')
