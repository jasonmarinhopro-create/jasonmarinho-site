#!/usr/bin/env node
// Fil d'Ariane des pages de ville, visible et balisé, depuis une seule
// fonction (scripts/lib/fil-ariane.mjs) : étape 5 de la feuille de route.
// Idempotent : remplace le fil existant de chaque page (pages pros : div ou
// nav .brd ; guides hôte : nav.breadcrumb ; études de revenus :
// .breadcrumb.lt) et le bloc JSON-LD BreadcrumbList, sans rien toucher d'autre.
// Lancé par creer-ville.mjs avec les autres injections.
//   node scripts/inject-fil-ariane.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villesRegistre } from './lib/registre-geo.mjs'
import { cheminVille, jsonLd, visible } from './lib/fil-ariane.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STYLE = { photographe: 'pros', menage: 'pros', depannage: 'pros', hote: 'guide', revenus: 'calcul' }
const VISIBLE_RE = {
  pros: /<(div|nav) class="brd"[^>]*>[\s\S]*?<\/\1>/,
  guide: /<nav class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/,
  calcul: /<(div|nav) class="breadcrumb lt"[^>]*>[\s\S]*?<\/\1>/,
}

/** Remplace le contenu du bloc JSON-LD qui est une BreadcrumbList (attributs gardés) */
function replaceJsonLd(html, json) {
  let found = false
  const out = html.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (m, open, body, close) => {
    if (found) return m
    let data
    try { data = JSON.parse(body) } catch { return m }
    if (data?.['@type'] !== 'BreadcrumbList') return m
    found = true
    return `${open}\n${json}\n${close}`
  })
  return found ? out : null
}

const check = process.argv.includes('--check')
let changed = 0, same = 0
const problems = []
for (const v of villesRegistre()) {
  for (const kind of Object.keys(v.pages)) {
    const url = v.pages[kind]
    const file = path.join(ROOT, url.slice(1), 'index.html')
    if (!fs.existsSync(file)) { problems.push(`${url} : page absente`); continue }
    const chemin = cheminVille(kind, v.slug)
    const html = fs.readFileSync(file, 'utf8')
    const style = STYLE[kind]
    if (!VISIBLE_RE[style].test(html)) { problems.push(`${url} : fil visible introuvable`); continue }
    let next = html.replace(VISIBLE_RE[style], visible(chemin, style))
    next = replaceJsonLd(next, jsonLd(chemin))
    if (next === null) { problems.push(`${url} : bloc BreadcrumbList introuvable`); continue }
    if (next === html) { same++; continue }
    changed++
    if (!check) fs.writeFileSync(file, next)
  }
}
console.log(`Fil d'Ariane : ${changed} page(s) ${check ? 'à mettre à jour' : 'mises à jour'}, ${same} déjà à jour`)
for (const p of problems) console.log(`::error::${p}`)
if (problems.length || (check && changed)) process.exitCode = 1
