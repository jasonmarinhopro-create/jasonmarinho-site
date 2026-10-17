// Tarifs officiels de la taxe de séjour (DGFiP, données DELTA, open data
// data.economie.gouv.fr, jeu delta_deliberation_ts_tarif0, Licence Ouverte
// 2.0) pour les communes de nos pages de ville (17/10/2026). Lancé par le
// workflow « Taxe de séjour officielle » : l'environnement de Claude ne joint
// pas ce site. Écrit scripts/data/taxe-sejour-officielle.json (données
// publiques seulement), lu par scripts/inject-taxe-villes.mjs.
//   node scripts/taxe-officielle.mjs "NOM|département,NOM|département…"
import { writeFileSync, mkdirSync } from 'node:fs'

const API = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets'
const ID = 'delta_deliberation_ts_tarif0'
const communes = (process.argv[2] || 'Strasbourg|67').split(',').map(s => s.trim()).filter(Boolean)

async function get(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } })
  const t = await r.text()
  try { return { status: r.status, json: JSON.parse(t) } } catch { return { status: r.status, text: t.slice(0, 300) } }
}

// Nom en majuscules sans accents, comme dans DELTA
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
const KEEP = ['libelle_commune', 'departement', 'commune', 'date_effet', 'hebergement', 'tarif', 'unite', 'taxe_add_dep',
  'taxe_add_article_l_2531_17_du_code_general_des_collectivites_territoriales',
  'taxe_add_article_l_4332_4_du_code_general_des_collectivites_territoriales',
  'taxe_add_article_l_4332_5_du_code_general_des_collectivites_territoriales',
  'taxe_add_article_l_4332_6_du_code_general_des_collectivites_territoriales', 'tarif_total', 'periode_1', 'periode_2', 'date_fin']

const meta = await get(`${API}/${ID}`)
const out = { releve: new Date().toISOString().slice(0, 10), jeu: ID, modifie: meta.json?.metas?.default?.modified ?? null, erreurs: [], communes: {} }
for (const c of communes) {
  const [nom, dep] = c.split('|')
  const rows = []
  const where = encodeURIComponent(`libelle_commune like "${norm(nom)}%"${dep ? ` and (departement="${dep}" or departement="${dep.replace(/^0/, '')}")` : ''}`)
  for (let offset = 0; offset < 3000; offset += 100) {
    const r = await get(`${API}/${ID}/records?where=${where}&limit=100&offset=${offset}`)
    if (!r.json || r.status !== 200) { out.erreurs.push(`${c} : ${r.status} ${r.text ?? JSON.stringify(r.json).slice(0, 200)}`); break }
    const res = r.json.results ?? []
    for (const x of res) {
      // Une délibération reste valable tant qu'elle n'est pas remplacée : on
      // garde toutes les années sans date de fin passée, le plus récent gagne
      if (x.date_fin && Number(String(x.date_fin).slice(0, 4)) < 2026) continue
      if (!/meubl|chambres|sans classement/i.test(x.hebergement ?? '')) continue
      rows.push(Object.fromEntries(KEEP.map(k => [k, x[k] ?? null])))
    }
    if (res.length < 100) break
  }
  out.communes[c] = rows
}
mkdirSync(new URL('./data/', import.meta.url), { recursive: true })
writeFileSync(new URL('./data/taxe-sejour-officielle.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(`::notice title=Taxe officielle::${Object.entries(out.communes).map(([k, v]) => `${k.split('|')[0]} ${v.length}`).join(', ')} ; erreurs ${out.erreurs.length}`)
