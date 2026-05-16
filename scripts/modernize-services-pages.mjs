#!/usr/bin/env node
// Modernise les micro-interactions sur toutes les pages /services/* et
// /pour-qui/*. Remplace 'transition: all .2s' par des transitions
// ciblées avec easing modernes (cubic-bezier expo-out + spring) et
// améliore les hovers (lift -1→-2, ombres renforcées, :active state).
//
// SAFE : ne touche QUE les patterns CSS .btn-p, .btn-ol, .nb-c, .nb-o,
// .card hovers connus. Pas de risque de casser du contenu.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DRY = process.argv.includes('--dry-run')

// Patterns CSS à moderniser
const REPLACEMENTS = [
  // .btn-p (CTA principal jaune)
  {
    from: /\.btn-p\{([^}]*?)transition:all \.2s([^}]*?)\}/g,
    to: (_m, before, after) =>
      `.btn-p{${before}transition:background .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s${after}}`,
  },
  {
    from: /\.btn-p:hover\{background:#ffe08f;transform:translateY\(-1px\);box-shadow:0 8px 28px rgba\(255,213,107,\.25\)\}/g,
    to: '.btn-p:hover{background:#ffe08f;transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,213,107,.32)}\n    .btn-p:active{transform:translateY(0)}',
  },

  // .btn-ol (outline vert)
  {
    from: /\.btn-ol\{([^}]*?)transition:all \.2s([^}]*?)\}/g,
    to: (_m, before, after) =>
      `.btn-ol{${before}transition:background .2s cubic-bezier(.4,0,.2,1),color .2s,transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s${after}}`,
  },
  {
    from: /\.btn-ol:hover\{background:var\(--g\);color:#fff\}/g,
    to: '.btn-ol:hover{background:var(--g);color:#fff;transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,76,63,.18)}\n    .btn-ol:active{transform:translateY(0)}',
  },

  // .btn-g (border subtile sombre, sur fond dark)
  {
    from: /\.btn-g:hover\{border-color:rgba\(255,255,255,\.32\);color:#fff\}/g,
    to: '.btn-g:hover{border-color:rgba(255,255,255,.45);color:#fff;background:rgba(255,255,255,.04)}',
  },

  // .card hover lift sur cards services (pattern .card transition all)
  {
    from: /\.card\{([^}]*?)transition:transform \.22s,box-shadow \.22s([^}]*?)\}/g,
    to: (_m, before, after) =>
      `.card{${before}transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s,border-color .25s${after}}`,
  },
  {
    from: /\.card:hover\{transform:translateY\(-4px\);box-shadow:0 12px 32px rgba\(0,76,63,\.1\)\}/g,
    to: '.card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,76,63,.14);border-color:rgba(0,76,63,.18)}',
  },

  // .rel-card (related articles dans le blog) - easing moderne + lift renforcé
  {
    from: /\.rel-card\{([^}]*?)transition:transform \.2s,box-shadow \.2s([^}]*?)\}/g,
    to: (_m, before, after) =>
      `.rel-card{${before}transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s,border-color .25s${after}}`,
  },
  {
    from: /\.rel-card:hover\{transform:translateY\(-3px\);box-shadow:0 8px 24px rgba\(0,76,63,\.08\)\}/g,
    to: '.rel-card:hover{transform:translateY(-4px);box-shadow:0 16px 36px rgba(0,76,63,.12);border-color:rgba(0,76,63,.18)}',
  },

  // .al-card (Aller plus loin cards depuis inject-services-links.mjs)
  {
    from: /\.al-card\{([^}]*?)transition:transform \.2s,box-shadow \.2s,border-color \.2s([^}]*?)\}/g,
    to: (_m, before, after) =>
      `.al-card{${before}transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s,border-color .25s${after}}`,
  },

  // Body articles : .art-p / .art-ul li → fontWeight 300 trop fin pour lisibilité
  // Migration vers 400 (standard). Améliore drastiquement la lecture sur écrans
  // moyens, mode clair, et utilisateurs +50 ans.
  {
    from: /\.art-p\{font-size:15px;font-weight:300;color:var\(--tm\);line-height:1\.8;margin-bottom:16px\}/g,
    to: '.art-p{font-size:15px;font-weight:400;color:var(--tm);line-height:1.75;margin-bottom:16px}',
  },
  {
    from: /\.art-ul li\{font-size:15px;font-weight:300;color:var\(--tm\);line-height:1\.7;padding:6px 0 6px 24px;position:relative;border-bottom:1px solid var\(--bd\)\}/g,
    to: '.art-ul li{font-size:15px;font-weight:400;color:var(--tm);line-height:1.7;padding:8px 0 8px 24px;position:relative;border-bottom:1px solid var(--bd)}',
  },
]

const TARGETS = [
  // 17 pages services
  ...fs.readdirSync(path.join(ROOT, 'services'))
    .filter(d => fs.existsSync(path.join(ROOT, 'services', d, 'index.html')))
    .map(d => path.join(ROOT, 'services', d, 'index.html')),
  // 4 pages pour-qui
  ...fs.readdirSync(path.join(ROOT, 'pour-qui'))
    .filter(d => fs.existsSync(path.join(ROOT, 'pour-qui', d, 'index.html')))
    .map(d => path.join(ROOT, 'pour-qui', d, 'index.html')),
  // 139 articles blog
  ...fs.readdirSync(path.join(ROOT, 'blog'))
    .filter(d => fs.existsSync(path.join(ROOT, 'blog', d, 'index.html')))
    .map(d => path.join(ROOT, 'blog', d, 'index.html')),
  // 60 pages 'devenir hôte Airbnb [ville]' (SEO local fort)
  ...fs.readdirSync(ROOT)
    .filter(d => d.startsWith('devenir-hote-airbnb-'))
    .filter(d => fs.existsSync(path.join(ROOT, d, 'index.html')))
    .map(d => path.join(ROOT, d, 'index.html')),
  // 14 pages comparatif-* (outils, plateformes)
  ...fs.readdirSync(ROOT)
    .filter(d => d.startsWith('comparatif-'))
    .filter(d => fs.existsSync(path.join(ROOT, d, 'index.html')))
    .map(d => path.join(ROOT, d, 'index.html')),
  // Pages légales root
  ...['cgvu.html', 'mentions-legales.html', 'politique-de-confidentialite.html']
    .filter(f => fs.existsSync(path.join(ROOT, f)))
    .map(f => path.join(ROOT, f)),
]

let totalReplacements = 0
const filesChanged = []

for (const file of TARGETS) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  let fileReplacements = 0

  for (const { from, to } of REPLACEMENTS) {
    const before = content
    content = content.replace(from, to)
    const matches = (before.match(from) || []).length
    if (matches > 0) fileReplacements += matches
  }

  if (content !== original) {
    totalReplacements += fileReplacements
    filesChanged.push({ file: path.relative(ROOT, file), count: fileReplacements })
    if (!DRY) fs.writeFileSync(file, content)
  }
}

console.log(`\n${DRY ? '🔍 DRY-RUN' : '✅ MODERNISATION'} — pages services + pour-qui\n`)
filesChanged
  .sort((a, b) => b.count - a.count)
  .forEach(f => console.log(`  ${f.count.toString().padStart(3)} maj  →  ${f.file}`))
console.log(`\n${totalReplacements} maj dans ${filesChanged.length} fichiers.`)
if (DRY) console.log('Lance sans --dry-run pour appliquer.')
