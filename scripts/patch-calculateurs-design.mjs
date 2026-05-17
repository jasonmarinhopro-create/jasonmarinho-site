#!/usr/bin/env node
// Patch unifié des 4 pages calculateurs publiques pour :
// 1. Hero design 2026 élégant : gradient 3-stops + halo doré radial
// 2. Bannière "Tu as déjà un compte" : fond blanc franc, plus de transparence
// 3. Fix overlap bannière + calc-wrap (z-index + margin)
// 4. Bannière idempotente (skip si déjà présente)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const TARGETS = [
  'calculateurs/index.html',
  'calculateurs/revenus-lcd/index.html',
  'calculateurs/prix-lcd/index.html',
  'calculateurs/comparer-villes/index.html',
  'calculateurs/revenu-airbnb-paris/index.html',
]

const REPLACEMENTS = [
  // 1. Hero gradient plat → gradient 3-stops + halo radial (pattern services/simulateurs)
  {
    from: /\.hero\{background:linear-gradient\(135deg,var\(--g\) 0%,var\(--gd\) 100%\);color:#fff;padding:clamp\(([^)]+)\)\s+clamp\(([^)]+)\)\s+clamp\(([^)]+)\)\}/g,
    to: '.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp($1) clamp($2) clamp($3);position:relative;overflow:hidden}\n    .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 78% 50%,rgba(255,213,107,.06),transparent 70%);pointer-events:none}\n    .hero::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 20% 100%,rgba(0,76,63,.5),transparent 70%);pointer-events:none}\n    .hero-in,.hero > *{position:relative;z-index:1}',
  },
  // Hero du hub (padding différent)
  {
    from: /\.hero\{background:linear-gradient\(135deg,var\(--g\) 0%,var\(--gd\) 100%\);color:#fff;padding:clamp\(60px,10vw,120px\) clamp\(16px,5vw,60px\) clamp\(40px,6vw,80px\);text-align:center\}/g,
    to: '.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(60px,10vw,120px) clamp(16px,5vw,60px) clamp(40px,6vw,80px);text-align:center;position:relative;overflow:hidden}\n    .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 78% 50%,rgba(255,213,107,.06),transparent 70%);pointer-events:none}\n    .hero::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 20% 100%,rgba(0,76,63,.5),transparent 70%);pointer-events:none}\n    .hero > *{position:relative;z-index:1}',
  },

  // 2. Bannière "Tu as déjà un compte" : fond blanc franc + ombres + z-index élevé + max-width contenu
  // Cible toute la bannière par regex sur sa structure
  {
    from: /<div style="max-width:(\d+)px;margin:-22px auto 0;padding:0 16px;position:relative;z-index:3">\s*<a href="https:\/\/app\.jasonmarinho\.com\/dashboard\/simulateurs" style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:linear-gradient\(135deg,(?:var\(--w\)|#fff) 0%,rgba\(255,213,107,\.10\) 100%\);border:1px solid rgba\(255,213,107,\.40\);border-radius:14px;box-shadow:0 6px 22px rgba\(0,76,63,\.08\);text-decoration:none;color:inherit(?:;transition:transform \.2s,box-shadow \.2s)?"/g,
    to: '<div style="max-width:$1px;margin:-26px auto 28px;padding:0 16px;position:relative;z-index:5"><a href="https://app.jasonmarinho.com/dashboard/simulateurs" style="display:flex;align-items:center;gap:14px;padding:16px 20px;background:#fff;border:1px solid rgba(255,213,107,.50);border-radius:16px;box-shadow:0 14px 40px rgba(0,76,63,.12),0 2px 6px rgba(0,0,0,.04);text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s"',
  },

  // 3. Calc-wrap : enlever le margin-top négatif qui crée l'overlap avec la bannière
  {
    from: /\.calc-wrap\{max-width:(\d+)px;margin:-40px auto 0;padding:0 16px 64px;position:relative;z-index:2\}/g,
    to: '.calc-wrap{max-width:$1px;margin:0 auto;padding:0 16px 64px;position:relative;z-index:2}',
  },

  // 4. Stats strip : pareil, on enlève l'overlap négatif (pour Paris et articles ville)
  {
    from: /\.stats-strip\{display:grid;grid-template-columns:repeat\(4,1fr\);gap:14px;max-width:920px;margin:-32px auto 0;padding:0 16px 0;position:relative;z-index:2\}/g,
    to: '.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:920px;margin:0 auto;padding:0 16px 0;position:relative;z-index:2}',
  },
]

let totalChanged = 0
for (const rel of TARGETS) {
  const fpath = path.join(ROOT, rel)
  if (!fs.existsSync(fpath)) { console.log(`  ⚠ skip (missing): ${rel}`); continue }
  let content = fs.readFileSync(fpath, 'utf8')
  let changes = 0
  for (const r of REPLACEMENTS) {
    const before = content
    content = content.replace(r.from, r.to)
    if (content !== before) changes++
  }
  if (changes > 0) {
    fs.writeFileSync(fpath, content)
    console.log(`  ✓ ${rel} (${changes} patch(es))`)
    totalChanged++
  } else {
    console.log(`  ↻ ${rel} (déjà patché)`)
  }
}
console.log(`\n${totalChanged} fichier(s) mis à jour.`)
