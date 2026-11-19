#!/usr/bin/env node
// Dates <lastmod> de sitemap.xml = dernier vrai changement de chaque page
// (audit SEO du 18/11/2026). Avant : date de création, jamais remise à jour
// (le guide d'Arcachon disait mai 2026 alors que sa taxe a changé le 16/11) ;
// Google ignore une lastmod qu'il juge non fiable.
// « Vrai changement » : le texte de la page (titre, description, texte visible)
// change. Un simple numéro de version d'une feuille de style ou d'un script
// (?v=…), le chargement des polices ou un style ne comptent pas.
// La date vient de l'historique git (il faut un clone complet : en clone
// partiel, `git fetch --unshallow`). Une page modifiée et pas encore commitée
// prend la date du jour.
//   node scripts/sitemap-lastmod.mjs          écrit sitemap.xml
//   node scripts/sitemap-lastmod.mjs --dry    affiche les changements
// À lancer avant un push qui modifie des pages (injections, nouvelle ville).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry')
const SITE = 'https://jasonmarinho.com'
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })

if (git('rev-parse', '--is-shallow-repository').trim() === 'true') {
  console.error('Clone partiel : lancer `git fetch --unshallow` avant (sinon les dates seraient fausses).')
  process.exit(1)
}

// Texte qui compte pour un lecteur ou pour Google
export function texte(html) {
  const meta = [...html.matchAll(/<(?:title>([^<]*)<\/title|meta name="description" content="([^"]*)")/g)].map(m => m[1] ?? m[2])
  const corps = html
    .replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return meta.join('|') + '|' + corps
}

function fichier(loc) {
  const p = loc.replace(SITE, '').replace(/^\/+/, '')
  for (const f of [p ? `${p}/index.html` : 'index.html', `${p}.html`]) if (fs.existsSync(path.join(ROOT, f))) return f
  return null
}

function dateDuChangement(f) {
  const actuel = texte(fs.readFileSync(path.join(ROOT, f), 'utf8'))
  const versions = git('log', '-n', '60', '--format=%H %cd', '--date=format-local:%Y-%m-%d', '--', f).trim().split('\n').filter(Boolean).map(l => l.split(' '))
  if (!versions.length) return today
  let date = null
  for (const [h, d] of versions) {
    let t
    try { t = texte(git('show', `${h}:${f}`)) } catch { break }
    if (t !== actuel) break
    date = d
  }
  return date ?? today // texte actuel absent de l'historique : modifié, pas encore commité
}

const src = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')
let changes = 0, sansFichier = 0
const out = src.replace(/(<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>)([^<]+)(<\/lastmod>)/g, (all, a, loc, old, b) => {
  const f = fichier(loc.trim())
  if (!f) { sansFichier++; return all }
  const d = dateDuChangement(f)
  if (d === old) return all
  changes++
  if (DRY) console.log(`${loc.replace(SITE, '') || '/'} : ${old} -> ${d}`)
  return a + d + b
})
if (!DRY && out !== src) fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), out)
console.log(`sitemap.xml : ${changes} date(s) ${DRY ? 'à changer' : 'mises à jour'}${sansFichier ? `, ${sansFichier} adresse(s) sans fichier` : ''}`)
