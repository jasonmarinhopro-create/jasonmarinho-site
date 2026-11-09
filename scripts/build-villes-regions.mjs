#!/usr/bin/env node
// Pages région des guides « Devenir hôte » : /villes/<région> (09/11/2026,
// étape 7 de la feuille de route « géographie », Jason : « je te laisse gérer
// pour Devenir hôte »). Pas de fiches de pros ici : la page réunit les guides
// des villes de la région (liste et carte) et des sections utiles tirées de
// données déjà vérifiées : repères du marché, temps forts, règles locales,
// taxe de séjour officielle (DGFiP), études de revenus, pros de la région, FAQ.
// Gabarit et styles repris des pages de ville (photographe-lcd-rennes).
// Idempotent, sans données en ligne :
//   node scripts/build-villes-regions.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villesRegistre } from './lib/registre-geo.mjs'
import { regions } from './lib/secteur.mjs'
import { slugRegion } from './lib/villes-hub.mjs'
import { jsonLd, MERES, SITE } from './lib/fil-ariane.mjs'
import { VILLES_LOCAL } from './data/villes-local.mjs'
import { officialGrid, fmtTarif } from './lib/taxe-officielle.mjs'
import {
  enRegion, deRegion, carteSvg, ZONE_CSS, marcheSection, calendrierSection, reglesSection, taxeSection,
} from './lib/annuaire-region.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const plain = s => String(s ?? '').replace(/<[^>]+>/g, '')
const check = process.argv.includes('--check')

function citiesData() {
  const s = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const open = s.indexOf('[', s.indexOf('var CITIES = ['))
  return Object.fromEntries(new Function('return ' + s.slice(open, s.indexOf('];', open) + 1))().map(c => [c.slug, c]))
}

/** Tête, styles, menu et scripts de bas de page d'une page de ville (même allure) */
function gabarit() {
  const src = fs.readFileSync(path.join(ROOT, 'photographe-lcd-rennes', 'index.html'), 'utf8')
  const head = src.slice(0, src.indexOf('<header class="hero">'))
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
  const foot = src.slice(src.indexOf('<script defer src="/footer.js">'))
  return { head, foot }
}

const n = s => Number(String(s ?? '').replace(/[^0-9]/g, '')) || 0

function page(reg, villes, cities, tpl) {
  const url = `/villes/${slugRegion(reg.nom)}`
  const en = enRegion(reg.nom), de = deRegion(reg.nom)
  const title = `Devenir hôte Airbnb ${en}`
  const fullTitle = `${title} · guides`.length <= 60 ? `${title} · guides` : title
  const annonces = villes.reduce((t, v) => t + n(cities[v.slug]?.ann), 0)
  const deps = new Set(villes.map(v => v.departement.code))
  const desc = `Devenir hôte Airbnb ${en} : ${villes.length} guides de ville, règles locales, taxe de séjour officielle, temps forts de l’année et repères du marché de la location courte durée.`
  const chemin = [{ nom: 'Accueil', url: '/' }, MERES.hote, { nom: reg.nom, url }]
  const counts = new Map()
  const revenus = villesRegistre().filter(v => v.region?.code === reg.code && v.pages.revenus).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  // FAQ tirée des guides
  const qa = []
  qa.push([`Quelles villes ont un guide pour devenir hôte ${en} ?`, `${villes.length} ville${villes.length > 1 ? 's ont' : ' a'} son guide : ${villes.map(v => v.nom).join(', ')}. Chaque guide détaille la réglementation locale, l’enregistrement, la taxe de séjour et les saisons.`])
  const big = [...villes].sort((a, b) => n(cities[b.slug]?.ann) - n(cities[a.slug]?.ann))[0]
  if (big && VILLES_LOCAL[big.slug]?.faqPlafond) qa.push([`Combien de nuits par an peut-on louer sa résidence principale à ${big.nom} ?`, plain(VILLES_LOCAL[big.slug].faqPlafond)])
  const tax = villes.map(v => ({ v, g: officialGrid(v.slug) })).find(x => x.g)
  if (tax) { const l = tax.g.lignes.find(x => x.label === 'Meublé non classé'); qa.push([`Quelle est la taxe de séjour à ${tax.v.nom} ?`, `Pour un meublé de tourisme non classé, la commune a voté ${fmtTarif(l)} du prix HT de la nuitée par personne (délibération ${tax.g.annee}, part communale), d’après le relevé officiel de la DGFiP. Les taxes additionnelles s’ajoutent quand elles existent.`]) }
  if (big && cities[big.slug]) qa.push([`Combien rapporte une location courte durée à ${big.nom} ?`, `On estime le marché à ${String(cities[big.slug].ann).replace('~', 'environ ')}, avec un prix moyen de ${cities[big.slug].adr.replace('/nuit', ' par nuit')} et ${cities[big.slug].occ}. Le guide de la ville et l’étude de revenus détaillent les chiffres.`])
  const faqLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })

  const villesHtml = `<section class="villes-section" id="villes" style="background:#fff;padding:clamp(40px,5vw,64px) 0">
  <div style="max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,40px)">
    <div class="rg-grid">
      <div>
        <span class="lbl dk">Les guides</span>
        <h2 style="font-family:Fraunces,serif;font-weight:400;font-size:clamp(24px,3vw,32px);margin:6px 0 8px">Les villes <em style="color:var(--g)">${esc(de)}</em></h2>
        <p style="color:var(--tm);margin:0">Réglementation locale, numéro d’enregistrement, taxe de séjour, saisons et repères du marché : un guide complet par ville.</p>
        <div class="rg-list">
          ${villes.map(v => `<a href="${v.pages.hote}"><i class="ph-bold ph-map-pin"></i><span class="rg-v">${esc(v.nom)}${v.departement.nom !== v.nom ? ` <small>${esc(v.departement.nom)}</small>` : ''}</span>${cities[v.slug] ? `<span class="rg-a">${esc(cities[v.slug].ann)}</span>` : ''}<i class="ph-bold ph-arrow-right"></i></a>`).join('\n          ')}
        </div>
      </div>
      <div class="rg-map">${carteSvg(reg.code, null, villes, 'hote', counts)}<p>Fond de carte : IGN, Licence Ouverte</p></div>
    </div>
  </div>
</section>`

  const liens = `<section class="zs"><h2>Pour aller plus loin <em>${esc(en)}</em></h2>
<div class="zs-cards">
  ${revenus.length ? `<div class="zs-card"><h3><i class="ph-bold ph-chart-line-up"></i>Combien ça rapporte</h3><ul>${revenus.map(v => `<li><a href="${v.pages.revenus}">Étude de revenus à ${esc(v.nom)}</a></li>`).join('')}</ul></div>` : ''}
  <div class="zs-card"><h3><i class="ph-bold ph-users-three"></i>Les pros ${esc(de)}</h3><ul>
    <li><a href="/annuaires/photographes/${slugRegion(reg.nom)}">Photographes et vidéastes ${esc(en)}</a></li>
    <li><a href="/annuaires/menage/${slugRegion(reg.nom)}">Équipes de ménage ${esc(en)}</a></li>
    <li><a href="/annuaires/depannage/${slugRegion(reg.nom)}">Dépannage ${esc(en)}</a></li>
  </ul></div>
</div></section>`

  const faqHtml = `<section class="zs zs-faq"><h2>Questions fréquentes <em>${esc(en)}</em></h2>${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`

  const head = tpl.head
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${url}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace('</head>', `<script type="application/ld+json">\n${jsonLd(chemin)}\n</script>\n<script type="application/ld+json">\n${faqLd}\n</script>\n</head>`)

  return { url, html: `${head}<header class="hero">
  <div class="s-in">
    <nav class="brd" aria-label="Fil d'Ariane"><a href="/">Accueil</a> · <a href="/villes">Guides hôte par ville</a> · <span>${esc(reg.nom)}</span></nav>
    <span class="lbl">Guides locaux · ${esc(reg.nom)}</span>
    <h1>Devenir hôte Airbnb <em>${esc(en)}</em></h1>
    <p class="lead">Les règles, la taxe de séjour, les saisons et le marché de la location courte durée ${esc(en)}, ville par ville. Commence par la tienne.</p>
    <div class="hero-ctas">
      <a href="#villes" class="btn-p"><i class="ph-bold ph-map-pin"></i> Choisir ma ville</a>
      <a href="https://app.jasonmarinho.com/auth/register" class="btn-ol">Créer mon compte gratuit</a>
    </div>
    <div class="stats">
      <div><div class="stat-n">${villes.length}</div><div class="stat-l">ville${villes.length > 1 ? 's' : ''} avec leur guide</div></div>
      ${annonces ? `<div><div class="stat-n">~${annonces.toLocaleString('fr-FR').replace(/ /g, ' ')}</div><div class="stat-l">annonces dans ces villes</div></div>` : ''}
      <div><div class="stat-n">${deps.size}</div><div class="stat-l">département${deps.size > 1 ? 's' : ''}</div></div>
    </div>
  </div>
</header>
${villesHtml}
${marcheSection(de, villes, cities, 'hote')}
${calendrierSection(de, villes, 'hote')}
${reglesSection(de, villes)}
${taxeSection(de, villes)}
${liens}
${faqHtml}
<div style="height:clamp(40px,6vw,72px)"></div>
<style>${ZONE_CSS}</style>
${tpl.foot}` }
}

export function buildVillesRegions() {
  const cities = citiesData()
  const tpl = gabarit()
  const villesHote = villesRegistre().filter(v => v.pays === 'FR' && v.pages.hote)
  const out = []
  for (const reg of regions()) {
    const villes = villesHote.filter(v => v.region?.code === reg.code).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    if (villes.length) out.push(page(reg, villes, cities, tpl))
  }
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let changed = 0
  for (const { url, html } of buildVillesRegions()) {
    const file = path.join(ROOT, url.slice(1), 'index.html')
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    if (cur === html) continue
    changed++
    if (!check) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html) }
  }
  console.log(`Guides hôte par région : ${changed} page(s) ${check ? 'à mettre à jour' : 'écrites'}`)
  if (check && changed) process.exitCode = 1
}
