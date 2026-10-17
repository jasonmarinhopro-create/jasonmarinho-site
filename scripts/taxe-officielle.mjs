// Tarifs officiels de la taxe de séjour (DGFiP, données DELTA, open data
// data.economie.gouv.fr, Licence Ouverte 2.0) pour les communes de nos pages
// de ville (17/10/2026). Lancé par le workflow « Taxe de séjour officielle » :
// l'environnement de Claude ne joint pas ce site. Écrit
// scripts/data/taxe-sejour-officielle.json (données publiques seulement).
//   node scripts/taxe-officielle.mjs [explorer|<commune>,<commune>…]
import { writeFileSync, mkdirSync } from 'node:fs'

const API = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets'
const IDS = ['delta_deliberation_ts_tarif', 'delta_deliberation_ts_tarif0']
const arg = process.argv[2] || 'explorer'

async function get(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } })
  const t = await r.text()
  try { return { status: r.status, json: JSON.parse(t) } } catch { return { status: r.status, text: t.slice(0, 300) } }
}

const out = { releve: new Date().toISOString().slice(0, 10), datasets: {}, communes: {} }
for (const id of IDS) {
  const meta = await get(`${API}/${id}`)
  out.datasets[id] = {
    status: meta.status,
    fields: meta.json?.fields?.map(f => `${f.name} (${f.label})`) ?? null,
    modified: meta.json?.metas?.default?.modified ?? null,
  }
  const sample = await get(`${API}/${id}/records?limit=3`)
  out.datasets[id].sample = sample.json?.results ?? sample.text ?? null
  out.datasets[id].total = sample.json?.total_count ?? null
}

const communes = arg === 'explorer' ? ['Strasbourg', 'Arcachon'] : arg.split(',').map(s => s.trim()).filter(Boolean)
const id = IDS.find(i => out.datasets[i].status === 200) ?? IDS[0]
for (const c of communes) {
  const rows = []
  for (let offset = 0; offset < 600; offset += 100) {
    const q = encodeURIComponent(`"${c}" and (date_effet="2026" or date_effet="2027")`)
    const r = await get(`${API}/${id}/records?where=${q}&limit=100&offset=${offset}`)
    const res = r.json?.results ?? []
    rows.push(...res)
    if (res.length < 100) break
  }
  out.communes[c] = rows
}
mkdirSync(new URL('./data/', import.meta.url), { recursive: true })
writeFileSync(new URL('./data/taxe-sejour-officielle.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`::notice title=Taxe officielle::jeu ${id}, ${Object.entries(out.communes).map(([k, v]) => `${k} ${v.length}`).join(', ')}`)
