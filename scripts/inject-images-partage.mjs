#!/usr/bin/env node
// Branche chaque page sur son image de partage (og:image, twitter:image),
// créée par scripts/build-images-partage.mjs dans img/partage (24/11/2026).
// Remplace l'ancienne capture couverture-jason.webp : image propre à la page
// si elle existe, sinon image de la famille (fiches des pros créées au build),
// sinon celle de l'accueil. Les autres images (photo d'article, de ville, de
// fiche d'exemple) ne sont pas touchées. Idempotent, lancé au build après les
// générateurs.   node scripts/inject-images-partage.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cle, repli, DOSSIER, ANCIENNE } from './lib/images-partage.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://jasonmarinho.com'
const check = process.argv.includes('--check')
const IGNORE = new Set(['node_modules', 'jason-app', 'img', 'fonts', 'scripts', 'data', 'docs', 'api', '.git', '.github', '.vercel'])

const fichiers = []
const walk = d => {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    if (!d && IGNORE.has(e.name)) continue
    const rel = d ? `${d}/${e.name}` : e.name
    if (e.isDirectory()) walk(rel)
    else if (e.name.endsWith('.html')) fichiers.push(rel)
  }
}
walk('')

const existe = k => fs.existsSync(path.join(ROOT, DOSSIER, `${k}.jpg`))
const ancienne = `${SITE}/${ANCIENNE}`
let n = 0, propres = 0, replis = 0
for (const f of fichiers) {
  const file = path.join(ROOT, f)
  const html = fs.readFileSync(file, 'utf8')
  if (!html.includes(ancienne) && !html.includes(`/${DOSSIER}/`)) continue
  const k = existe(cle(f)) ? cle(f) : repli(f)
  if (!existe(k)) continue
  const url = `${SITE}/${DOSSIER}/${k}.jpg`
  let out = html
    .replace(/(<meta property="og:image" content=")[^"]*(couverture-jason\.webp|\/img\/partage\/[^"]*\.jpg)(")/g, `$1${url}$3`)
    .replace(/(<meta (?:name|property)="twitter:image" content=")[^"]*(couverture-jason\.webp|\/img\/partage\/[^"]*\.jpg)(")/g, `$1${url}$3`)
    // Image des données structurées (Article, WebPage) : la même que le partage
    .replace(/("image":\s*")https:\/\/jasonmarinho\.com\/(?:couverture-jason\.webp|img\/partage\/[^"]*\.jpg)(")/g, `$1${url}$2`)
  // Taille déclarée (Facebook l'utilise pour afficher la grande image dès le premier partage)
  if (out.includes(`content="${url}"`)) {
    out = out.replace(/<meta property="og:image:width" content="\d+">/g, '<meta property="og:image:width" content="1200">')
      .replace(/<meta property="og:image:height" content="\d+">/g, '<meta property="og:image:height" content="630">')
    if (!/<meta property="og:image:width"/.test(out)) out = out.replace(`<meta property="og:image" content="${url}">`, `<meta property="og:image" content="${url}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">`)
  }
  if (out !== html) {
    n++
    if (!check) fs.writeFileSync(file, out)
  }
  if (out.includes(`content="${url}"`)) k === cle(f) ? propres++ : replis++
}
console.log(`Images de partage : ${propres} page(s) avec leur image, ${replis} avec l'image de leur famille, ${n} modifiée(s)${check ? ' (vérification)' : ''}`)
if (check && n) process.exit(1)
