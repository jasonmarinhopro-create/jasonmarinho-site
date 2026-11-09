#!/usr/bin/env node
// Section « Le tourisme en chiffres » (Insee) sur les pages de ville (10/11/2026,
// Jason : « ajoute les chiffres Insee aux pages de ville ») : photographe, ménage,
// dépannage, devenir hôte et étude de revenus des villes françaises. Placée juste
// avant les questions fréquentes. Idempotent (marqueurs CHIFFRES-VILLE).
//   node scripts/inject-chiffres-villes.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villesRegistre } from './lib/registre-geo.mjs'
import { tourismeSection } from './lib/communes-donnees.mjs'
import { aCommune } from './lib/annuaire-region.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const RE = /<!-- CHIFFRES-VILLE:START -->[\s\S]*?<!-- CHIFFRES-VILLE:END -->\n?/
// Styles autonomes (les gabarits de ville n'ont pas ceux des pages de zone)
const CSS = '.cv-wrap{max-width:1100px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(16px,5vw,48px)}'
  + '.cv-wrap .zs{max-width:none;margin:0;padding:0}.cv-wrap h2{font-family:Fraunces,serif;font-weight:400;font-size:clamp(22px,2.6vw,30px);color:var(--td,#0F1A0D);margin:0 0 6px;line-height:1.2}.cv-wrap h2 em{color:var(--g,#004C3F);font-style:italic}'
  + '.cv-wrap .zs>p{color:var(--tm,#4a5a4f);font-size:14.5px;line-height:1.6;margin:0 0 16px;max-width:760px}'
  + '.cv-wrap .zs-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.cv-wrap .zs-card{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:14px;padding:16px 18px}'
  + '.cv-wrap .zs-card h3{font-size:20px;font-weight:700;color:var(--td,#0F1A0D);margin:0 0 6px;display:flex;align-items:center;gap:8px}.cv-wrap .zs-card h3 i{color:var(--g,#004C3F)}'
  + '.cv-wrap .zs-src{font-size:12px;color:var(--tl,#7a877e);margin:12px 0 0;line-height:1.6}.cv-wrap .zs-src a{color:inherit}'

let n = 0, pages = 0
for (const v of villesRegistre().filter(x => x.pays === 'FR' && x.insee)) {
  const html = tourismeSection(aCommune(v.nom), 'COM', v.insee)
  for (const url of Object.values(v.pages)) {
    const file = path.join(ROOT, url.slice(1), 'index.html')
    if (!fs.existsSync(file)) continue
    pages++
    const src = fs.readFileSync(file, 'utf8')
    const clean = src.replace(RE, '')
    // La <section> qui porte « Questions fréquentes »
    const h = clean.search(/<h2[^>]*>\s*Questions fréquentes/)
    // sinon l'élément id="faq" (guides hôte récents)
    const f = clean.search(/<[a-z]+[^>]*\sid="faq"/)
    const at = h >= 0 ? clean.lastIndexOf('<section', h) : f
    if (!html || at < 0) { if (clean !== src && !check) fs.writeFileSync(file, clean); continue }
    const next = clean.slice(0, at) + `<!-- CHIFFRES-VILLE:START --><div class="cv-wrap">${html}</div><style>${CSS}</style><!-- CHIFFRES-VILLE:END -->\n` + clean.slice(at)
    if (next === src) continue
    n++
    if (!check) fs.writeFileSync(file, next)
  }
}
console.log(`Chiffres Insee des villes : ${n} page(s) ${check ? 'à mettre à jour' : 'mises à jour'} sur ${pages}`)
if (check && n) process.exitCode = 1
