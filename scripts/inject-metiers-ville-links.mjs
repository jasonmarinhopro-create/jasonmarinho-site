#!/usr/bin/env node
// Liens entre les pages pros d'une même ville (31/10/2026, projet « Dépannage
// et maintenance ») : les pages photographe-lcd-<ville> et menage-lcd-<ville>
// ont été générées avant le 3e métier ; leur bloc « Pour aller plus loin »
// (links-row) reçoit une carte vers depannage-lcd-<ville>. Idempotent
// (marqueurs METIER-LINK:START/END) ; à relancer après toute régénération des
// pages de ville, comme les autres injections (docs/claude/villes.md).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villeLabel } from './lib/inject-ville-pros.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const START = '<!-- METIER-LINK:START -->'
const END = '<!-- METIER-LINK:END -->'
const aVille = v => /^les\s/i.test(v) ? `aux ${v.slice(4)}` : /^le\s/i.test(v) ? `au ${v.slice(3)}` : `à ${v}`
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

let n = 0
for (const dir of fs.readdirSync(ROOT)) {
  const m = /^(photographe|menage)-lcd-([a-z0-9-]+)$/.exec(dir)
  if (!m) continue
  const slug = m[2]
  const file = path.join(ROOT, dir, 'index.html')
  if (!fs.existsSync(file) || !fs.existsSync(path.join(ROOT, `depannage-lcd-${slug}`, 'index.html'))) continue
  let html = fs.readFileSync(file, 'utf8')
  const card = `${START}<a class="link-card" href="/depannage-lcd-${slug}"><span class="lc-t">Autre prestataire</span><span class="lc-h">Plombier, électricien et dépannage ${esc(aVille(villeLabel(slug)))}</span><span class="lc-a">Voir le guide <i class="ph-bold ph-arrow-right"></i></span></a>${END}`
  if (html.includes(START)) html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), card)
  else {
    const row = html.indexOf('<div class="links-row">')
    if (row < 0) { console.warn(`[metiers-ville-links] links-row introuvable : ${dir}`); continue }
    // Avant la carte de l'annuaire du métier (la dernière de la rangée)
    const annuaire = html.indexOf('<a class="link-card" href="/annuaires/', row)
    const at = annuaire > 0 ? annuaire : row + '<div class="links-row">'.length
    html = html.slice(0, at) + card + html.slice(at)
  }
  fs.writeFileSync(file, html, 'utf8')
  n++
}
console.log(`[metiers-ville-links] ${n} page(s)`)
