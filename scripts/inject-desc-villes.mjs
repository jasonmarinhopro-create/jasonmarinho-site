#!/usr/bin/env node
// Descriptions complètes des pages pros de ville (audit SEO du 18/11/2026) :
// photographe-lcd-, menage-lcd-, depannage-lcd-. Remplace la balise meta
// description et og:description par celles de scripts/lib/desc-pros-villes.mjs,
// sans régénérer les pages (les injections restent en place).
//   node scripts/inject-desc-villes.mjs          écrit
//   node scripts/inject-desc-villes.mjs --check  échoue si une page diffère
// Idempotent. Lancé par creer-ville.mjs ; à relancer après
// build-pages-pros-villes.mjs (qui produit déjà ces descriptions).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { descPhoto, descMenage, descDepannage } from './lib/desc-pros-villes.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')

function loadCities() {
  const src = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const open = src.indexOf('[', src.indexOf('var CITIES = ['))
  return new Function('return ' + src.slice(open, src.indexOf('];', open) + 1))()
}
const prepo = n => /^Le\s/i.test(n) ? 'au ' + n.replace(/^Le\s/i, '') : /^Les\s/i.test(n) ? 'aux ' + n.replace(/^Les\s/i, '') : 'à ' + n
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const METIERS = [['photographe-lcd-', descPhoto], ['menage-lcd-', descMenage], ['depannage-lcd-', descDepannage]]
let ecrites = 0, identiques = 0
const ecarts = []
for (const c of loadCities()) {
  const adr = c.adr.match(/(\d+)\s*-\s*(\d+)/)
  const ann = c.ann.match(/~?\s*([\d  ]+)\s*annonces/)
  if (!adr || !ann) throw new Error(`Données illisibles pour ${c.slug}`)
  const v = { pre: prepo(c.name), adrMin: +adr[1], adrMax: +adr[2], annonces: ann[1].trim() }
  for (const [pre, fn] of METIERS) {
    const file = path.join(ROOT, pre + c.slug, 'index.html')
    if (!fs.existsSync(file)) continue
    const d = esc(fn(v))
    const html = fs.readFileSync(file, 'utf8')
    if (!/<meta name="description" content="[^"]*">/.test(html)) throw new Error(`Pas de description : ${pre}${c.slug}`)
    const out = html
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${d}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${d}">`)
    if (out === html) { identiques++; continue }
    if (CHECK) { ecarts.push(pre + c.slug); continue }
    fs.writeFileSync(file, out)
    ecrites++
  }
}
if (CHECK) {
  if (ecarts.length) { console.error(`Descriptions à mettre à jour (${ecarts.length}) : ${ecarts.slice(0, 10).join(', ')}`); process.exit(1) }
  console.log(`Descriptions des pages pros : ${identiques} à jour`)
} else console.log(`Descriptions des pages pros : ${ecrites} écrites, ${identiques} déjà à jour`)
