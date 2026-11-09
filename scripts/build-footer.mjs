#!/usr/bin/env node
// Pied de page (étape 4 de la feuille de route, 09/11/2026).
//
//   node scripts/build-footer.mjs            → réécrit le HTML de secours dans footer.js
//   node scripts/build-footer.mjs --check    → échoue si footer.js n'est pas à jour
//   node scripts/build-footer.mjs --inject   → écrit aussi le pied de page dans chaque
//     page qui charge footer.js (avant </body>, marqueurs FOOTER:START/END), avec
//     son style, l'onglet de la page ouvert et la ville en cours mise en avant.
//     Lancé par scripts/build-site.sh au déploiement Vercel ; hors Vercel, ne
//     touche les pages qu'avec --force (pour ne pas modifier 650 fichiers du dépôt).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { footerHtml, footerCss, PANEL_RULES } from './lib/footer-html.mjs'
import { villesParRegionHtml } from './lib/villes-hub.mjs'
import { loadCities } from './verifier-villes.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FOOTER_JS = path.join(ROOT, 'footer.js')
const SKIP = new Set(['node_modules', 'jason-app', '.git', '.vercel', 'scripts', 'data', 'docs', 'fonts', 'api'])
const args = new Set(process.argv.slice(2))

function syncFooterJs() {
  const src = fs.readFileSync(FOOTER_JS, 'utf8')
  const next = src
    .replace(/\/\*FOOTER_HTML:START\*\/[\s\S]*?\/\*FOOTER_HTML:END\*\//, () => `/*FOOTER_HTML:START*/${JSON.stringify(footerHtml())}/*FOOTER_HTML:END*/`)
    .replace(/\/\*FOOTER_PANELS:START\*\/[\s\S]*?\/\*FOOTER_PANELS:END\*\//, () => `/*FOOTER_PANELS:START*/${JSON.stringify(PANEL_RULES)}/*FOOTER_PANELS:END*/`)
  if (!next.includes('/*FOOTER_HTML:START*/')) throw new Error('Marqueurs FOOTER_HTML absents de footer.js')
  return { src, next }
}

function* pages(dir = ROOT) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || (dir === ROOT && SKIP.has(e.name))) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* pages(p)
    else if (e.name.endsWith('.html')) yield p
  }
}

const urlOf = file => {
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  return rel === 'index.html' ? '/' : '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')
}

// ── Pages mères (09/11/2026) : le pied de page ne montre plus qu'une sélection
// de villes ; ces pages portent la liste complète, écrite dans le HTML.
const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Cartes des guides hôte de /villes (avant : remplies par footer.js, absentes du HTML) */
function villesGridHtml() {
  return loadCities().filter(c => !c.prosOnly).map(c => '<a class="city-card" href="/devenir-hote-airbnb-' + c.slug + '">'
    + '<div class="city-card-body">'
    + '<span class="city-tag"><i class="ph ph-map-pin"></i> ' + escH(c.name) + '</span>'
    + '<div class="city-name">Devenir hôte <em>à ' + escH(c.name) + '</em></div>'
    + '<p class="city-desc">' + escH(c.desc) + '</p>'
    + '<div class="city-stats">'
    + '<span class="city-stat"><i class="ph ph-currency-eur"></i> ' + escH(c.adr) + '</span>'
    + '<span class="city-stat"><i class="ph ph-chart-bar"></i> ' + escH(c.occ) + '</span>'
    + '<span class="city-stat"><i class="ph ph-buildings"></i> ' + escH(c.ann) + '</span>'
    + '</div>'
    + '<div class="city-cta">Lire le guide <i class="ph ph-arrow-right"></i></div>'
    + '</div></a>').join('')
}

/** Toutes les études de revenus de /calculateurs, par pays */
function etudesHtml() {
  return '<div style="margin-top:44px">'
    + '<h3 style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:400;color:var(--td);margin:0 0 6px">Toutes les études de revenus</h3>'
    + '<p style="font-size:14px;font-weight:300;color:var(--tm);margin:0 0 18px">Rangées par pays, chaque ville a son étude détaillée.</p>'
    + '<style>.vh-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px 32px}.vh-group{min-width:0}.vh-group-wide{grid-column:1/-1}.vh-group-t{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--tl);margin:0 0 9px}.vh-chips{display:flex;flex-wrap:wrap;gap:7px}.vh-chips a{font-size:12.5px;padding:6px 12px;border-radius:8px;background:rgba(0,76,63,.05);color:var(--tm);text-decoration:none;border:1px solid transparent;white-space:nowrap}.vh-chips a:hover{color:var(--g);border-color:rgba(0,76,63,.2)}</style>'
    + `<div class="vh-groups">${villesParRegionHtml('revenus', { parPays: true, chipsClass: 'vh-chips' })}</div>`
    + '</div>'
}

const HUBS = [
  { file: 'villes/index.html', re: /(<div class="cities-grid" id="cities-grid">)[\s\S]*?(<\/div>\s*\n\s*<div class="no-results")/, html: () => villesGridHtml() },
  { file: 'calculateurs/index.html', marker: 'ETUDES', after: /(Études par ville<\/div>[\s\S]*?<\/a>\n  <\/div>\n)/, html: () => etudesHtml() },
]

export function syncHubs() {
  const changes = []
  for (const h of HUBS) {
    const file = path.join(ROOT, h.file)
    const src = fs.readFileSync(file, 'utf8')
    let next
    if (h.re) {
      if (!h.re.test(src)) throw new Error(`${h.file} : emplacement de la grille introuvable`)
      next = src.replace(h.re, (m, a, b) => `${a}${h.html()}${b}`)
    } else {
      const block = `<!-- ${h.marker}:START -->\n${h.html()}\n<!-- ${h.marker}:END -->\n`
      const re = new RegExp(`<!-- ${h.marker}:START -->[\\s\\S]*?<!-- ${h.marker}:END -->\\n?`)
      if (re.test(src)) next = src.replace(re, block)
      else {
        if (!h.after.test(src)) throw new Error(`${h.file} : emplacement introuvable`)
        next = src.replace(h.after, (m, a) => a + block)
      }
    }
    if (next !== src) changes.push({ file, next })
  }
  return changes
}

export function injectAll() {
  const css = footerCss()
  let n = 0
  for (const file of pages()) {
    const html = fs.readFileSync(file, 'utf8')
    if (!/src="\/footer\.js/.test(html)) continue
    const clean = html.replace(/<!-- FOOTER:START -->[\s\S]*?<!-- FOOTER:END -->\n?/, '')
    const at = clean.lastIndexOf('</body>')
    if (at < 0) continue
    const block = `<!-- FOOTER:START -->\n<style id="footer-styles">${css}</style>\n${footerHtml({ path: urlOf(file), statique: true })}\n<!-- FOOTER:END -->\n`
    fs.writeFileSync(file, clean.slice(0, at) + block + clean.slice(at))
    n++
  }
  return n
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { src, next } = syncFooterJs()
  const hubs = syncHubs()
  if (args.has('--check')) {
    if (src !== next) { console.log('::error::footer.js pas à jour : lancer node scripts/build-footer.mjs'); process.exit(1) }
    for (const h of hubs) { console.log(`::error::${path.relative(ROOT, h.file)} pas à jour : lancer node scripts/build-footer.mjs`); process.exitCode = 1 }
    if (!process.exitCode) console.log('Pied de page et pages mères à jour')
  } else {
    if (src !== next) { fs.writeFileSync(FOOTER_JS, next); console.log('Pied de page : footer.js réécrit') }
    for (const h of hubs) { fs.writeFileSync(h.file, h.next); console.log(`Page mère réécrite : ${path.relative(ROOT, h.file)}`) }
  }
  if (args.has('--inject')) {
    if (!process.env.VERCEL && !args.has('--force')) {
      console.log('Pied de page : hors Vercel, pages non modifiées (--force pour essayer)')
    } else {
      console.log(`Pied de page : écrit dans ${injectAll()} pages`)
    }
  }
}
