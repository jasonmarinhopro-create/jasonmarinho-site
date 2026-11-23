#!/usr/bin/env node
// Aperçu « La première leçon, en avant-première » des pages publiques
// /services/formations/<slug> (23/11/2026). Avant : un ancien copier-coller
// aplati de la leçon, avec les bandeaux « --- MODULE 1 · LEÇON 1 ──── » et des
// chiffres retirés depuis. Désormais tiré de la leçon 1 actuelle de l'app
// (jason-app/app/dashboard/formations/<slug>/content.ts) : titre de la leçon,
// début du texte nettoyé (titres, gras, puces), suite floutée.
//   node scripts/build-apercus-formations.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const APP = path.join(ROOT, 'jason-app/app/dashboard/formations')
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Titre et texte de la première leçon (premier `content:` du fichier) */
export function premiereLecon(src) {
  const i = src.search(/\n\s*content:\s*`/)
  if (i < 0) return null
  const avant = src.slice(0, i)
  const titre = [...avant.matchAll(/\n\s*title:\s*(['`"])((?:\\.|(?!\1).)*)\1/g)].pop()?.[2]?.replace(/\\'/g, "'")
  const debut = src.indexOf('`', i) + 1
  let fin = debut
  while (fin < src.length && !(src[fin] === '`' && src[fin - 1] !== '\\')) fin++
  return { titre, texte: src.slice(debut, fin).replace(/\\`/g, '`') }
}

/** Texte de leçon (Markdown simple) en phrases lisibles */
export function nettoyer(md) {
  // Regroupe chaque intertitre, puce ou paragraphe avec ses lignes de suite
  // (texte coupé à la main dans les leçons), puis ponctue intertitres et puces.
  const unites = []
  for (const brut of md.split('\n')) {
    const l = brut.trim()
    if (!l || /^[-─━=_*]{3,}$/.test(l) || /^(MODULE|LEÇON)\b/i.test(l) || /^\|/.test(l)) { unites.push(null); continue }
    const bloc = /^(#{1,4}\s|>\s?|→|->|[-•✅❌]\s|\d+\.\s)/.test(l)
    const dernier = unites[unites.length - 1]
    if (!bloc && dernier && !dernier.titre) { dernier.t += ' ' + l; continue }
    unites.push({ t: l, bloc, titre: /^#{1,4}\s/.test(l) })
  }
  return unites.filter(Boolean).map(u => {
    let t = u.t.replace(/^#{1,4}\s*/, '').replace(/^>\s*/, '').replace(/^(→|->|[-•✅❌]|\d+\.)\s*/, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/─+/g, '').replace(/\s+/g, ' ').trim()
    return u.bloc && t && !/[.:;,!?…»"]$/.test(t) ? t + '.' : t
  }).filter(Boolean).join(' ').replace(/ ([:;?!])/g, ' $1')
}

function couper(t, n) {
  if (t.length <= n) return [t, '']
  const i = t.lastIndexOf(' ', n)
  return [t.slice(0, i) + '…', t.slice(i + 1)]
}

let ecrits = 0
const ecarts = []
for (const slug of fs.readdirSync(path.join(ROOT, 'services/formations'))) {
  const page = path.join(ROOT, 'services/formations', slug, 'index.html')
  const src = path.join(APP, slug, 'content.ts')
  if (!fs.existsSync(page) || !fs.existsSync(src)) continue
  let html = fs.readFileSync(page, 'utf8')
  if (!html.includes('class="preview-body"')) continue
  const l = premiereLecon(fs.readFileSync(src, 'utf8'))
  if (!l) continue
  const [vu, suite] = couper(nettoyer(l.texte), 520)
  const flou = couper(suite, 220)[0]
  const avant = html
  html = html.replace(/(<div class="preview-lesson-title">)[^<]*(<\/div>)/, `$1${esc(l.titre)}$2`)
  html = html.replace(/(<div class="preview-body"[^>]*>\s*)<p style="margin-bottom:16px">[\s\S]*?<\/p>\s*<p style="filter:blur\(5px\)[^"]*"[^>]*>[\s\S]*?<\/p>/,
    (all, debut) => `${debut}<p style="margin-bottom:16px">${esc(vu)}</p>\n          <p style="filter:blur(5px);user-select:none;pointer-events:none;color:var(--td)">${esc(flou || '.')}</p>`)
  if (html === avant) continue
  if (CHECK) ecarts.push(slug)
  else { fs.writeFileSync(page, html); ecrits++ }
}
if (CHECK) {
  if (ecarts.length) { console.error(`Aperçus à régénérer : ${ecarts.join(', ')}`); process.exit(1) }
  console.log('Aperçus des formations : à jour')
} else console.log(`Aperçus des formations : ${ecrits} pages écrites`)
