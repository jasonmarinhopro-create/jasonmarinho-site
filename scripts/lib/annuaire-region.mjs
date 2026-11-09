// Pages région des annuaires (étape 7 de la feuille de route « géographie »,
// maquette validée par Jason le 09/11/2026 : « reprends les cards actuels des
// annuaires et le système de recherche »). Une page région = la page de
// l'annuaire limitée aux pros de la région (même recherche, mêmes cartes avec
// photos), plus la liste des villes et la carte de la région.
// Une région sans pro en ligne dans le métier est en noindex (contenu maigre,
// règles Google « doorway » / « scaled content ») : elle sert à la navigation
// (pied de page, fil d'Ariane) et devient visible pour Google dès le premier pro.
// Appelé par build-photographers / build-cleaners / build-depannage à chaque
// déploiement (les pros changent), après le nettoyage des dossiers de fiches.
import fs from 'node:fs'
import path from 'node:path'
import { villesRegistre } from './registre-geo.mjs'
import { resolveSecteur, departements, regions } from './secteur.mjs'
import { jsonLd, MERES, SITE } from './fil-ariane.mjs'
import { slugRegion } from './villes-hub.mjs'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** « en Bretagne », « dans le Grand Est », « dans les Hauts-de-France » */
const PREP = { 'Grand Est': 'dans le', 'Hauts-de-France': 'dans les', 'Pays de la Loire': 'dans les' }
export const enRegion = nom => `${PREP[nom] ?? 'en'} ${nom}`
/** « de Bretagne », « d’Île-de-France », « du Grand Est », « des Hauts-de-France » */
const DE = { 'Grand Est': 'du ', 'Hauts-de-France': 'des ', 'Pays de la Loire': 'des ' }
export const deRegion = nom => `${DE[nom] ?? (/^[AEIOUÎÉ]/i.test(nom) ? 'd’' : 'de ')}${nom}`

const TEXTES = {
  photographe: {
    base: '/annuaires/photographes', prefix: 'photographe-lcd',
    h1: r => `Photographes et vidéastes LCD <em>${esc(enRegion(r))}</em>`,
    title: r => `Photographe LCD ${enRegion(r)}`,
    lead: r => `Des photographes et vidéastes qui connaissent la location courte durée, ${enRegion(r)}. Contact direct, sans commission : choisis une fiche ou cherche ta ville.`,
    desc: (r, n) => `${n ? `${n} photographe${n > 1 ? 's' : ''} et vidéaste${n > 1 ? 's' : ''}` : 'Photographes et vidéastes'} spécialisés location courte durée ${enRegion(r)} : photos, formules, tarifs, contact direct sans commission.`,
    guide: 'Chaque ville a son guide : tarifs constatés sur place, photos indispensables et questions à poser au photographe.',
  },
  menage: {
    base: '/annuaires/menage', prefix: 'menage-lcd',
    h1: r => `Équipes de ménage LCD <em>${esc(enRegion(r))}</em>`,
    title: r => `Ménage Airbnb ${enRegion(r)}`,
    lead: r => `Des équipes habituées aux rotations entre deux voyageurs, ${enRegion(r)}. Contact direct, sans commission : choisis une fiche ou cherche ta ville.`,
    desc: (r, n) => `${n ? `${n} équipe${n > 1 ? 's' : ''} de ménage` : 'Équipes de ménage'} spécialisées location courte durée ${enRegion(r)} : prestations, tarifs, contact direct sans commission.`,
    guide: 'Chaque ville a son guide : tarifs constatés sur place, checklist et questions à poser à l’équipe de ménage.',
  },
  depannage: {
    base: '/annuaires/depannage', prefix: 'depannage-lcd',
    h1: r => `Dépannage et maintenance LCD <em>${esc(enRegion(r))}</em>`,
    title: r => `Dépannage LCD ${enRegion(r)}`,
    lead: r => `Plombiers, électriciens, serruriers qui interviennent entre deux voyageurs, ${enRegion(r)}. Contact direct, sans commission : choisis une fiche ou cherche ta ville.`,
    desc: (r, n) => `${n ? `${n} pro${n > 1 ? 's' : ''} du dépannage` : 'Pros du dépannage'} pour la location courte durée ${enRegion(r)} : services, zone d’intervention, contact direct sans commission.`,
    guide: 'Chaque ville a son guide : les bons réflexes avant d’appeler et les questions à poser à l’artisan.',
  },
}

/** Code de la région d'une fiche (ville principale, sinon zone ou villes couvertes) */
export function regionDePro(p) {
  try {
    const sec = resolveSecteur({ ville: p.ville, zone: p.zone_couverte, villes: p.villes_couvertes })
    const dep = sec?.centre?.dep
    return dep ? regions().find(r => r.deps.includes(dep))?.code ?? null : null
  } catch { return null }
}

/** Carte SVG de la région : départements et villes du site (pastille = pros présentés) */
function carteSvg(regionCode, villes, kind, counts) {
  const reg = regions().find(r => r.code === regionCode)
  const deps = departements().filter(d => reg.deps.includes(d.code))
  const decode = r => { const o = [[r[0], r[1]]]; for (let i = 2; i < r.length; i += 2) { const l = o[o.length - 1]; o.push([l[0] + r[i], l[1] + r[i + 1]]) } return o }
  const rings = deps.flatMap(d => d.r.map(decode))
  const all = rings.flat()
  const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]))
  const kx = Math.cos(((y0 + y1) / 2000) * Math.PI / 180), W = 640, s = W / ((x1 - x0) * kx), H = Math.round((y1 - y0) * s)
  const P = ([x, y]) => [+((x - x0) * kx * s).toFixed(1), +((y1 - y) * s).toFixed(1)]
  const pts = villes.map(v => ({ v, xy: P(v.centre), n: counts.get(v.slug) ?? 0 }))
  return `<svg viewBox="-10 -10 ${W + 20} ${H + 20}" style="width:100%;height:auto;display:block" role="img" aria-label="Carte : ${esc(reg.nom)} et ses villes">`
    + rings.map(r => `<path d="M${r.map(P).join('L')}Z" fill="#EAF2EE" stroke="#004C3F" stroke-opacity=".3" stroke-width="1"/>`).join('')
    + pts.map(({ v, xy: [x, y], n }) => {
      const gauche = pts.some(o => o.v !== v && o.xy[0] > x && o.xy[0] - x < 70 && Math.abs(o.xy[1] - y) < 20)
      return `<a href="${v.pages[kind]}"><circle cx="${x}" cy="${y}" r="${n ? 9 : 6}" fill="#004C3F"/>`
        + (n ? `<text x="${x}" y="${y + 3.5}" text-anchor="middle" font-family="Outfit,sans-serif" font-size="10" font-weight="700" fill="#FFD56B">${n}</text>` : `<circle cx="${x}" cy="${y}" r="2.5" fill="#FFD56B"/>`)
        + `<text x="${gauche ? x - 13 : x + 13}" y="${y + 5}" text-anchor="${gauche ? 'end' : 'start'}" font-family="Outfit,sans-serif" font-size="15" font-weight="600" fill="#0F1A0D" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(v.nom)}</text></a>`
    }).join('')
    + '</svg>'
}

function villesSection(regionNom, regionCode, kind, villes, counts, annonces) {
  const t = TEXTES[kind]
  return `<section class="villes-section" id="villes">
  <div class="villes-in">
    <div class="rg-grid">
      <div>
        <h2 class="villes-h">Les villes <em>${esc(deRegion(regionNom))}</em></h2>
        <p class="villes-p">${esc(t.guide)}</p>
        <div class="rg-list">
          ${villes.map(v => { const n = counts.get(v.slug) ?? 0; const a = annonces(v.slug); return `<a href="${v.pages[kind]}"><i class="ph-bold ph-map-pin"></i><span class="rg-v">${esc(v.nom)}${v.departement.nom !== v.nom ? ` <small>${esc(v.departement.nom)}</small>` : ''}</span>${a ? `<span class="rg-a">${esc(a)}</span>` : ''}${n ? `<span class="rg-n">${n} pro${n > 1 ? 's' : ''}</span>` : ''}<i class="ph-bold ph-arrow-right"></i></a>` }).join('\n          ')}
        </div>
      </div>
      <div class="rg-map">${carteSvg(regionCode, villes, kind, counts)}<p>Fond de carte : IGN, Licence Ouverte</p></div>
    </div>
  </div>
</section>
<style>.rg-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(20px,4vw,48px);align-items:center}.rg-list{display:flex;flex-direction:column;margin-top:14px;border-top:1px solid rgba(0,76,63,.1)}.rg-list a{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid rgba(0,76,63,.1);text-decoration:none;color:var(--td)}.rg-list a:hover{background:rgba(0,76,63,.03)}.rg-list i{color:var(--g)}.rg-v{flex:1;font-weight:600;min-width:0}.rg-v small{font-weight:400;color:var(--tl)}.rg-a{font-size:12.5px;color:var(--tl);white-space:nowrap}.rg-n{font-size:12px;font-weight:700;color:var(--g);background:rgba(0,76,63,.08);padding:3px 9px;border-radius:999px;white-space:nowrap}.rg-map{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:20px;padding:clamp(12px,2vw,22px)}.rg-map p{font-size:11.5px;color:var(--tl);margin:8px 0 0;text-align:right}@media(max-width:860px){.rg-grid{grid-template-columns:minmax(0,1fr)}.rg-a{display:none}}</style>`
}

/**
 * Écrit /<base>/<région>/index.html pour les 13 régions.
 * @returns {{ ecrites: number, indexables: string[] }} adresses à mettre dans le sitemap
 */
export function writeRegionPages({ root, kind, items, buildList, counts = new Map(), annonces = () => null, skipSlugs = new Set() }) {
  const t = TEXTES[kind]
  const villesDuMetier = villesRegistre().filter(v => v.pays === 'FR' && v.pages[kind])
  const parRegion = new Map()
  for (const p of items) {
    const r = regionDePro(p)
    if (!r) continue
    if (!parRegion.has(r)) parRegion.set(r, [])
    parRegion.get(r).push(p)
  }
  const indexables = []
  let ecrites = 0
  for (const reg of regions()) {
    const slug = slugRegion(reg.nom)
    if (skipSlugs.has(slug)) { console.warn(`[région] ${t.base}/${slug} : une fiche porte déjà ce nom, page région non écrite`); continue }
    const villes = villesDuMetier.filter(v => v.region?.code === reg.code).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    if (!villes.length) continue
    const pros = parRegion.get(reg.code) ?? []
    const url = `${t.base}/${slug}`
    const title = t.title(reg.nom)
    const fullTitle = `${title} · Jason Marinho`.length <= 60 ? `${title} · Jason Marinho` : title
    const desc = t.desc(reg.nom, pros.length)
    const chemin = [{ nom: 'Accueil', url: '/' }, MERES[kind], { nom: reg.nom, url }]

    let html = buildList(pros)
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
      .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${url}">`)
      .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${url}">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
      .replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${pros.length ? 'index, follow' : 'noindex, follow'}">`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
      .replace('</head>', `<script type="application/ld+json">\n${jsonLd(chemin)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: SITE + url, description: desc })}\n</script>\n</head>`)
      .replace(/<nav class="brd"[^>]*>[\s\S]*?<\/nav>/, `<nav class="brd" aria-label="Fil d'Ariane"><a href="/">Accueil</a> · <a href="${MERES[kind].url}">${esc(MERES[kind].nom)}</a> · <span>${esc(reg.nom)}</span></nav>`)
      .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${t.h1(reg.nom)}</h1>`)
      .replace(/(<\/h1>\s*<p class="lead">)[\s\S]*?(<\/p>)/, `$1${esc(t.lead(reg.nom))}$2`)
      .replace(/placeholder="Où est ton logement \?[^"]*"/, `placeholder="Où est ton logement ? ${esc(villes.slice(0, 3).map(v => v.nom).join(', '))}…"`)
      .replace(/<section class="villes-section" id="villes">[\s\S]*?<\/section>\n?/, '')
      .replace('<!-- REGION-SLOT -->', villesSection(reg.nom, reg.code, kind, villes, counts, annonces))
    if (!html.includes('class="rg-grid"')) throw new Error(`[région] ${url} : emplacement REGION-SLOT absent du gabarit`)
    const dir = path.join(root, url.slice(1))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
    ecrites++
    if (pros.length) indexables.push(url)
  }
  return { ecrites, indexables }
}

/** Ajoute des adresses à un sitemap (avant </urlset>) */
export function sitemapAvec(xml, urls) {
  if (!urls.length) return xml
  const today = new Date().toISOString().slice(0, 10)
  return xml.replace('</urlset>', urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`).join('') + '</urlset>')
}
