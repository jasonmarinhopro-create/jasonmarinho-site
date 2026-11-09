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
  if (args.has('--check')) {
    if (src !== next) { console.log('::error::footer.js pas à jour : lancer node scripts/build-footer.mjs'); process.exit(1) }
    console.log('Pied de page : footer.js à jour')
  } else if (src !== next) {
    fs.writeFileSync(FOOTER_JS, next)
    console.log('Pied de page : footer.js réécrit')
  }
  if (args.has('--inject')) {
    if (!process.env.VERCEL && !args.has('--force')) {
      console.log('Pied de page : hors Vercel, pages non modifiées (--force pour essayer)')
    } else {
      console.log(`Pied de page : écrit dans ${injectAll()} pages`)
    }
  }
}
