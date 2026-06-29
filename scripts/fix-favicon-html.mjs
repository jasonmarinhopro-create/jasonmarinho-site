// One-shot : ajoute <link rel="shortcut icon" href="/favicon.ico"> en
// premier lien icon dans le <head> de toutes les pages HTML. Pourquoi :
// Google cherche prioritairement cette balise pour les favicons dans les
// résultats de recherche, et notre HTML actuel n'a que rel="icon" avec
// un cache-buster ?v= que Google ignore.
//
// Idempotent : skip si la ligne est déjà présente.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// La ligne canonique qu'on cherche pour repérer le bloc icons existant
const ANCHOR = '<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">'
const NEW_LINE = '<link rel="shortcut icon" href="/favicon.ico">'

// Dossiers à exclure
const IGNORE = new Set(['node_modules', '.git', '.next', 'jason-app', 'fonts'])

let processed = 0
let updated = 0
let alreadyOk = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || IGNORE.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.html')) processFile(full)
  }
}

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8')
  if (!src.includes(ANCHOR)) return
  processed++
  if (src.includes(NEW_LINE)) { alreadyOk++; return }
  // Insère NEW_LINE juste avant la ligne ANCHOR (le shortcut icon doit
  // arriver en premier pour les crawlers legacy/Google).
  const out = src.replace(ANCHOR, `${NEW_LINE}\n${ANCHOR}`)
  fs.writeFileSync(file, out, 'utf8')
  updated++
}

walk(ROOT)
console.log(`processed=${processed} updated=${updated} alreadyOk=${alreadyOk}`)
