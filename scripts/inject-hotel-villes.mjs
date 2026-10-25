// Hôtels et résidences dans les pages photographe-lcd-<ville> (25/10/2026).
// Jason : « un hôtel, c'est aussi de la location courte durée, il faut en
// parler dans les pages des villes sans tout recréer ». Plutôt que des pages
// « photographe hôtel <ville> » en série (contenu répété : pages satellites
// que Google déclasse), une section courte dans chaque page de ville, avec un
// fait local quand on l'a : la taxe de séjour d'un établissement 3 étoiles,
// même catégorie pour les hôtels, résidences et meublés de tourisme
// (article L2333-30 du CGCT), lue dans le relevé DGFiP de la commune
// (scripts/data/taxe-sejour-officielle.json, inject-taxe-villes).
// Placée avant la FAQ. Idempotent (marqueurs HOTEL:START/END) :
//   node scripts/inject-hotel-villes.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { officialGrid, fmtTotal, TAXE_SOURCE_URL } from './lib/taxe-officielle.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const START = '<!-- HOTEL:START -->'
const END = '<!-- HOTEL:END -->'
const FAQ = /\n<section class="sec cr">\s*<div class="s-in">\s*<span class="lbl dk">FAQ<\/span>/

const nb = s => s.replace(/ (€|%)/g, ' $1')

function block(slug, aVille) {
  const g = officialGrid(slug)
  const trois = g?.lignes.find(l => /3 étoiles/.test(l.label) && l.unite === '€')
  const taxe = trois
    ? `<p style="margin-top:14px">Bon à savoir ${aVille} : la taxe de séjour d’un établissement 3 étoiles (hôtel, résidence ou meublé de tourisme, même catégorie dans la loi) est de <strong>${nb(fmtTotal(trois))}</strong> par personne et par nuit en ${g.annee}, taxes additionnelles comprises. <span style="font-size:13px;color:var(--tl)">Source : <a href="${TAXE_SOURCE_URL}" rel="noopener" target="_blank" style="color:inherit">délibérations DGFiP</a>, relevé d’octobre 2026 ; article L2333-30 du CGCT.</span></p>`
    : ''
  return `${START}
<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Hôtels et résidences</span>
    <h2>Un hôtel ou une résidence <em>${aVille}</em></h2>
    <p>Un hôtel, une résidence de tourisme ou une conciergerie qui gère plusieurs logements, c’est aussi de la location courte durée : mêmes plateformes, même besoin de photos qui donnent envie de réserver. Trois points changent avec le photographe :</p>
    <ul style="margin:14px 0 0;padding-left:20px;font-size:15px;line-height:1.8;color:var(--tm);max-width:760px">
      <li><strong>Une série par type de chambre</strong>, plus les espaces communs : accueil, salle du petit-déjeuner, extérieurs.</li>
      <li><strong>Les droits d’utilisation écrits dans le devis</strong> : site, Booking, réseaux sociaux, brochure.</li>
      <li><strong>Un planning calé à l’avance</strong> : chambres libres et prêtes le jour du shooting.</li>
    </ul>${taxe}
    <p style="margin-top:14px">Dans l’annuaire, le filtre « Hôtels et résidences » montre les photographes qui y travaillent déjà. <a href="/photographe-hotel" style="color:var(--g);font-weight:600">Photographe pour un hôtel : la méthode</a></p>
  </div>
</section>
${END}`
}

let n = 0
for (const dir of readdirSync(ROOT).filter(d => d.startsWith('photographe-lcd-')).sort()) {
  const file = join(ROOT, dir, 'index.html')
  let html
  try { html = readFileSync(file, 'utf8') } catch { continue }
  const slug = dir.slice('photographe-lcd-'.length)
  // « à Lyon », « au Mans », « aux Sables-d’Olonne » : repris du titre de la FAQ
  const aVille = (html.match(/Questions fréquentes <em>des hôtes ([^<]+)<\/em>/) ?? [])[1]
  if (!aVille) { console.log(`[hotel-villes] ${dir} : pas de FAQ, ignorée`); continue }
  const b = block(slug, aVille)
  if (html.includes(START)) html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), b)
  else if (FAQ.test(html)) html = html.replace(FAQ, m => `\n${b}${m}`)
  else { console.log(`[hotel-villes] ${dir} : FAQ introuvable, ignorée`); continue }
  writeFileSync(file, html)
  n++
}
console.log(`[hotel-villes] ${n} page(s)`)
