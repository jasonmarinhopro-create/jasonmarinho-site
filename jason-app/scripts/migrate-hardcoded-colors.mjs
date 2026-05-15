#!/usr/bin/env node
// Migre les couleurs Tailwind hardcodées (#34D399, #10b981, etc.) vers
// les tokens CSS sémantiques (--success-1, --danger, etc.) dans les
// fichiers TSX du dashboard.
//
// SAFE : ne touche QUE les occurrences exactes des couleurs Tailwind
// connues. Préserve les couleurs de marque (#FFD56B accent, #004C3F vert
// forêt) et les couleurs spécifiques (badges Chez Nous, charges catégories).
//
// Usage : node scripts/migrate-hardcoded-colors.mjs [--dry-run]

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '..', 'app')
const COMPONENTS = path.resolve(__dirname, '..', 'components')
const DRY = process.argv.includes('--dry-run')

// Mapping ciblé : couleur exacte → token CSS
// Ordre important : les plus spécifiques d'abord
const COLOR_MAP = [
  // SUCCESS (green-400/500 Tailwind)
  { from: /'#34D399'/g, to: "'var(--success-1)'" },
  { from: /'#34d399'/g, to: "'var(--success-1)'" },
  { from: /'#10b981'/g, to: "'var(--success-1)'" },
  // DANGER (red-400/500 Tailwind)
  { from: /'#ef4444'/g, to: "'var(--danger)'" },
  { from: /'#f87171'/g, to: "'var(--danger)'" },
  { from: /'#F87171'/g, to: "'var(--danger)'" },
  { from: /'#dc2626'/g, to: "'var(--danger)'" },
  // WARNING (amber-400/500 Tailwind)
  { from: /'#f59e0b'/g, to: "'var(--warning)'" },
  { from: /'#FBBF24'/g, to: "'var(--warning)'" },
  { from: /'#fbbf24'/g, to: "'var(--warning)'" },
  // INFO (blue-400 Tailwind)
  { from: /'#60a5fa'/g, to: "'var(--info)'" },

  // Backgrounds tinted (rgba success)
  { from: /'rgba\(52,211,153,0\.05\)'/g, to: "'var(--success-bg)'" },
  { from: /'rgba\(52,211,153,0\.06\)'/g, to: "'var(--success-bg)'" },
  { from: /'rgba\(52,211,153,0\.08\)'/g, to: "'var(--success-bg)'" },
  { from: /'rgba\(52,211,153,0\.10\)'/g, to: "'var(--success-bg)'" },
  { from: /'rgba\(52,211,153,0\.12\)'/g, to: "'var(--success-bg)'" },
  { from: /'rgba\(52,211,153,0\.15\)'/g, to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.18\)'/g, to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.2\)'/g,  to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.22\)'/g, to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.25\)'/g, to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.28\)'/g, to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.30\)'/g, to: "'var(--success-border)'" },
  { from: /'rgba\(52,211,153,0\.3\)'/g,  to: "'var(--success-border)'" },

  // Backgrounds tinted (rgba danger)
  { from: /'rgba\(248,113,113,0\.06\)'/g, to: "'var(--danger-bg)'" },
  { from: /'rgba\(248,113,113,0\.08\)'/g, to: "'var(--danger-bg)'" },
  { from: /'rgba\(248,113,113,0\.10\)'/g, to: "'var(--danger-bg)'" },
  { from: /'rgba\(248,113,113,0\.15\)'/g, to: "'var(--danger-border)'" },
  { from: /'rgba\(248,113,113,0\.18\)'/g, to: "'var(--danger-border)'" },
  { from: /'rgba\(248,113,113,0\.2\)'/g,  to: "'var(--danger-border)'" },
  { from: /'rgba\(248,113,113,0\.22\)'/g, to: "'var(--danger-border)'" },
  { from: /'rgba\(248,113,113,0\.25\)'/g, to: "'var(--danger-border)'" },
  { from: /'rgba\(248,113,113,0\.28\)'/g, to: "'var(--danger-border)'" },

  // Backgrounds tinted (rgba warning)
  { from: /'rgba\(245,158,11,0\.06\)'/g, to: "'var(--warning-bg)'" },
  { from: /'rgba\(245,158,11,0\.08\)'/g, to: "'var(--warning-bg)'" },
  { from: /'rgba\(245,158,11,0\.10\)'/g, to: "'var(--warning-bg)'" },
  { from: /'rgba\(245,158,11,0\.18\)'/g, to: "'var(--warning-border)'" },
  { from: /'rgba\(245,158,11,0\.20\)'/g, to: "'var(--warning-border)'" },
  { from: /'rgba\(245,158,11,0\.22\)'/g, to: "'var(--warning-border)'" },
  { from: /'rgba\(245,158,11,0\.25\)'/g, to: "'var(--warning-border)'" },
  { from: /'rgba\(245,158,11,0\.28\)'/g, to: "'var(--warning-border)'" },

  // Backgrounds tinted (rgba info)
  { from: /'rgba\(96,165,250,0\.06\)'/g, to: "'var(--info-bg)'" },
  { from: /'rgba\(96,165,250,0\.08\)'/g, to: "'var(--info-bg)'" },
  { from: /'rgba\(96,165,250,0\.18\)'/g, to: "'var(--info-border)'" },
  { from: /'rgba\(96,165,250,0\.22\)'/g, to: "'var(--info-border)'" },
  { from: /'rgba\(96,165,250,0\.25\)'/g, to: "'var(--info-border)'" },
]

// Fichiers à exclure : ils utilisent des couleurs Tailwind intentionnelles
// (catégories, badges spécifiques, etc.). On ne touche pas.
const EXCLUDE = [
  // Catégories charges (revenus) avec couleurs distinctes par catégorie
  'app/dashboard/revenus/RevenusView.tsx',
  // Badges Chez Nous : couleurs spécifiques par badge (visionnaire violet, etc.)
  'lib/badges.ts',
  // Couleurs de marque
  'app/globals.css',
]

let totalFiles = 0
let totalReplacements = 0
const filesChanged = []

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', '.next', 'supabase', 'public'].includes(e.name)) continue
      walk(full)
    } else if (e.isFile() && /\.(tsx|ts)$/.test(e.name)) {
      processFile(full)
    }
  }
}

function processFile(file) {
  const rel = path.relative(path.resolve(__dirname, '..'), file)
  if (EXCLUDE.some(ex => rel === ex || rel.endsWith(ex))) return

  let content = fs.readFileSync(file, 'utf8')
  const original = content
  let fileReplacements = 0

  for (const { from, to } of COLOR_MAP) {
    const matches = content.match(from)
    if (matches) {
      content = content.replace(from, to)
      fileReplacements += matches.length
    }
  }

  if (content !== original) {
    totalFiles++
    totalReplacements += fileReplacements
    filesChanged.push({ rel, count: fileReplacements })
    if (!DRY) fs.writeFileSync(file, content)
  }
}

console.log(`\n${DRY ? '🔍 DRY-RUN' : '✅ MIGRATION'} - couleurs Tailwind → tokens sémantiques\n`)

walk(APP)
walk(COMPONENTS)

filesChanged
  .sort((a, b) => b.count - a.count)
  .forEach(f => console.log(`  ${f.count.toString().padStart(4)} occurrences  →  ${f.rel}`))

console.log(`\n${totalReplacements} remplacements dans ${totalFiles} fichiers.`)
if (DRY) console.log('Lance sans --dry-run pour appliquer.')
