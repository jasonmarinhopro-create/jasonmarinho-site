#!/usr/bin/env node
// Synchronise automatiquement le nombre de formations partout :
// /tarifs, /services, abonnement dashboard, metadata SEO, FAQ, etc.
// Lancé en prebuild (Vercel) sur les deux projets.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── 1. Compte les formations réelles ──────────────────────────────────────
const FORMATIONS_DIR = path.join(ROOT, 'jason-app/app/dashboard/formations')
// Dossiers qui ne sont pas des formations (pages de la section formations)
const EXCLUDE = new Set(['parcours', 'favoris', 'profil-apprenant'])

const formationDirs = fs.readdirSync(FORMATIONS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !EXCLUDE.has(d.name))
  .filter(d => fs.existsSync(path.join(FORMATIONS_DIR, d.name, 'content.ts')))

const TOTAL_FORMATIONS = formationDirs.length

// Slots gratuits Découverte : lu depuis FormationsGrid.tsx pour rester aligné
const gridFile = path.join(FORMATIONS_DIR, 'FormationsGrid.tsx')
let DECOUVERTE_SLOTS = 2
if (fs.existsSync(gridFile)) {
  const grid = fs.readFileSync(gridFile, 'utf8')
  const match = grid.match(/slotsMax\s*=\s*(\d+)/)
  if (match) DECOUVERTE_SLOTS = parseInt(match[1], 10)
}

// ── 1bis. Lit le total de places fondateur (source de vérité unique) ──────
// Le compteur RESTANT est dynamique (/api/founder-seats), mais le TOTAL (50)
// est hardcodé. On le lit depuis lib/constants/founder.ts pour aligner la
// page statique /tarifs et éviter le drift.
const founderConstFile = path.join(ROOT, 'jason-app/lib/constants/founder.ts')
let FOUNDER_TOTAL = 50
if (fs.existsSync(founderConstFile)) {
  const f = fs.readFileSync(founderConstFile, 'utf8')
  const m = f.match(/FOUNDER_TOTAL_SEATS\s*=\s*(\d+)/)
  if (m) FOUNDER_TOTAL = parseInt(m[1], 10)
}

console.log(`[sync-counts] ${TOTAL_FORMATIONS} formations · ${DECOUVERTE_SLOTS} slots gratuits Découverte · ${FOUNDER_TOTAL} places fondateur`)

// ── 2. Génère le fichier de constantes pour jason-app ─────────────────────
const constantsDir = path.join(ROOT, 'jason-app/lib/constants')
fs.mkdirSync(constantsDir, { recursive: true })
const constantsFile = path.join(constantsDir, 'auto-counts.ts')
const constantsContent = `// AUTO-GENERATED par scripts/sync-counts.mjs : ne pas éditer à la main.
// Régénéré à chaque \`prebuild\` (Vercel) à partir du filesystem.
export const FORMATIONS_TOTAL = ${TOTAL_FORMATIONS}
export const FORMATIONS_DECOUVERTE_SLOTS = ${DECOUVERTE_SLOTS}
`
fs.writeFileSync(constantsFile, constantsContent)
console.log(`[sync-counts] → ${path.relative(ROOT, constantsFile)}`)

// ── 3. Met à jour les fichiers HTML statiques + le dashboard ──────────────
// Patterns idempotents : matchent un nombre, le remplacent par le bon.
// On reste conservateur : qualifiants explicites pour éviter les faux positifs.
const TOTAL_PATTERNS = [
  // "14 formations complètes" / "16 formations pratiques" / etc.
  { re: /(\b)(\d+)(\s+formations\s+complètes)/g,                 to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
  { re: /(\b)(\d+)(\s+formations\s+pratiques)/g,                 to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
  { re: /(\b)(\d+)(\s+formations\s+LCD)/g,                       to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
  { re: /(\b)(\d+)(\s+formations\s+en\s+ligne)/g,                to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
  { re: /(\b)(\d+)(\s+formations\s+pour\s+(?:développer|hôtes))/g, to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
  // "Les 16 formations LCD disponibles"
  { re: /(Les\s+)(\d+)(\s+formations\s+(?:LCD|complètes|disponibles))/g, to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
  // "16 formations," ou "16 formations." (meta descriptions) : lookahead négatif pour épargner "X formations d'introduction"
  { re: /(\b)(\d+)(\s+formations(?=[,.]))/g,                             to: (_, p1, _n, p3) => `${p1}${TOTAL_FORMATIONS}${p3}` },
]

const FILES_TO_UPDATE = [
  'tarifs/index.html',
  'services/index.html',
  'services/formations/index.html',
  'services/communaute/index.html',
  'services/ecosysteme/index.html',
  'services/guides-lcd/index.html',
  'jason-app/app/dashboard/abonnement/page.tsx',
  'jason-app/app/dashboard/formations/page.tsx',
]

let totalEdits = 0
for (const rel of FILES_TO_UPDATE) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) continue
  const before = fs.readFileSync(file, 'utf8')
  let after = before
  for (const { re, to } of TOTAL_PATTERNS) after = after.replace(re, to)
  if (after !== before) {
    fs.writeFileSync(file, after)
    totalEdits++
    console.log(`[sync-counts] ✓ ${rel}`)
  }
}

// ── 4. Synchronise le TOTAL de places fondateur sur /tarifs ───────────────
// Idempotent : remplace les références au total par FOUNDER_TOTAL. Le RESTANT
// (data-founder-remaining) n'est PAS touché ici : il est mis à jour côté
// client par le fetch /api/founder-seats. On ne touche QUE le total.
const tarifsFile = path.join(ROOT, 'tarifs/index.html')
if (fs.existsSync(tarifsFile)) {
  const before = fs.readFileSync(tarifsFile, 'utf8')
  let after = before
    // attribut data-founder-total="50"
    .replace(/(data-founder-total=")(\d+)(")/g, (_m, p1, _n, p3) => `${p1}${FOUNDER_TOTAL}${p3}`)
    // label "places sur <span data-founder-total-label>50</span>"
    .replace(/(<span data-founder-total-label>)(\d+)(<\/span>)/g, (_m, p1, _n, p3) => `${p1}${FOUNDER_TOTAL}${p3}`)
    // fallback JS "parseInt(tracker.dataset.founderTotal, 10) || 50"
    .replace(/(dataset\.founderTotal,\s*10\)\s*\|\|\s*)(\d+)/g, (_m, p1, _n) => `${p1}${FOUNDER_TOTAL}`)
    // "Les 50 places fondateur sont prises"
    .replace(/(Les\s+)(\d+)(\s+places\s+fondateur\s+sont\s+prises)/g, (_m, p1, _n, p3) => `${p1}${FOUNDER_TOTAL}${p3}`)
  if (after !== before) {
    fs.writeFileSync(tarifsFile, after)
    totalEdits++
    console.log(`[sync-counts] ✓ tarifs/index.html (total fondateur = ${FOUNDER_TOTAL})`)
  }
}

console.log(`[sync-counts] Done · ${totalEdits} fichier(s) mis à jour.`)
