// Fiches des pros, direction « Carte de visite » (18/10/2026, choix de Jason :
// A + En bref, bandeau jamais vide, carte de la zone, formulaire guidé, soins
// du texte). Morceaux partagés par build-photographers.mjs, build-cleaners.mjs
// et les fiches d'exemple. La carte de France est dessinée ici : aucune carte
// en ligne, rien n'est chargé chez un tiers.

import { villePageSlug, villeGuide } from './inject-ville-pros.mjs'

const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/**
 * Nom affiché : un mot tout en majuscules de 3 lettres ou plus passe en
 * minuscules avec une capitale (« Karine BOZZOLI » → « Karine Bozzoli »).
 * Les sigles courts (« JC ») et les noms déjà écrits normalement restent.
 */
export function nomAffiche(s) {
  return String(s ?? '').trim().replace(/\s+/g, ' ').replace(/[\p{L}]+/gu, w =>
    w.length >= 3 && w === w.toUpperCase() && w !== w.toLowerCase()
      ? w.charAt(0) + w.slice(1).toLowerCase()
      : w)
}

export function initiales(nom) {
  return nom.split(/[\s-]+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/** « à Lyon », « au Mans », « aux Sables-d'Olonne » */
export function aVille(v) {
  const s = String(v ?? '').trim()
  return /^les\s/i.test(s) ? `aux ${s.slice(4)}` : /^le\s/i.test(s) ? `au ${s.slice(3)}` : `à ${s}`
}

/** « de Lyon », « d'Annecy », « du Mans », « des Sables-d'Olonne » */
export function deVille(v) {
  const s = String(v ?? '').trim()
  return /^les\s/i.test(s) ? `des ${s.slice(4)}` : /^le\s/i.test(s) ? `du ${s.slice(3)}` : /^[aeiouyhâéèêîôû]/i.test(s) ? `d’${s}` : `de ${s}`
}

/** Rayon en km lu dans la zone (« Roanne et 30km », « Lyon + 60 km ») */
export function rayonKm(zone) {
  const m = String(zone ?? '').match(/(\d{1,3})\s?kms?\b/i)
  const n = m ? Number(m[1]) : null
  return n && n >= 5 && n <= 300 ? n : null
}

// Villes qui ont leurs pages (latitude, longitude). Vérifié par
// scripts/verifier-villes.mjs : chaque ville de CITIES doit être ici.
export const VILLE_COORDS = {
  lyon: [45.76, 4.84], bordeaux: [44.84, -0.58], annecy: [45.90, 6.13], nice: [43.70, 7.27], strasbourg: [48.58, 7.75],
  biarritz: [43.48, -1.56], 'la-rochelle': [46.16, -1.15], marseille: [43.30, 5.37], toulouse: [43.60, 1.44], montpellier: [43.61, 3.88],
  nantes: [47.22, -1.55], lille: [50.63, 3.06], 'aix-en-provence': [43.53, 5.45], cannes: [43.55, 7.01], avignon: [43.95, 4.81],
  chamonix: [45.92, 6.87], 'saint-malo': [48.65, -2.01], rennes: [48.11, -1.68], colmar: [48.08, 7.36], dijon: [47.32, 5.04],
  arcachon: [44.66, -1.17], deauville: [49.36, 0.07], reims: [49.26, 4.03], tours: [47.39, 0.69], metz: [49.12, 6.18],
  rouen: [49.44, 1.10], perpignan: [42.70, 2.90], grenoble: [45.19, 5.72], bayonne: [43.49, -1.47], caen: [49.18, -0.37],
  vannes: [47.66, -2.76], angers: [47.47, -0.55], 'la-baule': [47.29, -2.39], chambery: [45.56, 5.92], sete: [43.40, 3.70],
  brest: [48.39, -4.49], pau: [43.30, -0.37], 'saint-tropez': [43.27, 6.64], honfleur: [49.42, 0.23], 'le-touquet': [50.52, 1.59],
  carcassonne: [43.21, 2.35], ajaccio: [41.93, 8.74], antibes: [43.58, 7.12], sarlat: [44.89, 1.22], nimes: [43.84, 4.36],
  'le-mans': [48.00, 0.20], versailles: [48.80, 2.13], paris: [48.86, 2.35], megeve: [45.86, 6.62], beaune: [47.02, 4.84],
  epernay: [49.04, 3.96], etretat: [49.71, 0.20], menton: [43.78, 7.50], dinard: [48.63, -2.06], quimper: [48.00, -4.10],
  nancy: [48.69, 6.18], troyes: [48.30, 4.08], bastia: [42.70, 9.45], 'clermont-ferrand': [45.78, 3.09], poitiers: [46.58, 0.34],
  'les-sables-d-olonne': [46.50, -1.78], roanne: [46.04, 4.07],
}

// Contour simplifié de la France métropolitaine et de la Corse (longitude, latitude)
const FRANCE = [
  [2.37, 51.05], [2.6, 51.08], [3.2, 50.75], [4.2, 50.1], [4.85, 50.15], [5.0, 49.8], [5.8, 49.55], [6.4, 49.47], [7.0, 49.15],
  [8.2, 48.98], [7.8, 48.4], [7.58, 47.59], [7.0, 47.45], [6.85, 47.08], [6.1, 46.5], [6.15, 46.2], [6.8, 46.4], [7.05, 45.92],
  [6.75, 45.15], [7.1, 44.85], [6.9, 44.4], [7.65, 44.15], [7.53, 43.78], [7.27, 43.7], [6.6, 43.15], [5.93, 43.1], [5.35, 43.3],
  [4.6, 43.4], [3.9, 43.5], [3.1, 43.05], [3.05, 42.55], [2.6, 42.35], [1.7, 42.5], [0.7, 42.75], [-0.3, 42.8], [-1.4, 43.05],
  [-1.78, 43.37], [-1.56, 43.48], [-1.25, 44.4], [-1.25, 44.65], [-1.15, 45.6], [-1.2, 46.15], [-1.8, 46.5], [-2.15, 46.9],
  [-2.5, 47.3], [-3.3, 47.65], [-4.35, 47.8], [-4.75, 48.35], [-4.6, 48.6], [-3.5, 48.85], [-2.0, 48.65], [-1.6, 48.65],
  [-1.6, 49.2], [-1.95, 49.7], [-1.25, 49.7], [-1.1, 49.4], [0.2, 49.4], [0.1, 49.7], [1.0, 49.95], [1.6, 50.4], [1.6, 50.9], [1.85, 50.95],
]
const CORSE = [[9.4, 43.0], [9.55, 42.6], [9.4, 41.9], [9.2, 41.37], [8.8, 41.6], [8.6, 42.1], [8.65, 42.55], [9.1, 42.75]]
const K = 28
const proj = ([lon, lat]) => [+((lon + 5.3) * 0.69 * K).toFixed(1), +((51.4 - lat) * K).toFixed(1)]
const path = pts => 'M' + pts.map(p => proj(p).join(' ')).join(' L') + ' Z'
const FRANCE_D = path(FRANCE) + ' ' + path(CORSE)

/** Slug de la ville la plus proche connue (ville de la fiche, sinon sa zone) */
export function villeCoordSlug(ville, zone) {
  return villePageSlug(ville, Object.keys(VILLE_COORDS), zone)
}

/** Carte de France avec un point sur la ville et, si connu, le cercle du rayon */
export function zoneMapSvg({ ville, zone, label }) {
  const slug = villeCoordSlug(ville, zone)
  if (!slug) return ''
  const [lat, lon] = VILLE_COORDS[slug]
  const [x, y] = proj([lon, lat])
  const km = rayonKm(zone)
  const r = km ? Math.max(5, km * K / 111) : 0
  const right = x > 190
  return `<svg class="vt-map" viewBox="0 0 292 290" role="img" aria-label="${esc(label || ville)} sur la carte de France">
<path d="${FRANCE_D}" class="vt-map-land"/>
${r ? `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" class="vt-map-ring"/>` : ''}<circle cx="${x}" cy="${y}" r="4.5" class="vt-map-dot"/>
<text x="${right ? x - 9 : x + 9}" y="${y - 7}" text-anchor="${right ? 'end' : 'start'}" class="vt-map-t">${esc(label || ville)}</text>
</svg>`
}

/** Prix de départ : formule la moins chère, sinon tarif minimum */
export function prixDepuis(formules, tarifMin) {
  const prix = (Array.isArray(formules) ? formules : []).map(f => f?.prix).filter(n => typeof n === 'number' && n > 0)
  if (typeof tarifMin === 'number' && tarifMin > 0) prix.push(tarifMin)
  if (!prix.length) return null
  return `${String(Math.round(Math.min(...prix))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`
}

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
/** Dernier repère : recommandations, sinon ancienneté */
export function trustFact(recoCount, createdAt, { feminin = false } = {}) {
  if (recoCount > 0) return { v: `${recoCount} hôte${recoCount > 1 ? 's' : ''}`, l: recoCount > 1 ? `${feminin ? 'la' : 'le'} recommandent` : `${feminin ? 'la' : 'le'} recommande` }
  const d = createdAt ? new Date(createdAt) : null
  return d && !isNaN(d.getTime()) ? { v: `${MOIS_COURT[d.getMonth()]} ${d.getFullYear()}`, l: 'membre de l’annuaire depuis' } : null
}

/** Repères « En bref » (4 au plus) */
export function briefHtml(facts, { variant = 'hero', annot = '' } = {}) {
  const list = facts.filter(Boolean).slice(0, 4)
  if (!list.length) return ''
  const items = list.map(f => `<div class="vt-f"><div class="vt-f-v">${esc(f.v)}</div><div class="vt-f-l">${esc(f.l)}</div></div>`).join('')
  return variant === 'hero'
    ? `<div class="vt-brief" style="position:relative">${annot}<div class="vt-brief-h">En bref</div><div class="vt-facts n${list.length}">${items}</div></div>`
    : `<div class="vt-strip n${list.length}" style="position:relative">${annot}${items}</div>`
}

export function zoneFact(ville, zone) {
  const km = rayonKm(zone)
  if (km) return { v: `${km} km`, l: `autour ${deVille(ville)}` }
  const z = String(zone ?? '').trim()
  if (z && z.length <= 22) return { v: z, l: 'zone couverte' }
  return { v: ville, l: 'ville principale' }
}

/** Où j'interviens : carte, zone, villes couvertes (lien vers la page de la ville) */
export function zoneCardHtml({ ville, zone, villes, root, prefix, metierLabel, annot = '' }) {
  const list = []
  const seen = new Set()
  for (const v of [ville, ...(Array.isArray(villes) ? villes : [])]) {
    const name = typeof v === 'string' ? v.trim() : ''
    const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!name || seen.has(key)) continue
    seen.add(key)
    list.push(name)
  }
  const chips = list.length > 1 ? `<div class="vt-villes">${list.slice(0, 11).map(name => {
    const g = root ? villeGuide(root, prefix, name) : null
    return g
      ? `<a class="vt-ville" href="${g.href}" title="${esc(metierLabel)} ${esc(aVille(g.label))} : le guide"><i class="ph-bold ph-map-pin"></i>${esc(name)}</a>`
      : `<span class="vt-ville"><i class="ph-bold ph-map-pin"></i>${esc(name)}</span>`
  }).join('')}</div>` : ''
  const map = zoneMapSvg({ ville, zone })
  return `<section class="card vt-sec" id="zone" style="position:relative">${annot}
  <h2>Où j’interviens</h2>
  <div class="vt-zone${map ? '' : ' nomap'}">${map ? `<div class="vt-zone-map">${map}</div>` : ''}<div class="vt-zone-t">
    <div class="vt-zone-v">${esc(ville)}</div>
    ${zone ? `<p>${esc(zone)}</p>` : ''}
    ${chips}
    <p class="vt-zone-n">Ton logement est un peu plus loin ? Demande quand même : beaucoup de pros se déplacent.</p>
  </div></div>
</section>`
}

/** Son travail en ligne : portfolio, site, vidéo, Instagram, puis les réseaux */
export function workLinksHtml(links, reseauxHtml = '', { title = 'Son travail en ligne', annot = '' } = {}) {
  const list = links.filter(Boolean)
  if (!list.length && !reseauxHtml) return ''
  return `<div class="card vt-work" style="position:relative">${annot}<h2>${esc(title)}</h2>${list.map(l =>
    `<a href="${esc(l.href)}" target="_blank" rel="${l.rel || 'noopener noreferrer'}" class="vt-link"${l.track ? ` onclick="jmTrack('${l.track}')"` : ''}><i class="ph-bold ${l.icon}"></i><span>${esc(l.label)}</span><i class="ph-bold ph-arrow-up-right vt-link-a"></i></a>`).join('')}${reseauxHtml}</div>`
}

// Mêmes logements que /trouver-un-pro (lib/demandes/rules.ts)
const LOGEMENTS = ['Studio ou T1', 'T2 ou T3', 'T4 et plus', 'Maison', 'Plusieurs logements']

/** Formulaire de contact guidé : besoin, logement, date, puis coordonnées */
export function contactFormHtml({ firstName, besoins, placeholder }) {
  const pill = (name, v, type) => `<label class="vt-pill"><input type="${type}" name="${name}" value="${esc(v)}"><span>${esc(v)}</span></label>`
  return `<form class="contact-form vt-cf" id="contact-form" onsubmit="return contactSubmit(event)">
        <div id="contact-err" class="err-msg" style="display:none"></div>
        ${besoins.length ? `<fieldset><legend>Ce qu’il te faut</legend><div class="vt-pills">${besoins.map(b => pill('besoin', b, 'checkbox')).join('')}</div></fieldset>` : ''}
        <fieldset><legend>Ton logement</legend><div class="vt-pills">${LOGEMENTS.map(l => pill('logement', l, 'radio')).join('')}</div></fieldset>
        <fieldset><legend>Quand ? <span>facultatif</span></legend><input type="hidden" name="date" data-date data-today placeholder="Choisir une date"></fieldset>
        <input type="text" name="contactName" placeholder="Ton prénom et ton nom" autocomplete="name" required>
        <input type="email" name="contactEmail" placeholder="Ton e-mail" autocomplete="email" required>
        <textarea name="message" placeholder="${esc(placeholder)}"></textarea>
        <div class="hp"><label>Site</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
        <button type="submit" class="btn-p" id="contact-btn"><i class="ph-bold ph-paper-plane-tilt"></i>Envoyer à ${esc(firstName)}</button>`
}

/** Compose le message envoyé au pro (lu par contactSubmit des deux fiches) */
export const CONTACT_JS = `<script>
(function(){
  var t=new Date(),iso=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  [].forEach.call(document.querySelectorAll('[data-today]'),function(i){i.setAttribute('min',iso)});
  window.jmContactMessage=function(f){
    var parts=[],fo=f.formule&&f.formule.value;if(fo)parts.push('Formule : '+fo);
    var b=[].slice.call(f.querySelectorAll('input[name=besoin]:checked')).map(function(i){return i.value});
    if(b.length)parts.push('Ce qu’il me faut : '+b.join(', '));
    var l=f.querySelector('input[name=logement]:checked');if(l)parts.push('Logement : '+l.value);
    var d=f.date&&f.date.value;
    if(d){try{parts.push('Date souhaitée : '+new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}catch(e){parts.push('Date souhaitée : '+d)}}
    var m=f.message.value.trim();
    return (parts.join('\\n')+(m?(parts.length?'\\n\\n':'')+m:'')).trim();
  };
})();
</script>`

export const SIGNATURE_CSS = `
.vt-brief{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:18px;background:rgba(255,255,255,.04);box-shadow:0 18px 50px rgba(0,0,0,.25)}
.vt-brief-h{font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:12px}
.vt-facts{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.12);border-radius:12px;overflow:hidden}
.vt-facts.n3 .vt-f:last-child{grid-column:span 2}
.vt-facts .vt-f{background:#062b22;padding:14px 16px;min-width:0}
.vt-facts .vt-f-v{font-family:'Fraunces',serif;font-size:24px;line-height:1.15;color:#fff;overflow-wrap:anywhere}
.vt-facts .vt-f-l{font-size:12px;color:rgba(255,255,255,.6);margin-top:3px}
.vt-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px;background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px}
.vt-strip.n3{grid-template-columns:repeat(3,minmax(0,1fr))}.vt-strip.n2{grid-template-columns:repeat(2,minmax(0,1fr))}
.vt-strip .vt-f{border-left:2px solid var(--g);padding-left:12px;min-width:0}
.vt-strip .vt-f-v{font-family:'Fraunces',serif;font-size:21px;line-height:1.15;color:var(--td);overflow-wrap:anywhere}
.vt-strip .vt-f-l{font-size:12px;color:var(--tl);margin-top:2px}
@media(max-width:640px){.vt-strip,.vt-strip.n3{grid-template-columns:1fr 1fr}.vt-strip.n3 .vt-f:last-child{grid-column:span 2}}
.vt-zone{display:grid;grid-template-columns:190px minmax(0,1fr);gap:22px;align-items:center}
.vt-zone.nomap{grid-template-columns:1fr}
@media(max-width:560px){.vt-zone{grid-template-columns:1fr}.vt-zone-map{max-width:220px}}
.vt-map{display:block;width:100%;height:auto}
.vt-map-land{fill:rgba(0,76,63,.05);stroke:rgba(0,76,63,.35);stroke-width:1.2;stroke-linejoin:round}
.vt-map-ring{fill:rgba(0,76,63,.12);stroke:rgba(0,76,63,.3);stroke-width:1}
.vt-map-dot{fill:var(--g);stroke:#fff;stroke-width:2}
.vt-map-t{font:600 13px 'Outfit',sans-serif;fill:var(--g);paint-order:stroke;stroke:#fff;stroke-width:3px}
.vt-zone-v{font-family:'Fraunces',serif;font-size:24px;color:var(--td);line-height:1.15}
.vt-zone-t>p{font-size:14px;color:var(--tm);line-height:1.6;margin-top:4px}
.vt-zone-t .vt-villes{margin-top:12px}
.vt-zone-t .vt-zone-n{font-size:12.5px;color:var(--tl);margin-top:12px}
.vt-work{margin-top:16px}
.vt-link{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid rgba(0,76,63,.15);border-radius:10px;text-decoration:none;color:var(--g);font-weight:600;font-size:14px;margin-top:8px;transition:background .15s,border-color .15s}
.vt-link:first-of-type{margin-top:0}
.vt-link span{flex:1;min-width:0;overflow-wrap:anywhere}
.vt-link-a{font-size:13px;opacity:.6}
.vt-link:hover{background:rgba(0,76,63,.05);border-color:rgba(0,76,63,.3)}
.vt-cf fieldset{border:0;margin:0 0 14px;padding:0;min-width:0}
.vt-cf legend{font-size:12px;font-weight:600;color:var(--td);margin-bottom:8px;padding:0}
.vt-cf legend span{font-weight:400;color:var(--tl)}
.vt-pills{display:flex;flex-wrap:wrap;gap:6px}
.vt-pill{position:relative;cursor:pointer}
.vt-pill input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.vt-pill span{display:inline-flex;align-items:center;padding:7px 12px;border-radius:999px;border:1px solid rgba(0,76,63,.18);background:#fff;font-size:13px;color:var(--td);transition:background .15s,color .15s,border-color .15s}
.vt-pill input:checked+span{background:var(--g);border-color:var(--g);color:#fff}
.vt-pill input:focus-visible+span{outline:2px solid var(--y);outline-offset:2px}
.vt-cf textarea{min-height:70px}
.vt-cf .jmc-t{min-height:44px;padding:9px 13px;font-size:14px;border-radius:8px}
`
