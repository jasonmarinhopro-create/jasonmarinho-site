// Carte « Où j'interviens » des fiches pros (18/10/2026, choix B de Jason :
// « la carte qui répond »). Lit la ville, la zone et les villes couvertes
// d'une fiche, les retrouve dans les communes, départements et régions
// (scripts/data/geo, IGN Admin Express 2018, Licence Ouverte, préparées par
// scripts/build-geo-data.mjs) et dessine une carte SVG légère au build.
// Aucun service de carte : rien n'est chargé chez un tiers à l'ouverture.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GEO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'geo')
const Q = 1000
const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const normNom = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/œ/g, 'oe').replace(/['’`\-_.]/g, ' ').replace(/\bst\b/g, 'saint').replace(/\bste\b/g, 'sainte').replace(/\s+/g, ' ').trim()

// ── Données ────────────────────────────────────────────────────────
let _deps = null, _regions = null, _index = null
const _communes = new Map()
export function departements() { return _deps ||= JSON.parse(fs.readFileSync(path.join(GEO, 'departements.json'), 'utf8')).map(d => ({ ...d, n: normNom(d.nom), bb: bboxQ(d.r) })) }
export function regions() { return _regions ||= JSON.parse(fs.readFileSync(path.join(GEO, 'regions.json'), 'utf8')).map(r => ({ ...r, n: normNom(r.nom) })) }
function communesOf(dep) {
  if (!_communes.has(dep)) {
    const f = path.join(GEO, 'communes', `${dep}.json`)
    _communes.set(dep, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).map(([code, nom, cx, cy, r]) => ({ code, nom, dep, c: [cx, cy], r, n: normNom(nom), bb: bboxQ(r) })) : [])
  }
  return _communes.get(dep)
}
function index() {
  if (_index) return _index
  _index = new Map()
  for (const d of departements()) for (const c of communesOf(d.code)) {
    if (!_index.has(c.n)) _index.set(c.n, [])
    _index.get(c.n).push(c)
  }
  return _index
}
function decode(ring) { const out = [[ring[0], ring[1]]]; for (let i = 2; i < ring.length; i += 2) { const l = out[out.length - 1]; out.push([l[0] + ring[i], l[1] + ring[i + 1]]) } return out }
function bboxQ(rings) { let b = [Infinity, Infinity, -Infinity, -Infinity]; for (const r of rings) { let x = r[0], y = r[1]; const step = (a, c) => { b = [Math.min(b[0], a), Math.min(b[1], c), Math.max(b[2], a), Math.max(b[3], c)] }; step(x, y); for (let i = 2; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; step(x, y) } } return b }

/** Distance à vol d'oiseau en km entre deux points [lon, lat] en millièmes de degré */
export function distKm(a, b) {
  const r = Math.PI / 180, la1 = a[1] / Q, la2 = b[1] / Q, dla = (b[1] - a[1]) / Q, dlo = (b[0] - a[0]) / Q
  const h = Math.sin(dla * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo * r / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// ── Lecture de la zone ─────────────────────────────────────────────
const FRANCE = /\b(toute la france|france entiere|partout en france|dans toute la france|france metropolitaine|toute la france metropolitaine)\b|^france$/
const IGNORE = /^(et )?(alentours|environs|aux alentours|autour|secteur|region|zone|agglomeration|agglo|metropole|peripherie|proche|banlieue|et plus|deplacements possibles|sur demande|nous consulter|me consulter|a discuter|selon distance|frais de deplacement.*)$/
const PREFIX = /^(toute la |tout le |toute l |tout l |toutes les |tous les |dans le |dans la |dans l |sur le |sur la |sur l |le departement d[eu] |departement d[eu] |departement |dept |dpt |agglomeration d[eu] |agglo d[eu] |metropole d[eu] |communaute d agglomeration d[eu] |communaute de communes d[eu] |grand |autour d[eu] |region d[eu] |la region |ville d[eu] |et )/
const REGION_ALIASES = { paca: "provence alpes cote d azur", provence: "provence alpes cote d azur", idf: 'ile de france', 'region parisienne': 'ile de france', aura: 'auvergne rhone alpes', auvergne: 'auvergne rhone alpes', 'rhone alpes': 'auvergne rhone alpes', bourgogne: 'bourgogne franche comte', 'franche comte': 'bourgogne franche comte', alsace: 'grand est', lorraine: 'grand est', champagne: 'grand est', aquitaine: 'nouvelle aquitaine', 'midi pyrenees': 'occitanie', languedoc: 'occitanie', 'languedoc roussillon': 'occitanie', picardie: 'hauts de france', 'nord pas de calais': 'hauts de france' }

// Ensembles de départements connus sous un autre nom
const AREAS = { 'petite couronne': ['92', '93', '94'], 'grande couronne': ['77', '78', '91', '95'], 'paris et petite couronne': ['75', '92', '93', '94'] }

/** Rayon en km écrit dans la zone (« + 30 km », « 30kms », « rayon de 40 ») */
export function rayonKm(text) {
  const s = normNom(text)
  const m = s.match(/(\d{1,3})\s?(km|kms|kilometres?)\b/) || s.match(/rayon (?:de )?(\d{1,3})\b/)
  const n = m ? Number(m[1]) : null
  return n && n >= 3 && n <= 400 ? n : null
}

/** Morceaux de la zone et des villes couvertes, dans l'ordre */
export function zoneTokens(zone, villes = []) {
  const parts = String(zone ?? '').replace(/\(([^)]*)\)/g, ', $1,')
    .split(/[,;·•|\/\n+]|\s[-–]\s|\bet\b|\bou\b/i)
  return [...parts, ...(Array.isArray(villes) ? villes : [])].map(t => String(t ?? '').trim()).filter(Boolean)
}

/** Ville principale de la fiche : sans code postal, arrondissement ni « Cedex » */
export function cleanVille(v) {
  const s = String(v ?? '').trim()
  const cp = (s.match(/\b(\d{2})\d{3}\b/) || [])[1] || null
  const nom = s.replace(/\b\d{5}\b/g, ' ').replace(/\bcedex\b.*$/i, ' ')
    .replace(/\s+\d{1,2}\s*(e|er|ere|eme|ème|è)?\s*(arr(ondissement)?\.?)?$/i, ' ')
    .replace(/\s+(centre|centre ville|nord|sud|est|ouest)$/i, ' ').replace(/\s+/g, ' ').trim()
  return { nom, dep: cp && cp !== '97' && cp !== '20' ? cp : null }
}

function findDep(n) {
  const d = departements()
  const code = n.match(/^(\d{2}|2a|2b|97\d)$/)
  if (code) return d.find(x => x.code.toLowerCase() === code[1]) || null
  return d.find(x => x.n === n) || null
}
function findRegion(n) {
  const target = REGION_ALIASES[n] || n
  return regions().find(r => r.n === target) || null
}
function pickNear(cands, ref, maxKm) {
  if (!cands?.length) return null
  if (!ref) return cands[0]
  let best = null, bd = Infinity
  for (const c of cands) { const d = distKm(ref, c.c); if (d < bd) { bd = d; best = c } }
  return bd <= maxKm ? best : null
}

/** Retrouve une commune dans un texte libre (nom exact, sans article, sans « Grand », mots du texte) */
function communeFrom(text, ref, maxKm, preferDep) {
  const idx = index()
  let n = normNom(text)
  for (let i = 0; i < 3 && PREFIX.test(n); i++) n = n.replace(PREFIX, '')
  const tries = [n, n.replace(/^(les|le|la|l) /, ''), `les ${n}`, `le ${n}`, `la ${n}`]
  let exact = null
  for (const t of tries) {
    let c = idx.get(t)
    if (!c) continue
    if (preferDep) { const same = c.filter(x => x.dep === preferDep); if (same.length) c = same }
    exact = pickNear(c, ref, maxKm)
    if (exact) break
  }
  // Nom abrégé (24/10/2026) : « Neuilly » écrit par un pro de Paris désignait la commune
  // nommée Neuilly à 68 km au lieu de Neuilly-sur-Seine à 8 km ; « LEVALLOIS » restait
  // introuvable. Une commune proche dont le nom commence par le texte l'emporte quand
  // elle est nettement plus près (ou quand rien ne porte exactement ce nom).
  if (ref && n.length >= 4) {
    let best = null, bd = Infinity
    for (const [k, list] of idx) {
      if (!k.startsWith(n + ' ')) continue
      for (const c of list) { const d = distKm(ref, c.c); if (d < bd) { bd = d; best = c } }
    }
    const de = exact ? distKm(ref, exact.c) : Infinity
    if (best && bd <= Math.min(maxKm, 60) && bd < de - 20) return best
  }
  return exact
}

/**
 * Le secteur d'une fiche : ville principale, rayon, communes, départements,
 * régions, France entière, et ce qui n'a pas pu être placé.
 */
export function resolveSecteur({ ville, zone, villes }) {
  const v = cleanVille(ville)
  const km = rayonKm(zone)
  const tokens = zoneTokens(zone, villes)
  const zn = normNom(zone)
  // Département cité dans la zone : aide à départager les homonymes
  const depHint = v.dep || tokens.map(t => { let n = normNom(t); for (let i = 0; i < 3 && PREFIX.test(n); i++) n = n.replace(PREFIX, ''); return findDep(n)?.code }).find(Boolean) || null
  let centre = communeFrom(v.nom, null, Infinity, depHint)
  if (!centre) for (const t of tokens) { centre = communeFrom(t, null, Infinity, depHint); if (centre) break }
  if (!centre) return null
  // Nom affiché : celui de la fiche quand il désigne bien la commune (« Les Sables-d'Olonne », pas « Sables-d'Olonne »)
  const art = x => x.replace(/^(les|le|la|l) /, '')
  const nom = v.nom && art(normNom(v.nom)) === art(centre.n) ? v.nom : centre.nom
  const out = { centre, nom, km, communes: [], deps: [], regions: [], france: FRANCE.test(zn), unknown: [] }
  const seen = new Set([centre.code])
  for (const t of tokens) {
    let n = normNom(t)
    if (!n || /\d\s?(km|kms|kilometres?)\b/.test(n) || /^rayon/.test(n)) continue
    if (FRANCE.test(n)) { out.france = true; continue }
    for (let i = 0; i < 3 && PREFIX.test(n); i++) n = n.replace(PREFIX, '')
    if (!n || IGNORE.test(n)) continue
    // Commune citée : la plus proche des homonymes, en France métropolitaine (avant le 20/10/2026 :
    // rien au-delà de 250 km, Nantes oubliée pour un pro de Paris qui travaille aussi à Nantes)
    // Ville proche d'abord, puis département ou région (« Toute la Bretagne » n'est pas la commune
    // de Bretagne, dans le Territoire de Belfort), puis une ville éloignée
    if (addCommune(out, seen, withNom(communeFrom(t, centre.c, 250), t))) continue
    if (addArea(out, n)) continue
    if (addCommune(out, seen, withNom(communeFrom(t, centre.c, 1100), t))) continue
    // « Paris Ile de France », « Lille Nord » : une commune suivie d'une région ou d'un département
    const w = n.split(' ')
    let split = false
    for (let i = w.length - 1; i >= 1 && !split; i--) {
      const head = w.slice(0, i).join(' '), tail = w.slice(i).join(' ')
      if (!findDep(tail) && !AREAS[tail] && !findRegion(tail)) continue
      const c = communeFrom(head, centre.c, 1100)
      if (!c && !findDep(head) && !findRegion(head)) continue
      if (c) addCommune(out, seen, withNom(c, w.slice(0, i).join(' '))); else addArea(out, head)
      addArea(out, tail)
      split = true
    }
    if (split) continue
    if (!out.unknown.includes(t.trim())) out.unknown.push(t.trim())
  }
  out.poles = poles(out)
  out.multi = out.poles.length > 1
  return out
}

/** Les données IGN n'ont pas l'article (« Mans ») : nom écrit par le pro quand il le porte (« Le Mans ») */
function withNom(c, typed) {
  if (!c) return c
  let n = normNom(typed)
  for (let i = 0; i < 3 && PREFIX.test(n); i++) n = n.replace(PREFIX, '')
  const m = n.match(/^(les|le|la|l) (.+)$/)
  if (!m || m[2] !== c.n) return c
  const art = { les: 'Les ', le: 'Le ', la: 'La ', l: 'L’' }[m[1]]
  return { ...c, nom: art + c.nom }
}

function addCommune(out, seen, c) {
  if (!c) return false
  if (c.code !== out.centre.code && !seen.has(c.code)) { seen.add(c.code); out.communes.push(c) }
  return true
}
function addArea(out, n) {
  const d = findDep(n)
  if (d) { if (!out.deps.includes(d.code)) out.deps.push(d.code); return true }
  const area = AREAS[n]
  if (area) { for (const code of area) if (!out.deps.includes(code)) out.deps.push(code); return true }
  const r = findRegion(n)
  if (r) { if (!out.regions.includes(r.nom)) out.regions.push(r.nom); for (const code of r.deps) if (!out.deps.includes(code)) out.deps.push(code); return true }
  return false
}

/** Au-delà de cette distance de la ville principale, une ville citée ouvre un autre secteur */
export const MULTI_KM = 100
const POLE_KM = 60
const regionOf = dep => regions().find(r => r.deps.includes(dep))?.nom ?? null

/**
 * Secteurs d'un pro qui travaille dans des villes éloignées (20/10/2026, Paris, Lille, Le Mans,
 * Nantes) : la ville principale et chaque ville citée à plus de MULTI_KM, les villes proches
 * rangées dans le secteur le plus près. Un seul secteur = la carte habituelle (ville + rayon).
 */
export function poles(sec) {
  const out = [{ a: sec.centre, villes: [] }]
  const far = sec.communes.filter(c => distKm(sec.centre.c, c.c) > MULTI_KM).sort((x, y) => distKm(sec.centre.c, x.c) - distKm(sec.centre.c, y.c))
  for (const c of far) if (!out.some(p => distKm(p.a.c, c.c) <= POLE_KM)) out.push({ a: c, villes: [] })
  for (const c of sec.communes) {
    if (out.some(p => p.a.code === c.code)) continue
    let best = out[0], bd = Infinity
    for (const p of out) { const d = distKm(p.a.c, c.c); if (d < bd) { bd = d; best = p } }
    best.villes.push(c)
  }
  return out.map((p, i) => {
    const reg = regionOf(p.a.dep)
    // « Paris et Île-de-France » quand la région du secteur est citée en entier
    const nom = i === 0 ? sec.nom : p.a.nom
    const label = reg && sec.regions.includes(reg) ? `${nom} et ${reg}` : i === 0 && sec.km ? `${nom} et ${sec.km} km autour` : nom
    return { a: p.a, nom, label, region: reg, villes: p.villes }
  })
}

// ── Dessin ─────────────────────────────────────────────────────────
const W = 600
const BUDGET = 46000 // caractères de la carte entière, avant compression (~10 Ko une fois compressée)

function view(sec) {
  const pts = []
  const add = (x, y) => pts.push([x, y])
  const { centre, km } = sec
  if (sec.france) { for (const d of departements()) if (/^\d{2}$|^2[ab]$/i.test(d.code)) { add(d.bb[0], d.bb[1]); add(d.bb[2], d.bb[3]) } }
  if (km) { const dl = km / 111 * Q, dx = dl / Math.cos(centre.c[1] / Q * Math.PI / 180); add(centre.c[0] - dx, centre.c[1] - dl); add(centre.c[0] + dx, centre.c[1] + dl) }
  for (const c of sec.communes) add(...c.c)
  for (const code of sec.deps) { const d = departements().find(x => x.code === code); if (d) { add(d.bb[0], d.bb[1]); add(d.bb[2], d.bb[3]) } }
  add(...centre.c)
  let x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]))
  // Seule la ville : une fenêtre d'environ 30 km
  const minSpan = 0.27 * Q
  if (y1 - y0 < minSpan) { const m = (y0 + y1) / 2; y0 = m - minSpan / 2; y1 = m + minSpan / 2 }
  const kx = Math.cos((y0 + y1) / 2 / Q * Math.PI / 180)
  if ((x1 - x0) * kx < minSpan) { const m = (x0 + x1) / 2, h = minSpan / kx / 2; x0 = m - h; x1 = m + h }
  const px = (x1 - x0) * 0.12, py = (y1 - y0) * 0.12
  x0 -= px; x1 += px; y0 -= py; y1 += py
  // Proportions entre 0,62 et 1 (ni bandeau, ni tour)
  let w = (x1 - x0) * kx, h = y1 - y0
  if (h / w < 0.62) { const nh = w * 0.62, m = (y0 + y1) / 2; y0 = m - nh / 2; y1 = m + nh / 2; h = nh }
  if (h / w > 1) { const nw = h, m = (x0 + x1) / 2; x0 = m - nw / kx / 2; x1 = m + nw / kx / 2; w = nw }
  const s = W / w
  return { x0, x1, y0, y1, kx, s, H: Math.round(h * s) }
}

function tracer(v, rings, tol) {
  let d = ''
  for (const enc of rings) {
    const pts = decode(enc)
    let last = null, out = ''
    let n = 0
    for (const [x, y] of pts) {
      const q = [Math.round((x - v.x0) * v.kx * v.s), Math.round((v.y1 - y) * v.s)]
      if (last && Math.abs(q[0] - last[0]) + Math.abs(q[1] - last[1]) < tol) continue
      out += (n ? 'L' : 'M') + q[0] + ' ' + q[1]
      last = q; n++
    }
    if (n > 2) d += out + 'Z'
  }
  return d
}

export function secteurMap(sec) {
  const v = view(sec)
  const P = ([x, y]) => [Math.round((x - v.x0) * v.kx * v.s), Math.round((v.y1 - y) * v.s)]
  const inView = b => !(b[2] < v.x0 || b[0] > v.x1 || b[3] < v.y0 || b[1] > v.y1)
  const depsInView = departements().filter(d => inView(d.bb))
  const zoneDeps = new Set(sec.france ? departements().map(d => d.code) : sec.deps)
  const C = P(sec.centre.c)
  const rPx = sec.km ? sec.km / 111 * Q * v.s : 0
  const inCircle = c => sec.km && distKm(sec.centre.c, c.c) <= sec.km
  const covered = new Set(sec.communes.map(c => c.code))

  // Communes dessinées : celles du rayon, celles citées, la ville ; celles d'un département cité si la carte reste lisible
  const big = sec.france || zoneDeps.size > 2
  // Seule la ville est connue : les communes voisines en simple trait, pour se repérer
  const seule = !sec.km && !zoneDeps.size && !sec.france
  const cand = []
  let nbRayon = 0
  if (!sec.france) for (const d of depsInView) for (const c of communesOf(d.code)) {
    if (!inView(c.bb)) continue
    const inR = inCircle(c)
    if (inR) nbRayon++
    const cls = c.code === sec.centre.code ? 'mc' : covered.has(c.code) ? 'cv' : inR ? 'ic' : (!big && zoneDeps.has(c.dep)) ? 'id' : seule ? 'nb' : null
    if (cls) cand.push([c, cls])
  }
  // Fond : un seul tracé pour la terre et les limites des départements ; départements de la zone par-dessus
  const depTol = sec.france ? 3 : sec.multi ? 4 : 2
  let land = '', depZone = '', depLbl = ''
  const lblBoxes = []
  for (const d of depsInView) {
    const p = tracer(v, d.r, depTol)
    if (!p) continue
    land += p
    if (!sec.france && zoneDeps.has(d.code)) depZone += `<path class="dz" data-n="${esc(d.nom)}" d="${p}"/>`
  }
  const budget = Math.max(6000, BUDGET - land.length - depZone.length)
  let comm = '', texture = true
  const draw = (c, cls, tol) => { const d = tracer(v, c.r, tol); return d ? `<path class="${cls}" data-n="${esc(c.nom)}"${sec.multi ? '' : ` data-d="${Math.round(distKm(sec.centre.c, c.c))}"`} d="${d}"/>` : '' }
  for (const tol of [2, 3, 4, 6, 9]) {
    comm = cand.map(([c, cls]) => draw(c, cls, cls === 'ic' || cls === 'id' || cls === 'nb' ? tol : 2)).join('')
    if (comm.length <= budget) break
    if (tol === 9) { texture = false; comm = cand.filter(([, cls]) => cls === 'mc' || cls === 'cv').map(([c, cls]) => draw(c, cls, 2)).join('') }
  }
  if (!sec.france && !sec.multi) for (const d of depsInView) {
    const [lx, ly] = P(d.c)
    if (lx < 50 || lx > W - 50 || ly < 18 || ly > v.H - 14) continue
    if (rPx && Math.hypot(lx - C[0], ly - C[1]) < rPx + 10) continue
    if (Math.hypot(lx - C[0], ly - C[1]) < 40) continue
    lblBoxes.push([lx - 50, ly - 10, lx + 50, ly + 4])
    depLbl += `<text class="dl" x="${lx}" y="${ly}">${esc(d.nom.toUpperCase())}</text>`
  }
  // Étiquettes des villes sans chevauchement
  const boxes = [[C[0] - 8, C[1] - 24, C[0] + 12 + sec.nom.length * 8, C[1] + 8], ...lblBoxes]
  const hit = b => b[0] < 2 || b[2] > W - 2 || b[1] < 2 || b[3] > v.H - 2 || boxes.some(o => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]))
  // Plusieurs secteurs (France entière ou presque) : points seulement, les noms des secteurs
  // sont posés en pastilles HTML par-dessus la carte (lisibles au téléphone, voir polePills)
  const labels = sec.multi ? sec.communes.map(c => {
    const [x, y] = P(c.c)
    const pole = sec.poles.some(p => p.a.code === c.code)
    return `<g class="lb${pole ? ' pole' : ''}"><circle cx="${x}" cy="${y}" r="${pole ? 7 : 3}"/></g>`
  }).join('') : sec.communes.map(c => {
    const [x, y] = P(c.c), w = c.nom.length * 6.8
    const t = [[x + 6, y + 4, 'start', [x + 4, y - 8, x + 8 + w, y + 6]], [x - 6, y + 4, 'end', [x - 8 - w, y - 8, x - 4, y + 6]], [x, y - 8, 'middle', [x - w / 2, y - 20, x + w / 2, y - 6]], [x, y + 17, 'middle', [x - w / 2, y + 5, x + w / 2, y + 19]]].find(t => !hit(t[3]))
    if (t) boxes.push(t[3])
    const pole = sec.multi && sec.poles.some(p => p.a.code === c.code)
    return `<g class="lb${pole ? ' pole' : ''}"><circle cx="${x}" cy="${y}" r="${pole ? 6 : 3.2}"/>${t ? `<text x="${Math.round(t[0])}" y="${Math.round(t[1])}" text-anchor="${t[2]}">${esc(c.nom)}</text>` : ''}</g>`
  }).join('')
  const right = C[0] > W - 160
  const svg = `<svg class="sct-svg" viewBox="0 0 ${W} ${v.H}" role="img" aria-label="Carte du secteur : ${esc(sec.nom)}" data-p="${v.x0.toFixed(1)},${v.y1.toFixed(1)},${(v.kx * v.s).toFixed(5)},${v.s.toFixed(5)}"><path class="land${sec.france ? ' fr' : ''}${sec.multi ? ' mt' : ''}" d="${land}"/>${depZone}${comm}${rPx ? `<circle class="rad${texture ? '' : ' fill'}" cx="${C[0]}" cy="${C[1]}" r="${Math.round(rPx)}"/>` : ''}${depLbl}${labels}<g class="ctr"><circle cx="${C[0]}" cy="${C[1]}" r="${sec.multi ? 7 : 6}"/>${sec.multi ? '' : `<text x="${right ? C[0] - 10 : C[0] + 10}" y="${C[1] - 9}" text-anchor="${right ? 'end' : 'start'}">${esc(sec.nom)}</text>`}</g>${rPx && rPx > 40 ? `<text class="radl" x="${Math.round(C[0] + rPx * 0.71 + 4)}" y="${Math.round(C[1] + rPx * 0.71 + 12)}">${sec.km} km</text>` : ''}</svg>`
  return { svg, view: v, nbRayon, texture, pills: sec.multi ? polePills(sec, P, v) : '' }
}

/**
 * Noms des secteurs en pastilles au-dessus de la carte (en %, donc à la même taille sur tous
 * les écrans). À droite du point, à gauche près du bord droit ; décalées si elles se chevauchent.
 */
function polePills(sec, P, v) {
  // Les points des secteurs sont des obstacles : une pastille ne cache jamais un point
  const placed = sec.poles.map(p => { const [x, y] = P(p.a.c); return [x - 9, y - 9, 18, 18] })
  return sec.poles.map((p, i) => {
    const [x, y] = P(p.a.c)
    const name = i === 0 ? sec.nom : p.a.nom
    const w = name.length * 7.6 + 22, h = 24
    const raw = [[x + 12, y - h / 2], [x - 12 - w, y - h / 2], [x - w / 2, y - 14 - h], [x - w / 2, y + 14]]
    const inside = ([bx, by]) => bx >= 4 && by >= 4 && bx + w <= W - 4 && by + h <= v.H - 4
    const clamp = ([bx, by]) => [Math.min(Math.max(bx, 4), W - w - 4), Math.min(Math.max(by, 4), v.H - h - 4)]
    const free = b => !placed.some(o => b[0] < o[0] + o[2] && o[0] < b[0] + w && b[1] < o[1] + o[3] && o[1] < b[1] + h)
    const pick = raw.find(c => inside(c) && free(c)) ?? raw.map(clamp).find(c => free(c)) ?? clamp(raw[0])
    placed.push([pick[0], pick[1], w, h])
    return `<button type="button" class="sct-pill" data-n="${esc(p.a.nom)}" style="left:${(pick[0] / W * 100).toFixed(2)}%;top:${(pick[1] / v.H * 100).toFixed(2)}%">${esc(name)}</button>`
  }).join('')
}

let _inset = null
function insetPaths() {
  if (_inset) return _inset
  const v = { x0: -5300, y1: 51400, kx: 0.69, s: 0.0072 }
  _inset = departements().filter(d => /^\d{2}$|^2[ab]$/i.test(d.code)).map(d => tracer(v, d.r, 1.2)).join('')
  return _inset
}
function insetHtml(v) {
  const p = ([x, y]) => [Math.round((x + 5300) * 0.69 * 0.0072), Math.round((51400 - y) * 0.0072)]
  const [a, b] = p([v.x0, v.y1]), [c, d] = p([v.x1, v.y0])
  return `<svg class="sct-inset" viewBox="0 0 74 74" aria-hidden="true"><path d="${insetPaths()}"/><rect x="${a}" y="${b}" width="${Math.max(3, c - a)}" height="${Math.max(3, d - b)}"/></svg>`
}

/** Départements où chercher la commune de l'hôte (fichiers /geo/communes/<dep>.json) */
function searchDeps(sec, v) {
  if (sec.france) return []
  if (sec.multi) {
    // Autour de chaque secteur : ses départements les plus proches (fichiers chargés au premier clic)
    const list = []
    const per = Math.max(2, Math.floor(16 / sec.poles.length))
    for (const p of sec.poles) for (const d of [...departements()].sort((a, b) => distKm(p.a.c, a.c) - distKm(p.a.c, b.c)).slice(0, per)) if (!list.includes(d.code)) list.push(d.code)
    for (const code of sec.deps) if (list.length < 20 && !list.includes(code)) list.push(code)
    return list.slice(0, 20)
  }
  const pad = Math.max((v.x1 - v.x0), (v.y1 - v.y0)) * 0.3
  const list = departements().filter(d => !(d.bb[2] < v.x0 - pad || d.bb[0] > v.x1 + pad || d.bb[3] < v.y0 - pad || d.bb[1] > v.y1 + pad))
    .sort((a, b) => distKm(sec.centre.c, a.c) - distKm(sec.centre.c, b.c)).map(d => d.code)
  for (const c of sec.communes) if (!list.includes(c.dep)) list.push(c.dep)
  return list.slice(0, 10)
}

const de = v => /^les\s/i.test(v) ? `des ${v.slice(4)}` : /^le\s/i.test(v) ? `du ${v.slice(3)}` : /^[aeiouyhâéèêîôû]/i.test(v) ? `d’${v}` : `de ${v}`

/**
 * Carte « Où j'interviens » prête à poser sur la fiche, ou null si la ville
 * n'a pas été retrouvée (la fiche garde alors l'ancienne carte).
 */
export function secteurHtml({ ville, zone, villes, prenom, metier, annot = '', compact = false, title = 'Où j’interviens' }) {
  const sec = resolveSecteur({ ville, zone, villes })
  if (!sec) return null
  const { svg, view: v, nbRayon, pills } = secteurMap(sec)
  const dist = sec.communes.map(c => ({ c, km: Math.round(distKm(sec.centre.c, c.c)) })).sort((a, b) => a.km - b.km)
  const far = dist[dist.length - 1]
  const depNames = sec.deps.map(code => departements().find(d => d.code === code)?.nom).filter(Boolean)
  const stats = []
  if (sec.multi) {
    // Plusieurs secteurs : leur nombre et leurs régions, jamais « X km jusqu'à … » (20/10/2026)
    const regs = [...new Set(sec.poles.map(p => p.region).filter(Boolean))]
    stats.push([`${sec.poles.length} secteurs`, regs.join(' · ') || 'villes éloignées'])
    if (sec.km) stats.push([String(nbRayon), `communes à moins de ${sec.km} km ${de(sec.nom)}`])
  } else {
    if (sec.france) stats.push(['Toute la France', 'se déplace partout'])
    if (sec.km) stats.push([String(nbRayon), `communes à moins de ${sec.km} km ${de(sec.nom)}`])
    if (sec.regions.length) stats.push([sec.regions.join(', '), sec.regions.length > 1 ? 'régions entières' : 'région entière'])
    else if (depNames.length) stats.push([depNames.length > 2 ? `${depNames.length} départements` : depNames.join(', '), depNames.length > 1 ? 'départements entiers' : 'département entier'])
    if (far && (!sec.km || far.km > sec.km)) stats.push([`${far.km} km`, `jusqu’à ${far.c.nom}`])
    else if (far) stats.push([`${dist.length} ville${dist.length > 1 ? 's' : ''}`, 'citées par ' + prenom])
  }
  const chips = sec.multi ? [
    // Une pastille par secteur, ses villes proches écrites dedans (« Lille + Roubaix, Tourcoing »)
    ...sec.poles.map(p => `<button type="button" class="sct-chip pole" data-n="${esc(p.a.nom)}">${esc(p.label)}${p.villes.length ? ` <small>+ ${esc(p.villes.slice(0, 4).map(c => c.nom).join(', '))}${p.villes.length > 4 ? '…' : ''}</small>` : ''}</button>`),
    ...sec.unknown.slice(0, 6).map(u => `<span class="sct-chip txt">${esc(u)}</span>`),
  ].join('') : [
    ...dist.map(({ c, km }) => `<button type="button" class="sct-chip" data-n="${esc(c.nom)}">${esc(c.nom)} <small>${km} km</small></button>`),
    ...depNames.slice(0, 6).map(n => `<button type="button" class="sct-chip dep" data-n="${esc(n)}">${esc(n)}</button>`),
    ...sec.unknown.slice(0, 6).map(u => `<span class="sct-chip txt">${esc(u)}</span>`),
  ].join('')
  const data = {
    v: sec.nom, c: [sec.centre.c[0] / Q, sec.centre.c[1] / Q], km: sec.km, fr: sec.france, p: prenom,
    d: sec.deps, dn: depNames, cv: sec.communes.map(c => c.nom), s: searchDeps(sec, v), m: metier,
    ...(sec.multi ? { po: sec.poles.map(p => ({ n: p.a.code === sec.centre.code ? sec.nom : p.a.nom, c: [p.a.c[0] / Q, p.a.c[1] / Q] })) } : {}),
  }
  // Version compacte des fiches v3 (24/10/2026, Jason : « la partie demande est un peu
  // chiante, il y en a trop ») : 2 chiffres, sans le champ « Ton logement est à… »
  return `<section class="card vt-sec sct${compact ? ' sct-c' : ''}" id="zone" style="position:relative">${annot}
  <h2>${esc(title)}</h2>
  ${stats.length ? `<div class="sct-stats">${stats.slice(0, compact ? 2 : 3).map(([a, b]) => `<div><div class="sct-v">${esc(a)}</div><div class="sct-l">${esc(b)}</div></div>`).join('')}</div>` : ''}
  <div class="sct-map">${svg}${pills}${sec.france || sec.multi ? '' : insetHtml(v)}<div class="sct-tip" hidden></div></div>
  ${chips ? `<div class="sct-chips">${chips}</div>` : ''}
  ${compact ? '' : `<div class="sct-find">
    <label for="sct-q">Ton logement est à…</label>
    <div class="sct-in"><i class="ph-bold ph-magnifying-glass" aria-hidden="true"></i><input id="sct-q" type="text" autocomplete="off" spellcheck="false" placeholder="Tape ta commune" aria-describedby="sct-r"></div>
    <div class="sct-sug" role="listbox" hidden></div>
    <p class="sct-r" id="sct-r" aria-live="polite"></p>
  </div>`}
  <p class="sct-cap">${compact ? 'Un peu plus loin ? Demande quand même : beaucoup de pros se déplacent. Contours IGN (Licence Ouverte).' : 'Distances à vol d’oiseau. Ton logement est un peu plus loin ? Demande quand même : beaucoup de pros se déplacent. Contours : IGN Admin Express (Licence Ouverte).'}</p>
  <script type="application/json" class="sct-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>`
}

export const SECTEUR_CSS = `
.sct-stats{display:flex;flex-wrap:wrap;gap:12px 22px;margin:0 0 14px}
.sct-stats>div{border-left:2px solid var(--g);padding-left:11px;min-width:0}
.sct-v{font-family:'Fraunces',serif;font-size:21px;line-height:1.15;color:var(--td)}
.sct-l{font-size:12px;color:var(--tl);margin-top:2px}
.sct-map{position:relative;border-radius:12px;overflow:hidden;background:#E8EEEA}
.sct-svg{display:block;width:100%;height:auto;touch-action:manipulation}
.sct-svg .land{fill:#FBFAF6;stroke:#B6C0BA;stroke-width:1;stroke-linejoin:round}
.sct-svg .land.fr{fill:rgba(0,76,63,.1);stroke:rgba(0,76,63,.35)}
.sct-svg .rad.fill{fill:rgba(0,76,63,.08)}
.sct-svg .dz{fill:rgba(0,76,63,.09);stroke:var(--g);stroke-width:1.6;stroke-linejoin:round}
.sct-svg .ic,.sct-svg .id{fill:rgba(0,76,63,.07);stroke:rgba(0,76,63,.17);stroke-width:.6}
.sct-svg .nb{fill:transparent;stroke:rgba(0,76,63,.16);stroke-width:.6}
.sct-svg .nb:hover{fill:rgba(0,76,63,.1)}
.sct-svg .cv{fill:rgba(0,76,63,.42);stroke:#fff;stroke-width:1}
.sct-svg .mc{fill:var(--g)}
.sct-svg path[data-d]{cursor:pointer;transition:fill .15s}
.sct-svg .ic:hover,.sct-svg .id:hover{fill:rgba(0,76,63,.2)}
.sct-svg path.hl{fill:#FFD56B!important;stroke:var(--g)}
.sct-svg .rad{fill:none;stroke:var(--g);stroke-dasharray:6 6;stroke-width:1.5;pointer-events:none}
.sct-svg text{font-family:'Outfit',sans-serif;pointer-events:none}
.sct-svg .dl{font-size:10px;font-weight:600;fill:#8A958F;letter-spacing:1.5px;text-anchor:middle}
.sct-svg .lb{pointer-events:none}
.sct-svg .lb circle{fill:var(--g)}
.sct-svg .lb text,.sct-svg .ctr text,.sct-svg .pin text{font-size:12.5px;font-weight:600;fill:var(--td);paint-order:stroke;stroke:#fff;stroke-width:3.5px;stroke-linejoin:round}
.sct-svg .ctr{pointer-events:none}
.sct-svg .ctr circle{fill:#FFD56B;stroke:var(--g);stroke-width:2.2}
.sct-svg .lb.pole circle{fill:#FFD56B;stroke:var(--g);stroke-width:2.2}
.sct-svg .lb.pole text{font-size:14px}
.sct-chip.pole{font-weight:600}
.sct-svg .land.mt{stroke:#DCE3DE;stroke-width:.7}
.sct-pill{position:absolute;z-index:1;font:600 13px/1 'Outfit',sans-serif;color:var(--td);background:#fff;border:1.5px solid var(--g);border-radius:999px;padding:5px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,40,30,.12);cursor:pointer}
.sct-pill.on,.sct-pill:hover{background:var(--g);color:#fff}
.sct-chip.pole small{font-weight:400;color:var(--tl);margin-left:2px}
.sct-svg .ctr text{font-size:14px}
.sct-svg .radl{font-size:11.5px;font-weight:600;fill:var(--g);paint-order:stroke;stroke:#E8EEEA;stroke-width:3px}
.sct-svg .pin{pointer-events:none}
.sct-svg .pin circle{fill:#B4466B;stroke:#fff;stroke-width:2}
.sct-inset{position:absolute;right:10px;top:10px;width:58px;height:58px;padding:4px;border-radius:8px;background:rgba(255,255,255,.88);pointer-events:none}
.sct-inset path{fill:#E1E7E3;stroke:#C2CBC5;stroke-width:.4}
.sct-inset rect{fill:rgba(0,76,63,.28);stroke:var(--g);stroke-width:1.2}
.sct-tip{position:absolute;pointer-events:none;background:#13241F;color:#fff;font-size:12.5px;line-height:1.35;padding:6px 10px;border-radius:8px;white-space:nowrap;transform:translate(-50%,-125%);z-index:2}
.sct-tip[hidden]{display:none}
.sct-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.sct-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#F1F5F2;border:1px solid rgba(0,76,63,.14);color:var(--g);font:600 13px 'Outfit',sans-serif;text-decoration:none;cursor:pointer}
.sct-chip small{font-weight:500;color:var(--tl)}
.sct-chip.on{background:var(--g);border-color:var(--g);color:#fff}
.sct-chip.on small{color:rgba(255,255,255,.75)}
.sct-chip.txt{background:#fff;cursor:default;font-weight:500}
.sct-chip:focus-visible{outline:2px solid #FFD56B;outline-offset:2px}
.sct-find{position:relative;margin-top:18px;padding-top:16px;border-top:1px solid var(--bd)}
.sct-find label{display:block;font-size:13px;font-weight:600;color:var(--td);margin-bottom:8px}
.sct-in{display:flex;align-items:center;gap:8px;border:1.5px solid rgba(0,76,63,.16);border-radius:12px;padding:0 13px;background:#fff}
.sct-in:focus-within{border-color:var(--g);box-shadow:0 0 0 3px rgba(0,76,63,.1)}
.sct-in i{color:var(--tl)}
.sct-in input{flex:1;min-width:0;border:0;outline:0;padding:12px 0;font:400 16px 'Outfit',sans-serif;color:var(--td);background:transparent}
.sct-sug{position:absolute;left:0;right:0;z-index:5;margin-top:6px;background:#fff;border:1px solid rgba(0,76,63,.14);border-radius:12px;box-shadow:0 14px 34px rgba(0,26,17,.12);overflow:hidden}
.sct-sug[hidden]{display:none}
.sct-sug button{display:flex;justify-content:space-between;gap:12px;width:100%;padding:11px 14px;border:0;background:none;text-align:left;font:400 14.5px 'Outfit',sans-serif;color:var(--td);cursor:pointer}
.sct-sug button small{color:var(--tl)}
.sct-sug button:hover,.sct-sug button.on{background:#F1F5F2}
.sct-r{margin:10px 0 0;font-size:14px;line-height:1.55;color:var(--tm)}
.sct-r:empty{display:none}
.sct-r b{color:var(--td)}
.sct-r .ok{color:#1e7a46;font-weight:600}
.sct-r .near{color:#8A5A12;font-weight:600}
.sct-r .far{color:#B4466B;font-weight:600}
.sct-r a{color:var(--g);font-weight:600}
.sct-cap{font-size:11.5px;color:var(--tl);line-height:1.55;margin-top:12px}
@media(max-width:560px){.sct-pill{font-size:11.5px;padding:4px 8px}.sct-svg .lb.pole circle{r:10}.sct-inset{width:46px;height:46px}.sct-v{font-size:19px}.sct-svg .lb text{display:none}.sct-svg .lb circle{r:5}.sct-svg .ctr text{font-size:25px;stroke-width:6px}.sct-svg .ctr circle{r:9}.sct-svg .dl{font-size:17px}.sct-svg .radl{font-size:19px;stroke-width:5px}.sct-svg .pin text{font-size:22px;stroke-width:6px}.sct-svg .pin circle{r:9}}
`

/** Survol, toucher, liste des villes et recherche de la commune de l'hôte */
export const SECTEUR_JS = `<script>
(function(){
  var box=document.querySelector('.sct');if(!box)return;
  var D=JSON.parse(box.querySelector('.sct-data').textContent),svg=box.querySelector('.sct-svg'),tip=box.querySelector('.sct-tip'),map=box.querySelector('.sct-map');
  var P=svg.getAttribute('data-p').split(',').map(Number),NS='http://www.w3.org/2000/svg';
  function n(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/œ/g,'oe').replace(/['’\\-_.]/g,' ').replace(/\\bst\\b/g,'saint').replace(/\\bste\\b/g,'sainte').replace(/\\s+/g,' ').trim()}
  function de(v){return /^les\\s/i.test(v)?'des '+v.slice(4):/^le\\s/i.test(v)?'du '+v.slice(3):/^[aeiouyhâéèêîôû]/i.test(v)?'d’'+v:'de '+v}
  function km(a,b){var r=Math.PI/180,h=Math.pow(Math.sin((b[1]-a[1])*r/2),2)+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.pow(Math.sin((b[0]-a[0])*r/2),2);return 2*6371*Math.asin(Math.sqrt(h))}
  function e(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function xy(lon,lat){return[(lon*1000-P[0])*P[2],(P[1]-lat*1000)*P[3]]}
  function place(x,y){var r=map.getBoundingClientRect(),vb=svg.viewBox.baseVal,k=r.width/vb.width;tip.style.left=Math.min(Math.max(x*k,90),r.width-90)+'px';tip.style.top=Math.max(y*k,44)+'px'}
  function show(p,ev){
    var d=p.getAttribute('data-d');
    tip.innerHTML='<b>'+e(p.getAttribute('data-n'))+'</b>'+(d!==null?' · '+d+' km '+e(de(D.v)):'');
    tip.hidden=false;
    if(ev&&ev.clientX!=null){var r=map.getBoundingClientRect();tip.style.left=Math.min(Math.max(ev.clientX-r.left,90),r.width-90)+'px';tip.style.top=Math.max(ev.clientY-r.top,44)+'px'}
    else{var b=p.getBBox();place(b.x+b.width/2,b.y)}
  }
  function clear(){[].forEach.call(box.querySelectorAll('.hl,.sct-chip.on,.sct-pill.on'),function(x){x.classList.remove('hl');x.classList.remove('on')});var pin=svg.querySelector('.pin');if(pin)pin.remove()}
  svg.addEventListener('pointermove',function(ev){var p=ev.target.closest('path[data-n]');if(p&&ev.pointerType==='mouse')show(p,ev);else if(ev.pointerType==='mouse'&&!svg.querySelector('.hl'))tip.hidden=true});
  svg.addEventListener('pointerleave',function(){if(!svg.querySelector('.hl'))tip.hidden=true});
  svg.addEventListener('click',function(ev){var p=ev.target.closest('path[data-n]');clear();if(!p){tip.hidden=true;return}p.classList.add('hl');var c=box.querySelector('.sct-chip[data-n="'+p.getAttribute('data-n').replace(/"/g,'\\\\"')+'"]');if(c)c.classList.add('on');show(p,ev)});
  box.addEventListener('click',function(ev){
    var c=ev.target.closest('button.sct-chip,button.sct-pill');if(!c)return;
    var name=c.getAttribute('data-n'),p=svg.querySelector('path[data-n="'+name.replace(/"/g,'\\\\"')+'"]');
    var was=c.classList.contains('on');clear();if(was){tip.hidden=true;return}
    c.classList.add('on');if(p){p.classList.add('hl');show(p)}else tip.hidden=true;
  });
  // Recherche de la commune de l'hôte
  var q=box.querySelector('#sct-q'),sug=box.querySelector('.sct-sug'),res=box.querySelector('.sct-r'),list=null,loading=null,items=[],act=-1;
  if(!q)return;
  function load(){
    if(list||loading)return loading;
    loading=Promise.all(D.s.map(function(dep){return fetch('/geo/communes/'+dep+'.json').then(function(r){return r.ok?r.json():[]}).then(function(a){return a.map(function(x){return{nom:x[0],lat:x[1],lon:x[2],dep:dep,n:n(x[0])}})}).catch(function(){return[]})}))
      .then(function(all){list=[].concat.apply([],all);return list});
    return loading;
  }
  q.addEventListener('focus',load);
  // Plusieurs secteurs : distance au secteur le plus proche (20/10/2026)
  function nearest(pt){
    if(!D.po)return{d:km(D.c,pt),v:D.v};
    var b=null;D.po.forEach(function(p){var d=km(p.c,pt);if(!b||d<b.d)b={d:d,v:p.n}});return b;
  }
  function verdict(c){
    var nr=nearest([c.lon,c.lat]),d=Math.round(nr.d),loin=de(nr.v),cv=D.cv.some(function(x){return n(x)===c.n});
    var dep=D.d.indexOf(c.dep)>=0,depNom=D.dn[D.d.indexOf(c.dep)];
    var where='<b>'+e(c.nom)+'</b> est à '+d+' km '+e(loin)+'.';
    if(D.fr)return '<span class="ok">Oui.</span> '+e(D.p)+' se déplace dans toute la France. '+where;
    if(c.n===n(D.v))return '<span class="ok">Oui.</span> C’est la ville principale '+(D.m==='menage'?'de l’équipe':'de '+e(D.p))+'.';
    if(cv)return '<span class="ok">Oui.</span> '+e(c.nom)+' fait partie des villes indiquées par '+e(D.p)+' ('+d+' km '+e(loin)+').';
    if(dep)return '<span class="ok">Oui.</span> '+e(c.nom)+' est dans le département indiqué ('+e(depNom)+'), à '+d+' km '+e(loin)+'.';
    if(D.km&&d<=D.km)return '<span class="ok">Oui.</span> '+where+' C’est dans le rayon de '+D.km+' km.';
    if(D.po&&d<=15)return '<span class="ok">Oui.</span> '+where+' C’est un de ses secteurs.';
    var near=D.km?d<=D.km*1.25+8:d<=25;
    if(near)return '<span class="near">Juste à côté.</span> '+where+' Écris à '+e(D.p)+' : un déplacement est souvent possible.';
    return '<span class="far">Un peu loin.</span> '+where+' Tu peux écrire à '+e(D.p)+' quand même, ou <a href="/trouver-un-pro?metier='+(D.m==='menage'?'menage':'photographe')+'&ville='+encodeURIComponent(c.nom)+'">décrire ton besoin aux pros proches de chez toi</a>.';
  }
  function pick(c){
    q.value=c.nom;sug.hidden=true;clear();
    res.innerHTML=verdict(c);
    var p=svg.querySelector('path[data-n="'+c.nom.replace(/"/g,'\\\\"')+'"]');
    if(p){p.classList.add('hl');show(p);return}
    var pt=xy(c.lon,c.lat),vb=svg.viewBox.baseVal;
    if(pt[0]<0||pt[1]<0||pt[0]>vb.width||pt[1]>vb.height){tip.hidden=true;return}
    var g=document.createElementNS(NS,'g');g.setAttribute('class','pin');
    var ci=document.createElementNS(NS,'circle');ci.setAttribute('cx',pt[0]);ci.setAttribute('cy',pt[1]);ci.setAttribute('r','6');
    var t=document.createElementNS(NS,'text');t.setAttribute('x',pt[0]+9);t.setAttribute('y',pt[1]+4);t.textContent=c.nom;
    g.appendChild(ci);g.appendChild(t);svg.appendChild(g);tip.hidden=true;
  }
  function render(){
    sug.innerHTML=items.map(function(c,i){return '<button type="button" role="option" data-i="'+i+'"'+(i===act?' class="on"':'')+'>'+e(c.nom)+' <small>'+Math.round(nearest([c.lon,c.lat]).d)+' km'+(D.po?' '+e(de(nearest([c.lon,c.lat]).v)):'')+'</small></button>'}).join('');
    sug.hidden=!items.length;
  }
  var timer;
  q.addEventListener('input',function(){
    clearTimeout(timer);var v=n(q.value);res.innerHTML='';
    if(v.length<2){items=[];render();return}
    timer=setTimeout(function(){load().then(function(all){
      var a=[],b=[];all.forEach(function(c){if(c.n.indexOf(v)===0)a.push(c);else if(c.n.indexOf(' '+v)>=0)b.push(c)});
      var by=function(x,y){return nearest([x.lon,x.lat]).d-nearest([y.lon,y.lat]).d};
      items=a.sort(by).concat(b.sort(by)).slice(0,6);act=-1;render();
      if(!items.length)res.innerHTML='Aucune commune trouvée près '+(D.po?'de ses secteurs':e(de(D.v)))+'. Écris directement à '+e(D.p)+' pour lui demander.';
    })},120);
  });
  q.addEventListener('keydown',function(ev){
    if(sug.hidden)return;
    if(ev.key==='ArrowDown'){act=Math.min(act+1,items.length-1);render();ev.preventDefault()}
    else if(ev.key==='ArrowUp'){act=Math.max(act-1,0);render();ev.preventDefault()}
    else if(ev.key==='Enter'){ev.preventDefault();pick(items[Math.max(act,0)])}
    else if(ev.key==='Escape'){sug.hidden=true}
  });
  sug.addEventListener('mousedown',function(ev){ev.preventDefault()});
  sug.addEventListener('click',function(ev){var b=ev.target.closest('button[data-i]');if(b)pick(items[+b.getAttribute('data-i')])});
  q.addEventListener('blur',function(){setTimeout(function(){sug.hidden=true},150)});
})();
</script>`
