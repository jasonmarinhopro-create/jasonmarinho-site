// Pages région et département des annuaires (étape 7 de la feuille de route
// « géographie », 09/11/2026). Maquette validée par Jason : « reprends les
// cards actuels des annuaires et le système de recherche ». Une page de zone =
// la page de l'annuaire limitée aux pros de la zone (même recherche, mêmes
// cartes avec photos), puis des sections utiles même sans pro (Jason : « des
// sections utiles quoi qu'il arrive ») : villes et carte, repères du marché,
// temps forts de l'année, règles locales, taxe de séjour officielle, conseils
// du métier, FAQ. Toutes les données viennent de sources déjà vérifiées
// (scripts/data/villes-local.mjs, CITIES de footer.js, relevé DGFiP).
// Toutes les pages sont visibles par Google (décision de Jason du 09/11/2026,
// risque « contenu maigre » assumé) ; une zone sans pro montre les plus proches.
// Un pro compte dans chaque zone de sa ville principale ET de ses villes
// couvertes (Jason : une équipe présente dans 8 villes doit être partout).
// Appelé par build-photographers / build-cleaners / build-depannage à chaque
// déploiement, après le nettoyage des dossiers de fiches.
import fs from 'node:fs'
import path from 'node:path'
import { villesRegistre } from './registre-geo.mjs'
import { resolveSecteur, departements, regions, distKm, normNom } from './secteur.mjs'
import { jsonLd, MERES, SITE } from './fil-ariane.mjs'
import { slugRegion } from './villes-hub.mjs'
import { VILLES_LOCAL } from '../data/villes-local.mjs'
import { officialGrid, fmtTarif, TAXE_SOURCE_URL } from './taxe-officielle.mjs'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const plain = s => String(s ?? '').replace(/<[^>]+>/g, '')

// ── Prépositions ──────────────────────────────────────────────────────
const PREP_REGION = { 'Grand Est': 'dans le', 'Hauts-de-France': 'dans les', 'Pays de la Loire': 'dans les' }
const DE_REGION = { 'Grand Est': 'du ', 'Hauts-de-France': 'des ', 'Pays de la Loire': 'des ' }
const voyelle = s => /^[AEIOUYÎÉÈ]/i.test(s)
export const enRegion = nom => `${PREP_REGION[nom] ?? 'en'} ${nom}`
export const deRegion = nom => `${DE_REGION[nom] ?? (voyelle(nom) ? 'd’' : 'de ')}${nom}`
/** Département : « dans le Finistère », « en Gironde », « dans l’Hérault », « dans les Landes », « à Paris » */
const DANS_LES = new Set(['04', '05', '06', '08', '13', '22', '40', '64', '65', '66', '78', '79', '88', '92'])
const DANS_LE = new Set(['14', '15', '18', '25', '29', '30', '32', '39', '41', '45', '46', '47', '49', '56', '59', '62', '63', '67', '68', '69', '81', '82', '83', '84', '90', '94', '95'])
const DANS_L = new Set(['01', '02', '03', '10', '11', '12', '27', '34', '36', '60', '61', '89'])
export function enDep(code, nom) {
  if (code === '75') return 'à Paris'
  if (DANS_LES.has(code)) return `dans les ${nom}`
  if (DANS_LE.has(code)) return `dans le ${nom}`
  if (DANS_L.has(code)) return `dans l’${nom}`
  return `en ${nom}`
}
export function deDep(code, nom) {
  if (code === '75') return 'de Paris'
  if (DANS_LES.has(code)) return `des ${nom}`
  if (DANS_LE.has(code)) return `du ${nom}`
  if (DANS_L.has(code)) return `de l’${nom}`
  return voyelle(nom) ? `d’${nom}` : `de ${nom}`
}

// ── Textes par métier ─────────────────────────────────────────────────
const TEXTES = {
  photographe: {
    base: '/annuaires/photographes', prefix: 'photographe-lcd', one: 'photographe', many: 'photographes', conseil: 'photo',
    h1: z => `Photographes et vidéastes LCD <em>${esc(z)}</em>`,
    title: z => `Photographe LCD ${z}`,
    lead: z => `Des photographes et vidéastes qui connaissent la location courte durée, ${z}. Contact direct, sans commission : choisis une fiche ou cherche ta ville.`,
    desc: (z, n) => `${n ? `${n} photographe${n > 1 ? 's' : ''} et vidéaste${n > 1 ? 's' : ''}` : 'Photographes et vidéastes'} spécialisés location courte durée ${z} : photos, tarifs, règles locales, calendrier, contact direct sans commission.`,
    guide: 'Chaque ville a son guide : tarifs constatés sur place, photos indispensables et questions à poser au photographe.',
    conseilsTitre: 'Les conseils photo, ville par ville',
  },
  menage: {
    base: '/annuaires/menage', prefix: 'menage-lcd', one: 'équipe de ménage', many: 'équipes de ménage', conseil: 'menage',
    h1: z => `Équipes de ménage LCD <em>${esc(z)}</em>`,
    title: z => `Ménage Airbnb ${z}`,
    lead: z => `Des équipes habituées aux rotations entre deux voyageurs, ${z}. Contact direct, sans commission : choisis une fiche ou cherche ta ville.`,
    desc: (z, n) => `${n ? `${n} équipe${n > 1 ? 's' : ''} de ménage` : 'Équipes de ménage'} spécialisées location courte durée ${z} : prestations, règles locales, calendrier, contact direct sans commission.`,
    guide: 'Chaque ville a son guide : tarifs constatés sur place, checklist et questions à poser à l’équipe de ménage.',
    conseilsTitre: 'Les conseils ménage, ville par ville',
  },
  depannage: {
    base: '/annuaires/depannage', prefix: 'depannage-lcd', one: 'pro du dépannage', many: 'pros du dépannage', conseil: null,
    h1: z => `Dépannage et maintenance LCD <em>${esc(z)}</em>`,
    title: z => `Dépannage LCD ${z}`,
    lead: z => `Plombiers, électriciens, serruriers qui interviennent entre deux voyageurs, ${z}. Contact direct, sans commission : choisis une fiche ou cherche ta ville.`,
    desc: (z, n) => `${n ? `${n} pro${n > 1 ? 's' : ''} du dépannage` : 'Pros du dépannage'} pour la location courte durée ${z} : zone d’intervention, règles locales, calendrier, contact direct sans commission.`,
    guide: 'Chaque ville a son guide : les bons réflexes avant d’appeler et les questions à poser à l’artisan.',
    conseilsTitre: null,
  },
}

// ── Où intervient un pro ──────────────────────────────────────────────
const DEP_PAR_NOM = () => new Map(departements().map(d => [normNom(d.nom).replace(/^(la|le|les|l) /, ''), d.code]))
let _depNom = null
/** Départements d'une fiche : ville principale et chaque ville couverte (« toute la France » ignoré) */
export function departementsDePro(p) {
  _depNom ||= DEP_PAR_NOM()
  const deps = new Set()
  const one = (ville, zone) => {
    const n = normNom(ville).replace(/^(la|le|les|l) /, '')
    if (_depNom.has(n)) { deps.add(_depNom.get(n)); return null }
    try {
      const sec = resolveSecteur({ ville, zone: zone ?? '', villes: [] })
      if (sec?.centre?.dep) { deps.add(sec.centre.dep); return sec.centre.c }
    } catch { /* ville inconnue */ }
    return null
  }
  const centre = one(p.ville, p.zone_couverte)
  for (const v of Array.isArray(p.villes_couvertes) ? p.villes_couvertes : []) if (v) one(v)
  return { deps, centre }
}
const regionOfDep = dep => regions().find(r => r.deps.includes(dep))

// ── Carte : la région, le département de la page en couleur, les villes ──
const decode = r => { const o = [[r[0], r[1]]]; for (let i = 2; i < r.length; i += 2) { const l = o[o.length - 1]; o.push([l[0] + r[i], l[1] + r[i + 1]]) } return o }
export function carteSvg(regionCode, depCode, villes, kind, counts) {
  const reg = regions().find(r => r.code === regionCode)
  const deps = departements().filter(d => reg.deps.includes(d.code))
  const shapes = deps.flatMap(d => d.r.map(decode).map(pts => ({ d, pts })))
  const all = shapes.flatMap(x => x.pts).concat(villes.map(v => v.centre))
  const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]))
  const kx = Math.cos(((y0 + y1) / 2000) * Math.PI / 180), W = 640, s = W / ((x1 - x0) * kx), H = Math.round((y1 - y0) * s)
  const P = ([x, y]) => [+((x - x0) * kx * s).toFixed(1), +((y1 - y) * s).toFixed(1)]
  const pts = villes.map(v => ({ v, xy: P(v.centre), n: counts.get(v.slug) ?? 0 }))
  return `<svg viewBox="-10 -10 ${W + 20} ${H + 20}" style="width:100%;height:auto;display:block" role="img" aria-label="Carte : ${esc(reg.nom)} et ses villes">`
    + shapes.map(({ d, pts: r }) => `<path d="M${r.map(P).join('L')}Z" fill="${d.code === depCode ? '#C9E3D6' : '#EAF2EE'}" stroke="#004C3F" stroke-opacity="${d.code === depCode ? '.7' : '.3'}" stroke-width="${d.code === depCode ? 1.6 : 1}"/>`).join('')
    + pts.map(({ v, xy: [x, y], n }) => {
      const gauche = pts.some(o => o.v !== v && o.xy[0] > x && o.xy[0] - x < 70 && Math.abs(o.xy[1] - y) < 20)
      return `<a href="${v.pages[kind]}"><circle cx="${x}" cy="${y}" r="${n ? 9 : 6}" fill="#004C3F"/>`
        + (n ? `<text x="${x}" y="${y + 3.5}" text-anchor="middle" font-family="Outfit,sans-serif" font-size="10" font-weight="700" fill="#FFD56B">${n}</text>` : `<circle cx="${x}" cy="${y}" r="2.5" fill="#FFD56B"/>`)
        + `<text x="${gauche ? x - 13 : x + 13}" y="${y + 5}" text-anchor="${gauche ? 'end' : 'start'}" font-family="Outfit,sans-serif" font-size="15" font-weight="600" fill="#0F1A0D" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(v.nom)}</text></a>`
    }).join('')
    + '</svg>'
}

// ── Sections utiles (aussi utilisées par les pages région des guides hôte) ──
export const ZONE_CSS = '.rg-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(20px,4vw,48px);align-items:center}.rg-list{display:flex;flex-direction:column;margin-top:14px;border-top:1px solid rgba(0,76,63,.1)}.rg-list a{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid rgba(0,76,63,.1);text-decoration:none;color:var(--td)}.rg-list a:hover{background:rgba(0,76,63,.03)}.rg-list i{color:var(--g)}.rg-v{flex:1;font-weight:600;min-width:0}.rg-v small{font-weight:400;color:var(--tl)}.rg-a{font-size:12.5px;color:var(--tl);white-space:nowrap}.rg-n{font-size:12px;font-weight:700;color:var(--g);background:rgba(0,76,63,.08);padding:3px 9px;border-radius:999px;white-space:nowrap}.rg-map{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:20px;padding:clamp(12px,2vw,22px)}.rg-map p{font-size:11.5px;color:var(--tl);margin:8px 0 0;text-align:right}'
  + '.zs{max-width:1100px;margin:0 auto;padding:clamp(28px,4vw,44px) clamp(16px,5vw,40px) 0}.zs h2{font-family:Fraunces,serif;font-weight:400;font-size:clamp(22px,2.6vw,28px);color:var(--td);margin:0 0 6px;line-height:1.2}.zs h2 em{color:var(--g);font-style:italic}.zs>p{color:var(--tm);font-size:14.5px;line-height:1.6;margin:0 0 16px;max-width:760px}'
  + '.zs-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:14px;overflow:hidden;font-size:14px}.zs-table th{text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--tl);font-weight:700;padding:11px 14px;background:rgba(0,76,63,.04)}.zs-table td{padding:11px 14px;border-top:1px solid rgba(0,76,63,.08);color:var(--tm);vertical-align:top}.zs-table td:first-child{font-weight:600;color:var(--td);white-space:nowrap}.zs-table a{color:var(--g);font-weight:600;text-decoration:none}'
  + '.zs-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.zs-card{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:14px;padding:16px 18px}.zs-card h3{font-size:15px;font-weight:700;color:var(--td);margin:0 0 8px;display:flex;align-items:center;gap:7px}.zs-card h3 i{color:var(--g)}.zs-card ul{margin:0;padding-left:18px;color:var(--tm);font-size:13.5px;line-height:1.55}.zs-card li{margin:0 0 6px}.zs-card a{color:var(--g);font-weight:600;text-decoration:none;font-size:13px}'
  + '.zs-src{font-size:12px;color:var(--tl);margin:12px 0 0;line-height:1.6}.zs-src a{color:var(--tl)}.zs-deps{display:flex;flex-wrap:wrap;gap:7px;margin:4px 0 0}.zs-deps a{font-size:13px;padding:7px 12px;border-radius:9px;background:#fff;border:1px solid rgba(0,76,63,.14);color:var(--g);text-decoration:none;font-weight:600}.zs-deps a small{font-weight:400;color:var(--tl)}'
  + '.zs-faq details{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:12px;margin:0 0 8px;padding:0 16px}.zs-faq summary{cursor:pointer;padding:14px 0;font-weight:600;color:var(--td);list-style:none}.zs-faq summary::-webkit-details-marker{display:none}.zs-faq details p{margin:0 0 14px;color:var(--tm);font-size:14px;line-height:1.6}.zs-near{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:12px 16px;border-radius:12px;background:#FFF8E1;border:1px solid rgba(232,160,32,.3);color:#5c4510;font-size:14px}'
  + '@media(max-width:860px){.rg-grid{grid-template-columns:minmax(0,1fr)}.rg-a{display:none}.zs-table .zs-hide{display:none}}'

/** Repères du marché (CITIES de footer.js : annonces, prix par nuit, occupation) */
export function marcheSection(zoneDe, villes, cities, lienKind) {
  const rows = villes.map(v => ({ v, c: cities[v.slug] })).filter(x => x.c)
  if (!rows.length) return ''
  return `<section class="zs"><h2>Repères du marché <em>${esc(zoneDe)}</em></h2>
<p>Estimations du marché de la location courte durée dans les villes qui ont leur guide : nombre d’annonces en ligne, prix moyen par nuit et taux d’occupation.</p>
<table class="zs-table"><thead><tr><th>Ville</th><th>Annonces</th><th class="zs-hide">Prix par nuit</th><th>Occupation</th></tr></thead><tbody>
${rows.map(({ v, c }) => `<tr><td><a href="${v.pages[lienKind] ?? v.pages.hote}">${esc(v.nom)}</a></td><td>${esc(c.ann)}</td><td class="zs-hide">${esc(c.adr)}</td><td>${esc(String(c.occ).replace(/ d'occupation| d’occupation/, ''))}</td></tr>`).join('\n')}
</tbody></table></section>`
}

/** Temps forts de l'année (pics des guides vérifiés) */
export function calendrierSection(zoneDe, villes, kind) {
  const rows = villes.map(v => ({ v, pics: VILLES_LOCAL[v.slug]?.pics ?? [] })).filter(x => x.pics.length)
  if (!rows.length) return ''
  const pourQui = { photographe: 'Bon à savoir pour réserver un photographe avant la saison.', menage: 'Ce sont aussi les semaines où les équipes de ménage sont les plus demandées : réserve tôt.', depannage: 'Ce sont aussi les semaines où une panne coûte le plus cher : fais vérifier le logement avant.', hote: 'Ce sont les semaines où les prix et le taux d’occupation montent.' }[kind]
  return `<section class="zs"><h2>Les temps forts <em>${esc(zoneDe)}</em></h2>
<p>Événements et saisons qui font monter la demande, ville par ville. ${esc(pourQui)}</p>
<div class="zs-cards">${rows.map(({ v, pics }) => `<div class="zs-card"><h3><i class="ph-bold ph-calendar-star"></i>${esc(v.nom)}</h3><ul>${pics.map(p => `<li>${esc(plain(p))}</li>`).join('')}</ul></div>`).join('')}</div></section>`
}

/** Règles locales (première règle de chaque guide) et sources */
export function reglesSection(zoneDe, villes) {
  const rows = villes.map(v => ({ v, L: VILLES_LOCAL[v.slug] })).filter(x => x.L?.reglementation?.length)
  if (!rows.length) return ''
  const sources = new Map()
  for (const { L } of rows) for (const s of L.sources ?? []) if (s?.url && !sources.has(s.url) && sources.size < 8) sources.set(s.url, s.label)
  return `<section class="zs"><h2>Les règles à connaître <em>${esc(zoneDe)}</em></h2>
<p>La règle principale de chaque ville pour louer en courte durée. Le guide de la ville détaille le changement d’usage, l’enregistrement et les exceptions.</p>
<div class="zs-cards">${rows.map(({ v, L }) => `<div class="zs-card"><h3><i class="ph-bold ph-scales"></i>${esc(v.nom)}</h3><ul><li>${esc(plain(L.reglementation[0]))}</li></ul>${v.pages.hote ? `<a href="${v.pages.hote}">Toutes les règles ${esc(v.nom.match(/^Les? /) ? 'pour ' + v.nom : 'à ' + v.nom)} →</a>` : ''}</div>`).join('')}</div>
<p class="zs-src">Vérifié en ${esc([...new Set(rows.map(r => r.L.verifie))].join(', '))}. Sources : ${[...sources].map(([u, l]) => `<a href="${esc(u)}" rel="noopener" target="_blank">${esc(l)}</a>`).join(' · ')}</p></section>`
}

/** Taxe de séjour officielle (relevé DGFiP) */
export function taxeSection(zoneDe, villes) {
  const rows = villes.map(v => ({ v, g: officialGrid(v.slug) })).filter(x => x.g)
  if (!rows.length) return ''
  const ligne = (g, k) => g.lignes.find(l => l.label === k)
  const releve = rows[0].g.releve
  return `<section class="zs"><h2>Taxe de séjour officielle <em>${esc(zoneDe)}</em></h2>
<p>Tarifs votés par chaque commune pour un meublé de tourisme, part communale (les taxes additionnelles, quand il y en a, s’ajoutent : voir le guide de la ville).</p>
<table class="zs-table"><thead><tr><th>Ville</th><th>Meublé non classé</th><th class="zs-hide">Meublé 3 étoiles</th><th class="zs-hide">Délibération</th></tr></thead><tbody>
${rows.map(({ v, g }) => `<tr><td>${v.pages.hote ? `<a href="${v.pages.hote}">${esc(v.nom)}</a>` : esc(v.nom)}</td><td>${esc(fmtTarif(ligne(g, 'Meublé non classé')))} du prix HT par nuit et par personne</td><td class="zs-hide">${ligne(g, 'Meublé 3 étoiles') ? `${esc(fmtTarif(ligne(g, 'Meublé 3 étoiles')))} par nuit et par personne` : ''}</td><td class="zs-hide">${esc(g.annee)}</td></tr>`).join('\n')}
</tbody></table>
<p class="zs-src">Source : <a href="${TAXE_SOURCE_URL}" rel="noopener" target="_blank">DGFiP, délibérations de taxe de séjour (données DELTA, Licence Ouverte)</a>, relevé du ${esc(releve.split('-').reverse().join('/'))}.</p></section>`
}

/** Conseils du métier, ville par ville */
function conseilsSection(t, villes) {
  if (!t.conseil) return ''
  const rows = villes.map(v => ({ v, c: VILLES_LOCAL[v.slug]?.[t.conseil] ?? [] })).filter(x => x.c.length)
  if (!rows.length) return ''
  return `<section class="zs"><h2>${esc(t.conseilsTitre)}</h2>
<p>Ce qui marche sur place, tiré des guides de chaque ville.</p>
<div class="zs-cards">${rows.map(({ v, c }) => `<div class="zs-card"><h3><i class="ph-bold ph-lightbulb"></i>${esc(v.nom)}</h3><ul>${c.slice(0, 2).map(x => `<li>${esc(plain(x))}</li>`).join('')}</ul><a href="${v.pages[t.conseil === 'photo' ? 'photographe' : 'menage']}">Le guide ${esc(v.nom.match(/^Le /) ? 'du ' + v.nom.slice(3) : v.nom.match(/^Les /) ? 'des ' + v.nom.slice(4) : 'de ' + v.nom)} →</a></div>`).join('')}</div></section>`
}

/** FAQ de la zone (visible + JSON-LD), réponses tirées des données ci-dessus */
function faqZone(t, kind, zoneEn, villes, pros, cities) {
  const qa = []
  const noms = villes.map(v => v.nom)
  if (noms.length) qa.push([`Quelles villes ont un guide ${zoneEn} ?`, `${noms.length} ville${noms.length > 1 ? 's ont' : ' a'} un guide ${kind === 'photographe' ? 'photo' : kind === 'menage' ? 'ménage' : 'dépannage'} : ${noms.join(', ')}. Chacun donne les tarifs constatés, les règles locales et la demande de devis gratuite.`])
  qa.push([`Comment trouver ${t.one === 'équipe de ménage' ? 'une' : 'un'} ${t.one} ${zoneEn} ?`, `${pros ? `${pros} ${pros > 1 ? t.many : t.one} ${pros > 1 ? 'sont inscrits' : 'est inscrit'} ${zoneEn} : consulte ${pros > 1 ? 'leurs fiches' : 'sa fiche'} et contacte-${pros > 1 ? 'les' : 'le'} directement, sans commission.` : `Aucun ${t.one} n’est encore inscrit ${zoneEn}.`} Tu peux aussi décrire ton logement dans « Trouver un pro » : ta demande est enregistrée et tu reçois un lien de suivi.`])
  const tax = villes.map(v => ({ v, g: officialGrid(v.slug) })).find(x => x.g)
  if (tax) {
    const l = tax.g.lignes.find(x => x.label === 'Meublé non classé')
    qa.push([`Quelle est la taxe de séjour à ${tax.v.nom} ?`, `Pour un meublé de tourisme non classé, la commune a voté ${fmtTarif(l)} du prix HT de la nuitée par personne (délibération ${tax.g.annee}, part communale), d’après le relevé officiel de la DGFiP. Les taxes additionnelles s’ajoutent quand elles existent.`])
  }
  const big = villes.map(v => ({ v, c: cities[v.slug] })).filter(x => x.c).sort((a, b) => Number(String(b.c.ann).replace(/\D/g, '')) - Number(String(a.c.ann).replace(/\D/g, '')))[0]
  if (big) qa.push([`Combien de logements sont loués en courte durée à ${big.v.nom} ?`, `On estime le marché à ${String(big.c.ann).replace('~', 'environ ')} à ${big.v.nom}, avec un prix moyen de ${big.c.adr.replace('/nuit', ' par nuit')} et ${big.c.occ}.`])
  if (!qa.length) return { html: '', ld: null }
  return {
    html: `<section class="zs zs-faq"><h2>Questions fréquentes <em>${esc(zoneEn)}</em></h2>${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`,
    ld: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }),
  }
}

// ── Assemblage d'une page de zone ─────────────────────────────────────
function loadCitiesData(root) {
  const s = fs.readFileSync(path.join(root, 'footer.js'), 'utf8')
  const open = s.indexOf('[', s.indexOf('var CITIES = ['))
  return Object.fromEntries(new Function('return ' + s.slice(open, s.indexOf('];', open) + 1))().map(c => [c.slug, c]))
}

function zonePage({ t, kind, buildList, zone, pros, proches, villes, villesProches, counts, cities, chemin, sousZones }) {
  const { url, nom, en, de } = zone
  const title = t.title(en)
  const fullTitle = `${title} · Jason Marinho`.length <= 60 ? `${title} · Jason Marinho` : title
  const desc = t.desc(en, pros.length)
  const liste = pros.length ? pros : proches.map(x => x.p)
  const lieuVilles = villes.length ? villes : villesProches
  const faq = faqZone(t, kind, en, lieuVilles, pros.length, cities)

  const villesHtml = `<section class="villes-section" id="villes">
  <div class="villes-in">
    <div class="rg-grid">
      <div>
        <h2 class="villes-h">${villes.length ? `Les villes <em>${esc(de)}</em>` : `Les villes <em>les plus proches</em>`}</h2>
        <p class="villes-p">${esc(villes.length ? t.guide : `Aucune ville ${de.replace(/^(de |d’|du |des )/, m => m === 'de ' ? 'de ' : m)} n’a encore son guide. Voici les plus proches, avec leur distance. ${t.guide}`)}</p>
        <div class="rg-list">
          ${lieuVilles.map(v => { const n = counts.get(v.slug) ?? 0; const c = cities[v.slug]; return `<a href="${v.pages[kind]}"><i class="ph-bold ph-map-pin"></i><span class="rg-v">${esc(v.nom)}${v.km != null ? ` <small>${v.km} km</small>` : v.departement.nom !== v.nom ? ` <small>${esc(v.departement.nom)}</small>` : ''}</span>${c ? `<span class="rg-a">${esc(c.ann)}</span>` : ''}${n ? `<span class="rg-n">${n} pro${n > 1 ? 's' : ''}</span>` : ''}<i class="ph-bold ph-arrow-right"></i></a>` }).join('\n          ')}
        </div>
        ${sousZones?.length ? `<p class="villes-p" style="margin:18px 0 6px">Par département :</p><div class="zs-deps">${sousZones.map(d => `<a href="${d.url}">${esc(d.nom)} <small>${d.n ? `${d.n} pro${d.n > 1 ? 's' : ''}` : esc(d.code)}</small></a>`).join('')}</div>` : ''}
      </div>
      <div class="rg-map">${carteSvg(zone.regionCode, zone.depCode, lieuVilles.filter(v => v.region?.code === zone.regionCode), kind, counts)}<p>Fond de carte : IGN, Licence Ouverte</p></div>
    </div>
  </div>
</section>`
  const proches_html = !pros.length && proches.length
    ? `<div class="zs-near"><i class="ph-bold ph-navigation-arrow"></i><span>Aucun ${esc(t.one)} n’est encore inscrit ${esc(en)}. Voici les plus proches : ${proches.map(x => `${esc(x.p.pseudo || x.p.full_name || '')} (${x.km} km)`).join(', ')}.</span></div>`
    : ''
  const sections = [villesHtml, marcheSection(de, lieuVilles, cities, kind), calendrierSection(de, lieuVilles, kind), conseilsSection(t, lieuVilles), reglesSection(de, lieuVilles), taxeSection(de, lieuVilles), faq.html, `<style>${ZONE_CSS}</style>`].join('\n')

  let html = buildList(liste)
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${url}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index, follow">')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
    .replace('</head>', `<script type="application/ld+json">\n${jsonLd(chemin)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: SITE + url, description: desc })}\n</script>\n${faq.ld ? `<script type="application/ld+json">\n${faq.ld}\n</script>\n` : ''}</head>`)
    .replace(/<nav class="brd"[^>]*>[\s\S]*?<\/nav>/, `<nav class="brd" aria-label="Fil d'Ariane">${chemin.map((c, i) => i === chemin.length - 1 ? `<span>${esc(c.nom)}</span>` : `<a href="${c.url}">${esc(c.nom)}</a>`).join(' · ')}</nav>`)
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${t.h1(en)}</h1>`)
    .replace(/(<\/h1>\s*<p class="lead">)[\s\S]*?(<\/p>)/, `$1${esc(t.lead(en))}$2`)
    .replace(/placeholder="Où est ton logement \?[^"]*"/, `placeholder="Où est ton logement ? ${esc(lieuVilles.slice(0, 3).map(v => v.nom).join(', '))}…"`)
    .replace(/<section class="villes-section" id="villes">[\s\S]*?<\/section>\n?/, '')
    .replace('<div class="grid">', `${proches_html}<div class="grid">`)
    .replace('<!-- REGION-SLOT -->', sections)
  if (!html.includes('class="rg-grid"')) throw new Error(`[zone] ${url} : emplacement REGION-SLOT absent du gabarit`)
  return { html, title }
}

/** Les pros les plus proches d'un point (km), 4 au plus, à 300 km au plus */
function plusProches(centre, items, centres) {
  return items.map(p => ({ p, c: centres.get(p.id) })).filter(x => x.c)
    .map(x => ({ p: x.p, km: Math.round(distKm(centre, x.c)) })).filter(x => x.km <= 300)
    .sort((a, b) => a.km - b.km).slice(0, 4)
}
const centreDe = codes => { const ds = departements().filter(d => codes.includes(d.code)); return [Math.round(ds.reduce((n, d) => n + d.c[0], 0) / ds.length), Math.round(ds.reduce((n, d) => n + d.c[1], 0) / ds.length)] }

/** Adresse d'une page département : /<base>/<région>/<département> */
export const cheminDepartementPage = (kind, regionNom, depNom) => `${TEXTES[kind].base}/${slugRegion(regionNom)}/${slugRegion(depNom)}`

/**
 * Écrit les pages région (13) et département (96) d'un annuaire.
 * @returns {{ ecrites: number, indexables: string[] }} adresses pour le sitemap
 */
export function writeRegionPages({ root, kind, items, buildList, counts = new Map(), skipSlugs = new Set() }) {
  const t = TEXTES[kind]
  const cities = loadCitiesData(root)
  const villesDuMetier = villesRegistre().filter(v => v.pays === 'FR' && v.pages[kind])
  const depsDe = new Map(), centres = new Map()
  for (const p of items) {
    const { deps, centre } = departementsDePro(p)
    depsDe.set(p.id, deps)
    if (centre) centres.set(p.id, centre)
  }
  const prosDansDeps = codes => items.filter(p => [...(depsDe.get(p.id) ?? [])].some(d => codes.includes(d)))
  const urls = []
  for (const reg of regions()) {
    const rslug = slugRegion(reg.nom)
    if (skipSlugs.has(rslug)) { console.warn(`[zone] ${t.base}/${rslug} : une fiche porte déjà ce nom, page région non écrite`); continue }
    const rUrl = `${t.base}/${rslug}`
    const rVilles = villesDuMetier.filter(v => v.region?.code === reg.code).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    const rCentre = centreDe(reg.deps)
    const rPros = prosDansDeps(reg.deps)
    const rProches = rVilles.length ? [] : villesDuMetier.map(v => ({ ...v, km: Math.round(distKm(rCentre, v.centre)) })).sort((a, b) => a.km - b.km).slice(0, 6)
    const chRegion = [{ nom: 'Accueil', url: '/' }, MERES[kind], { nom: reg.nom, url: rUrl }]
    const deps = departements().filter(d => reg.deps.includes(d.code)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    const sousZones = deps.map(d => ({ code: d.code, nom: d.nom, url: cheminDepartementPage(kind, reg.nom, d.nom), n: prosDansDeps([d.code]).length }))
    const { html } = zonePage({
      t, kind, buildList, cities, counts, chemin: chRegion, sousZones,
      zone: { url: rUrl, nom: reg.nom, en: enRegion(reg.nom), de: deRegion(reg.nom), regionCode: reg.code, depCode: null },
      pros: rPros, proches: rPros.length ? [] : plusProches(rCentre, items, centres), villes: rVilles, villesProches: rProches,
    })
    write(root, rUrl, html); urls.push(rUrl)

    for (const d of deps) {
      const dUrl = cheminDepartementPage(kind, reg.nom, d.nom)
      const dVilles = rVilles.filter(v => v.departement?.code === d.code)
      const dPros = prosDansDeps([d.code])
      const dProches = dVilles.length ? [] : villesDuMetier.map(v => ({ ...v, km: Math.round(distKm(d.c, v.centre)) })).sort((a, b) => a.km - b.km).slice(0, 6)
      const { html: dHtml } = zonePage({
        t, kind, buildList, cities, counts, chemin: [...chRegion, { nom: d.nom, url: dUrl }],
        zone: { url: dUrl, nom: d.nom, en: enDep(d.code, d.nom), de: deDep(d.code, d.nom), regionCode: reg.code, depCode: d.code },
        pros: dPros, proches: dPros.length ? [] : plusProches(d.c, items, centres), villes: dVilles, villesProches: dProches,
      })
      write(root, dUrl, dHtml); urls.push(dUrl)
    }
  }
  return { ecrites: urls.length, indexables: urls }
}

function write(root, url, html) {
  const dir = path.join(root, url.slice(1))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
}

/** Ajoute des adresses à un sitemap (avant </urlset>) */
export function sitemapAvec(xml, urls) {
  if (!urls.length) return xml
  const today = new Date().toISOString().slice(0, 10)
  return xml.replace('</urlset>', urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`).join('') + '</urlset>')
}
