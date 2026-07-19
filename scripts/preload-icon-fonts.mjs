#!/usr/bin/env node
// Ajoute les preload hints pour les polices Phosphor sur toutes les pages
// /services/* et /pour-qui/* qui n'en ont pas encore.
//
// Pourquoi : sans preload, le browser découvre les fonts seulement après
// parser le CSS du subset Phosphor. Avec preload, démarrage immédiat
// → ~100-200ms gagnés sur la 1ère peinture des icônes (FCP/LCP).

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const TARGETS = [
  ...fs.readdirSync(path.join(ROOT, 'services'))
    .filter(d => fs.existsSync(path.join(ROOT, 'services', d, 'index.html')))
    .map(d => path.join(ROOT, 'services', d, 'index.html')),
  ...fs.readdirSync(path.join(ROOT, 'pour-qui'))
    .filter(d => fs.existsSync(path.join(ROOT, 'pour-qui', d, 'index.html')))
    .map(d => path.join(ROOT, 'pour-qui', d, 'index.html')),
]

const PRELOAD_TAGS = `<link rel="preload" as="font" type="font/woff2" href="/fonts/Phosphor.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/Phosphor-Bold.woff2" crossorigin>`

let updated = 0
let skipped = 0

for (const file of TARGETS) {
  let html = fs.readFileSync(file, 'utf8')

  if (html.includes('preload" as="font" type="font/woff2" href="/fonts/Phosphor')) {
    skipped++
    continue
  }

  // Insère après le preload Google Fonts existant (ou avant <noscript>)
  const anchor = '<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=2026-07-19">'
  if (!html.includes(anchor)) {
    skipped++
    continue
  }

  html = html.replace(anchor, `${PRELOAD_TAGS}\n  ${anchor}`)
  fs.writeFileSync(file, html)
  updated++
}

console.log(`✓ Updated : ${updated}`)
console.log(`- Skipped : ${skipped}`)
console.log(`= Total   : ${TARGETS.length}`)
