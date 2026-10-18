#!/usr/bin/env node
/**
 * Données géographiques des cartes « Où j'interviens » des fiches pros
 * (18/10/2026). À lancer une seule fois (ou pour mettre les contours à jour) :
 *
 *   node scripts/build-geo-data.mjs [dossier-local]
 *
 * Source : france-geojson (Grégoire David), tracés IGN Admin Express COG
 * 2018, Licence Ouverte. Télécharge les versions simplifiées (ou les lit dans
 * le dossier local donné), puis écrit, sous forme compacte :
 *  - scripts/data/geo/communes/<dep>.json : [code, nom, cx, cy, anneaux]
 *    (coordonnées en millièmes de degré, anneaux en deltas)
 *  - scripts/data/geo/departements.json, scripts/data/geo/regions.json
 *  - geo/communes/<dep>.json (servi par le site) : [nom, lat, lon] pour la
 *    recherche « Ton logement est à… » de la fiche
 * Rien n'est appelé chez un tiers quand un visiteur ouvre une fiche.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/'
const LOCAL = process.argv[2]
const Q = 1000

async function load(name) {
  if (LOCAL && fs.existsSync(path.join(LOCAL, name))) return JSON.parse(fs.readFileSync(path.join(LOCAL, name), 'utf8'))
  const r = await fetch(SRC + name)
  if (!r.ok) throw new Error(`${name} : ${r.status}`)
  return r.json()
}

const polys = g => !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.coordinates
function encodeRings(g, minArea = 0) {
  const out = []
  for (const p of polys(g)) {
    const q = []
    for (const [x, y] of p[0]) {
      const a = Math.round(x * Q), b = Math.round(y * Q)
      const l = q[q.length - 1]
      if (l && l[0] === a && l[1] === b) continue
      q.push([a, b])
    }
    if (q.length < 4) continue
    if (minArea && Math.abs(area(q)) < minArea) continue
    const d = [q[0][0], q[0][1]]
    for (let i = 1; i < q.length; i++) d.push(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1])
    out.push(d)
  }
  return out
}
function area(r) { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return s / 2 }
function centroid(g) {
  let best = null, ba = 0
  for (const p of polys(g)) { const a = Math.abs(area(p[0])); if (a > ba) { ba = a; best = p[0] } }
  if (!best) return null
  let A = 0, cx = 0, cy = 0
  for (let i = 0; i < best.length - 1; i++) {
    const [x0, y0] = best[i], [x1, y1] = best[i + 1], f = x0 * y1 - x1 * y0
    A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
  }
  A /= 2
  return [Math.round(cx / (6 * A) * Q), Math.round(cy / (6 * A) * Q)]
}
function inside([x, y], ring) {
  let ok = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ok = !ok
  }
  return ok
}
const depOf = code => code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2)

const communes = await load('communes-version-simplifiee.geojson')
const deps = await load('departements-version-simplifiee.geojson')
const regions = await load('regions-version-simplifiee.geojson')

const outData = path.join(ROOT, 'scripts', 'data', 'geo')
const outPublic = path.join(ROOT, 'geo', 'communes')
fs.mkdirSync(path.join(outData, 'communes'), { recursive: true })
fs.mkdirSync(outPublic, { recursive: true })

const byDep = {}
for (const f of communes.features) {
  const c = centroid(f.geometry)
  if (!c) continue
  const { code, nom } = f.properties
  ;(byDep[depOf(code)] ||= []).push([code, nom, c[0], c[1], encodeRings(f.geometry)])
}
let n = 0
for (const [dep, list] of Object.entries(byDep)) {
  list.sort((a, b) => a[0].localeCompare(b[0]))
  fs.writeFileSync(path.join(outData, 'communes', `${dep}.json`), JSON.stringify(list))
  fs.writeFileSync(path.join(outPublic, `${dep}.json`), JSON.stringify(list.map(c => [c[1], c[3] / Q, c[2] / Q])))
  n += list.length
}

const depList = deps.features.map(f => ({ code: f.properties.code, nom: f.properties.nom, c: centroid(f.geometry), r: encodeRings(f.geometry, 20) }))
fs.writeFileSync(path.join(outData, 'departements.json'), JSON.stringify(depList))

const regionList = regions.features.map(f => {
  const rings = polys(f.geometry).map(p => p[0].map(([x, y]) => [x * Q, y * Q]))
  return { code: f.properties.code, nom: f.properties.nom, deps: depList.filter(d => rings.some(r => inside(d.c, r))).map(d => d.code) }
}).filter(r => r.deps.length)
fs.writeFileSync(path.join(outData, 'regions.json'), JSON.stringify(regionList))

console.log(`[geo] ${n} communes dans ${Object.keys(byDep).length} départements, ${depList.length} départements, ${regionList.length} régions`)
