#!/usr/bin/env node
// Quartiers et secteurs des pages photographe-lcd- et menage-lcd- (audit SEO,
// lot D, 19/11/2026, validé par Jason : « résumé avec un lien vers l'article
// complet, mais que les pages ne soient pas vides », « fais toutes les villes,
// priorise les clients »).
// Avant : « Les photos indispensables » et « La checklist turnover complète »
// étaient identiques sur les 63 villes (95 et 100 % du texte en commun).
// Maintenant, pour chaque ville de scripts/data/villes-quartiers.mjs : un bloc
// « Où se trouvent les locations à <ville> » (quartiers ou secteurs, logements,
// ce que ça change pour le shooting ou le ménage), puis la checklist en une
// phrase avec un lien vers l'article complet du blog. Une ville absente du
// fichier garde l'ancien bloc.
// Idempotent (marqueurs QUARTIERS:START/END, posés à la place de la section) :
//   node scripts/inject-quartiers-villes.mjs [--check]
// Lancé par creer-ville.mjs ; à relancer après build-pages-pros-villes.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QUARTIERS } from './data/villes-quartiers.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const RE_BLOC = /<!-- QUARTIERS:START -->[\s\S]*?<!-- QUARTIERS:END -->/

const ARTICLE_PHOTO = '/blog/preparer-logement-shooting-photo-lcd-7-etapes'
const ARTICLE_MENAGE = '/blog/checklist-menage-professionnelle-location-courte-duree'
for (const a of [ARTICLE_PHOTO, ARTICLE_MENAGE]) {
  if (!fs.existsSync(path.join(ROOT, a.slice(1), 'index.html'))) throw new Error(`Article introuvable : ${a}`)
}

const CSS = '<style>.qx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:20px 0 18px}'
  + '.qx-card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:16px 18px}'
  + '.qx-card h3{font-size:15px;font-weight:600;color:var(--td);margin:0 0 6px;display:flex;align-items:center;gap:8px}'
  + '.qx-card h3 i{color:var(--g)}.qx-card p{font-size:14px;line-height:1.6;color:var(--tm);margin:0}'
  + '.qx-intro{max-width:760px;font-size:15.5px;line-height:1.7;color:var(--tm);margin:0}'
  + '.qx-sum{max-width:760px;font-size:15px;line-height:1.7;color:var(--tm);margin:0 0 16px}.qx-sum a{color:var(--g);font-weight:600}</style>'

// Ville vue par la page : « à Lyon », « au Mans », « aux Sables-d'Olonne »
function prepVille(html) {
  return html.match(/<h2>Les règles et le calendrier <em>([^<]+)<\/em>/)?.[1]
    ?? html.match(/<title>[^<]*? ((?:à|au|aux) [^:<|]+?)(?: :| \||<)/)?.[1]?.trim()
}

function bloc(kind, d, aVille) {
  const cartes = d.quartiers.map(([nom, txt]) => `<div class="qx-card"><h3><i class="ph-bold ph-map-pin"></i>${esc(nom)}</h3><p>${esc(txt)}</p></div>`).join('\n      ')
  const photo = kind === 'photographe'
  const resume = photo
    ? `<p class="qx-sum"><strong>Les 8 photos indispensables</strong>, partout : la couverture, chaque chambre, la salle de bain, la cuisine, le séjour mis en scène, les extérieurs, les détails qui différencient et le quartier. Cadrage, lumière et préparation du logement, étape par étape : <a href="${ARTICLE_PHOTO}">préparer son logement pour un shooting photo</a>.</p>`
    : `<p class="qx-sum"><strong>La checklist d'un turnover</strong>, partout : lits refaits, salle de bain, cuisine, consommables, équipements, poubelles, signalement en photos et mise en scène finale. Le détail point par point : <a href="${ARTICLE_MENAGE}">la checklist ménage professionnelle</a>.</p>
    <div class="note"><strong>Les 4 questions à poser avant d'engager :</strong> avez-vous une RC pro à jour ? Travaillez-vous les week-ends et jours fériés ? Quel est votre délai de réservation d'un créneau ? Qui me remplace en cas d'absence ? Une équipe pro répond aux quatre sans hésiter.</div>`
  return `<!-- QUARTIERS:START -->
<section class="sec">
  <div class="s-in">
    <span class="lbl dk">${photo ? 'Shooting' : 'Turnover'} ${esc(aVille)}</span>
    <h2>Où se trouvent les locations <em>${esc(aVille)}</em></h2>
    <p class="qx-intro">${esc(photo ? d.photo : d.menage)}</p>
    <div class="qx-grid">
      ${cartes}
    </div>
    ${resume}
  </div>
</section>
${CSS}
<!-- QUARTIERS:END -->`
}

// Section générique à remplacer (première fois)
const GENERIQUE = {
  photographe: /<section class="sec">\s*<div class="s-in">\s*<span class="lbl dk">Checklist<\/span>\s*<h2>Les photos <em>indispensables<\/em><\/h2>[\s\S]*?<\/section>/,
  menage: /<section class="sec">\s*<div class="s-in">\s*<span class="lbl dk">Checklist<\/span>\s*<h2>La checklist turnover <em>complète<\/em><\/h2>[\s\S]*?<\/section>/,
}

let ecrites = 0, aJour = 0
const ecarts = [], manques = []
for (const [slug, d] of Object.entries(QUARTIERS)) {
  if (!d.quartiers?.length || !d.photo || !d.menage) throw new Error(`Données incomplètes : ${slug}`)
  for (const kind of ['photographe', 'menage']) {
    const file = path.join(ROOT, `${kind}-lcd-${slug}`, 'index.html')
    if (!fs.existsSync(file)) { manques.push(`${kind}-lcd-${slug}`); continue }
    const src = fs.readFileSync(file, 'utf8')
    const aVille = prepVille(src)
    if (!aVille) { manques.push(`${kind}-lcd-${slug} (ville)`); continue }
    const b = bloc(kind, d, aVille)
    let out
    if (RE_BLOC.test(src)) out = src.replace(RE_BLOC, b)
    else if (GENERIQUE[kind].test(src)) out = src.replace(GENERIQUE[kind], b)
    else { manques.push(`${kind}-lcd-${slug} (section introuvable)`); continue }
    if (out === src) { aJour++; continue }
    if (CHECK) { ecarts.push(`${kind}-lcd-${slug}`); continue }
    fs.writeFileSync(file, out)
    ecrites++
  }
}
if (manques.length) console.log('Ignorées :', manques.join(', '))
if (CHECK) {
  if (ecarts.length) { console.error(`Quartiers à mettre à jour (${ecarts.length}) : ${ecarts.slice(0, 10).join(', ')}`); process.exit(1) }
  console.log(`Quartiers des villes : ${aJour} pages à jour, ${Object.keys(QUARTIERS).length} villes`)
} else console.log(`Quartiers des villes : ${ecrites} pages écrites, ${aJour} déjà à jour, ${Object.keys(QUARTIERS).length} villes`)
