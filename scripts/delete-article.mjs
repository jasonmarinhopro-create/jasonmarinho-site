#!/usr/bin/env node
// Supprime proprement un article du blog (HTML + entrée articles-data + template).
//
// Usage : node scripts/delete-article.mjs <slug>
//   ou : npm run blog:delete -- <slug>

import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/delete-article.mjs <slug>')
  process.exit(1)
}

let removed = false

// 1) Dossier HTML
const dir = resolve(ROOT, 'blog', slug)
if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true })
  console.log(`✓ blog/${slug}/ supprimé`)
  removed = true
}

// 2) Template (si présent)
const tpl = resolve(ROOT, 'scripts/articles', `${slug}.mjs`)
if (existsSync(tpl)) {
  rmSync(tpl, { force: true })
  console.log(`✓ scripts/articles/${slug}.mjs supprimé`)
  removed = true
}

// 3) Entrée articles-data.mjs
const dataPath = resolve(ROOT, 'blog/articles-data.mjs')
let src = readFileSync(dataPath, 'utf8')
const escSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const lineRegex = new RegExp(`^\\s*\\{\\s*slug:\\s*'${escSlug}'.*\\n`, 'm')
if (lineRegex.test(src)) {
  src = src.replace(lineRegex, '')
  writeFileSync(dataPath, src, 'utf8')
  console.log(`✓ Entrée "${slug}" retirée de articles-data.mjs`)
  removed = true
}

if (!removed) {
  console.error(`⚠️  Aucune trace de "${slug}" trouvée. Rien à supprimer.`)
  process.exit(1)
}

// 4) Régénération
const r = spawnSync('node', [resolve(__dirname, 'rebuild-blog.mjs')], {
  stdio: 'inherit',
  cwd: ROOT,
})
if (r.status !== 0) {
  console.error('❌ rebuild-blog.mjs a échoué')
  process.exit(r.status || 1)
}

console.log(`\n🗑️  Article "${slug}" entièrement supprimé.`)
