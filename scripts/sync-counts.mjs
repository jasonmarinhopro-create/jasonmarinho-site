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

// Slots gratuits Découverte — lu depuis FormationsGrid.tsx pour rester aligné
const gridFile = path.join(FORMATIONS_DIR, 'FormationsGrid.tsx')
let DECOUVERTE_SLOTS = 2
if (fs.existsSync(gridFile)) {
  const grid = fs.readFileSync(gridFile, 'utf8')
  const match = grid.match(/slotsMax\s*=\s*(\d+)/)
  if (match) DECOUVERTE_SLOTS = parseInt(match[1], 10)
}

console.log(`[sync-counts] ${TOTAL_FORMATIONS} formations · ${DECOUVERTE_SLOTS} slots gratuits Découverte`)

// ── 2. Génère le fichier de constantes pour jason-app ─────────────────────
const constantsDir = path.join(ROOT, 'jason-app/lib/constants')
fs.mkdirSync(constantsDir, { recursive: true })
const constantsFile = path.join(constantsDir, 'auto-counts.ts')
const constantsContent = `// AUTO-GENERATED par scripts/sync-counts.mjs — ne pas éditer à la main.
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
  // "16 formations," ou "16 formations." (meta descriptions) — lookahead négatif pour épargner "X formations d'introduction"
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

console.log(`[sync-counts] Done · ${totalEdits} fichier(s) mis à jour.`)
