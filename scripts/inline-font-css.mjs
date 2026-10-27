// Feuilles de polices intégrées aux pages au déploiement (28/10/2026,
// PageSpeed mobile : « Requêtes de blocage du rendu, 430 ms »). La feuille des
// polices du texte (/fonts/site-fonts.css, 1,6 Ko) est écrite dans la page
// (<style data-font="site-fonts">) : une requête de moins avant l'affichage.
// Les 3 feuilles des icônes Phosphor restent en <link> : essai local du
// 28/10/2026 (Lighthouse, 4 passages), les intégrer faisait partir les polices
// d'icônes plus tôt, en concurrence avec celle du titre (LCP 3,0-3,3 s au lieu
// de 2,9-3,0 s). Les charger plus tard décalerait la page (icônes sans largeur).
// nav.js reconnaît aussi ces <style>.
//
// Tourne sur Vercel après build-phosphor-subset.mjs (qui fixe les ?v=), avant
// minify-assets.mjs. Hors Vercel, ne fait rien sauf avec --force : les pages
// du dépôt gardent leurs <link>. En cas d'échec, la page garde son <link>.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const force = process.argv.includes('--force')
if (!process.env.VERCEL && !force) {
  console.log('inline-font-css : hors Vercel, rien à faire (--force pour essayer).')
  process.exit(0)
}

const ROOT = new URL('..', import.meta.url).pathname
const SKIP = new Set(['node_modules', 'jason-app', '.git', '.vercel', 'scripts', 'data', 'docs', 'fonts'])
const LINK = /<link\b[^>]*href="\/fonts\/(site-fonts)\.css(?:\?v=[A-Za-z0-9]+)?"[^>]*>/g

const cache = new Map()
async function css(name) {
  if (!cache.has(name)) {
    try {
      const txt = (await readFile(join(ROOT, 'fonts', `${name}.css`), 'utf8'))
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '').replace(/\s{2,}/g, ' ')
      cache.set(name, txt.includes('</') ? null : txt)
    } catch { cache.set(name, null) }
  }
  return cache.get(name)
}

async function* pages(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* pages(p)
    else if (e.name.endsWith('.html')) yield p
  }
}

let n = 0
for await (const file of pages(ROOT)) {
  const html = await readFile(file, 'utf8')
  const names = [...html.matchAll(LINK)].map(m => m[1])
  if (!names.length) continue
  const bodies = Object.fromEntries(await Promise.all(names.map(async k => [k, await css(k)])))
  const seen = new Set()
  const out = html.replace(LINK, (m, name) => {
    if (!bodies[name]) return m
    if (seen.has(name)) return ''
    seen.add(name)
    return `<style data-font="${name}">${bodies[name]}</style>`
  })
  if (out !== html) { await writeFile(file, out); n++ }
}
console.log(`inline-font-css : feuilles de polices intégrées dans ${n} page(s)`)
