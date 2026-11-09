// Données publiques par commune pour les pages de ville et de zone (10/11/2026) :
// population (geo.api.gouv.fr), capacité d'hébergement touristique (Insee, jeu
// « Capacité des communes en hébergement touristique », DS_TOUR_CAP) et
// résidences secondaires (Insee, recensement). Lancé par le workflow
// « Données communes » : l'environnement de Claude ne joint pas ces sites.
//   node scripts/donnees-communes.mjs explorer            → affiche les liens utiles
//   node scripts/donnees-communes.mjs relever <url-tourisme> <url-logement>
// Écrit scripts/data/communes-donnees.json (données publiques, chiffres seulement).
const mode = process.argv[2] || 'explorer'

async function get(url, type = 'text') {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'jasonmarinho.com donnees-communes' } })
      if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
      return { status: r.status, body: type === 'buf' ? Buffer.from(await r.arrayBuffer()) : await r.text(), ct: r.headers.get('content-type') }
    } catch (e) {
      if (i === 3) return { status: 0, body: String(e) }
      await new Promise(res => setTimeout(res, 2000 * (i + 1)))
    }
  }
}

if (mode === 'explorer') {
  for (const page of ['https://www.insee.fr/fr/statistiques/2021703', 'https://www.insee.fr/fr/statistiques/8202349', 'https://www.insee.fr/fr/statistiques/8202353']) {
    const r = await get(page)
    console.log(`\n== ${page} : ${r.status}`)
    const links = [...new Set([...String(r.body).matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(h => /fichier|melodi|\.zip|\.csv|\.xlsx/i.test(h)))]
    console.log(links.slice(0, 40).join('\n'))
    const t = String(r.body).match(/<title>([^<]*)/)
    console.log('titre :', t?.[1])
  }
  for (const q of ['DS_TOUR_CAP', 'DS_RP_LOGEMENT_PRINC', 'DS_RP_LOGEMENT_COMP']) {
    const r = await get(`https://api.insee.fr/melodi/catalog/${q}`)
    console.log(`\n== melodi catalog ${q} : ${r.status}`)
    console.log(String(r.body).slice(0, 1500))
  }
  const g = await get('https://geo.api.gouv.fr/communes?code=42187&fields=code,nom,population,surface')
  console.log('\n== geo.api :', g.status, String(g.body).slice(0, 300))
}

// Lecture d'un Parquet Insee (Melodi) par paquets de lignes, avec filtre
async function parquet(url) {
  const { parquetMetadata, parquetReadObjects } = await import('hyparquet')
  const r = await get(url, 'buf')
  if (r.status !== 200) throw new Error(`${url} : HTTP ${r.status}`)
  const ab = r.body.buffer.slice(r.body.byteOffset, r.body.byteOffset + r.body.byteLength)
  const meta = parquetMetadata(ab)
  return { meta, n: Number(meta.num_rows), cols: meta.schema.slice(1).map(c => c.name),
    async *rows(step = 200000) { for (let i = 0; i < Number(meta.num_rows); i += step) yield* await parquetReadObjects({ file: ab, rowStart: i, rowEnd: Math.min(i + step, Number(meta.num_rows)) }) } }
}

if (mode === 'structure') {
  for (const id of ['DS_TOUR_CAP', 'DS_RP_LOGEMENT_PRINC']) {
    const cat = JSON.parse((await get(`https://api.insee.fr/melodi/catalog/${id}`)).body)
    const url = cat.accessURLParquet || cat.distribution?.find?.(d => /PARQUET/i.test(d.accessURL ?? ''))?.accessURL
    console.log(`\n== ${id} : ${url}`)
    if (!url) { console.log(Object.keys(cat).join(', ')); continue }
    const pq = await parquet(url)
    console.log('lignes :', pq.n, '| colonnes :', pq.cols.join(', '))
    const vals = Object.fromEntries(pq.cols.map(c => [c, new Map()]))
    let shown = 0
    for await (const row of pq.rows()) {
      for (const c of pq.cols) { const m = vals[c]; if (m.size < 60) m.set(String(row[c]), (m.get(String(row[c])) ?? 0) + 1) }
      if (Object.values(row).some(v => String(v).endsWith('42187')) && shown < 60) { console.log('ROANNE', JSON.stringify(row, (k, v) => typeof v === 'bigint' ? Number(v) : v)); shown++ }
    }
    for (const c of pq.cols) if (!/OBS_VALUE|GEO$/.test(c)) console.log(`  ${c} : ${[...vals[c].keys()].slice(0, 60).join(' | ')}`)
  }
}

// ── Relevé (10/11/2026) ───────────────────────────────────────────────
// Par commune, département et région : [population, hôtels, chambres d'hôtel,
// campings, emplacements, autres hébergements collectifs, lits de ces autres].
// Insee DS_TOUR_CAP : ACTIVITY I551 hôtels (PLACE = chambres), I553 campings
// (PLACE = emplacements), I552 autres hébergements collectifs (BEDPLACE = lits) ;
// UNIT_LOC = nombre d'établissements ; L_STAY et UNIT_LOC_RANKING au total (_T).
if (mode === 'relever') {
  const { writeFileSync } = await import('node:fs')
  const cat = JSON.parse((await get('https://api.insee.fr/melodi/catalog/DS_TOUR_CAP')).body)
  const pq = await parquet(cat.accessURLParquet)
  const out = { COM: {}, DEP: {}, REG: {} }
  const slot = { 'I551|UNIT_LOC': 1, 'I551|PLACE': 2, 'I553|UNIT_LOC': 3, 'I553|PLACE': 4, 'I552|UNIT_LOC': 5, 'I552|BEDPLACE': 6 }
  let annee = null
  for await (const r of pq.rows()) {
    if (!out[r.GEO_OBJECT] || r.L_STAY !== '_T' || r.UNIT_LOC_RANKING !== '_T') continue
    const i = slot[`${r.ACTIVITY}|${r.TOUR_MEASURE}`]
    if (!i) continue
    const a = (out[r.GEO_OBJECT][r.GEO] ||= [0, 0, 0, 0, 0, 0, 0])
    a[i] = Number(r.OBS_VALUE) || 0
    annee ||= String(r.TIME_PERIOD instanceof Date ? r.TIME_PERIOD.toISOString() : r.TIME_PERIOD).slice(0, 4)
  }
  console.log('tourisme :', Object.keys(out.COM).length, 'communes,', Object.keys(out.DEP).length, 'départements,', Object.keys(out.REG).length, 'régions, année', annee)
  // Population légale (geo.api.gouv.fr, Insee)
  const g = await get('https://geo.api.gouv.fr/communes?fields=code,population,codeDepartement,codeRegion&format=json')
  const communes = JSON.parse(g.body)
  let nPop = 0
  for (const c of communes) {
    if (!c.population) continue
    nPop++
    ;(out.COM[c.code] ||= [0, 0, 0, 0, 0, 0, 0])[0] = c.population
    if (c.codeDepartement) (out.DEP[c.codeDepartement] ||= [0, 0, 0, 0, 0, 0, 0])[0] += c.population
    if (c.codeRegion) (out.REG[c.codeRegion] ||= [0, 0, 0, 0, 0, 0, 0])[0] += c.population
  }
  console.log('population :', nPop, 'communes')
  if (Object.keys(out.COM).length < 30000 || nPop < 30000) { console.log('::error::relevé incomplet, fichier non écrit'); process.exit(1) }
  // Communes sans hôtel ni camping ni population : inutile de les garder
  for (const k of Object.keys(out.COM)) if (out.COM[k].every(x => !x)) delete out.COM[k]
  writeFileSync('scripts/data/communes-donnees.json', JSON.stringify({
    releve: new Date().toISOString().slice(0, 10), tourismeAnnee: annee,
    sources: { tourisme: 'https://www.insee.fr/fr/statistiques/2021703', population: 'https://geo.api.gouv.fr' },
    champs: ['population', 'hotels', 'chambres', 'campings', 'emplacements', 'autres', 'lits_autres'], ...out,
  }))
  // Exploration du fichier logements (résidences secondaires) pour la suite
  const cl = JSON.parse((await get('https://api.insee.fr/melodi/catalog/DS_RP_LOGEMENT_PRINC')).body)
  console.log('\nlogement, champs du catalogue :', Object.entries(cl).filter(([k, v]) => /url|access|distribution/i.test(k)).map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 300)}`).join('\n'))
  const h = await get(cl.accessURLParquet, 'buf')
  console.log('logement : HTTP', h.status, h.ct, 'taille', h.body?.length, 'début', h.body?.subarray?.(0, 8)?.toString('hex'), 'fin', h.body?.subarray?.(-8)?.toString('hex'))
}

// Logements (résidences secondaires) : fichier téléchargé par curl dans le
// workflow (logement.parquet), le fetch de Node le recevait tronqué.
async function parquetFichier(chemin) {
  const { readFileSync } = await import('node:fs')
  const { parquetMetadata, parquetReadObjects } = await import('hyparquet')
  const b = readFileSync(chemin)
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  const meta = parquetMetadata(ab)
  return { n: Number(meta.num_rows), cols: meta.schema.slice(1).map(c => c.name),
    async *rows(step = 200000) { for (let i = 0; i < Number(meta.num_rows); i += step) yield* await parquetReadObjects({ file: ab, rowStart: i, rowEnd: Math.min(i + step, Number(meta.num_rows)) }) } }
}

if (mode === 'logement-structure') {
  const pq = await parquetFichier('logement.parquet')
  console.log('lignes :', pq.n, '| colonnes :', pq.cols.join(', '))
  const vals = Object.fromEntries(pq.cols.map(c => [c, new Set()]))
  let shown = 0
  for await (const row of pq.rows()) {
    for (const c of pq.cols) if (vals[c].size < 80) vals[c].add(String(row[c]))
    if (row.GEO === '42187' && shown < 80) { console.log('ROANNE', JSON.stringify(row, (k, v) => typeof v === 'bigint' ? Number(v) : v)); shown++ }
  }
  for (const c of pq.cols) if (!/OBS_VALUE|^GEO$/.test(c)) console.log(`  ${c} : ${[...vals[c]].join(' | ')}`)
}

// API Melodi (données filtrées, sans gros fichier) : dimensions puis un exemple
if (mode === 'logement-api') {
  const r = await get('https://api.insee.fr/melodi/range/DS_RP_LOGEMENT_PRINC')
  console.log('range :', r.status)
  try {
    const j = JSON.parse(r.body)
    for (const d of (j.range ?? j)) console.log(`  ${d.id ?? d.code} : ${(d.values ?? []).slice(0, 40).map(v => `${v.code ?? v.id}=${(v.label?.[0]?.content ?? v.label ?? '').toString().slice(0, 40)}`).join(' | ')}`)
  } catch { console.log(String(r.body).slice(0, 3000)) }
  for (const q of ['GEO=COM-42187', 'GEO=2025-COM-42187', 'GEO=COM-42187&OCS=DW_SEC']) {
    const d = await get(`https://api.insee.fr/melodi/data/DS_RP_LOGEMENT_PRINC?${q}&maxResult=40`)
    console.log(`\n== data ${q} : ${d.status}`)
    console.log(String(d.body).slice(0, 2500))
  }
}

// Résidences secondaires et logements (recensement Insee, API Melodi, 10/11/2026).
// Ajoute à chaque zone de communes-donnees.json : [7] résidences secondaires et
// logements occasionnels (OCS=DW_SEC_DW_OCC), [8] logements (OCS=_T). Pages de
// 10 000 lignes, pause entre deux appels (30 appels par minute au plus sans clé).
if (mode === 'logement') {
  const { readFileSync, writeFileSync } = await import('node:fs')
  const FILE = 'scripts/data/communes-donnees.json'
  const d = JSON.parse(readFileSync(FILE, 'utf8'))
  const base = 'TIME_PERIOD=2023&RP_MEASURE=DWELLINGS&TDW=_T&BUILD_END=_T&CARS=_T&NRG_SRC=_T&TSH=_T&CARPARK=_T&NOR=_T&L_STAY=_T'
  const vu = { COM: 0, DEP: 0, REG: 0 }
  for (const niveau of ['COM', 'DEP', 'REG']) {
    for (const [ocs, i] of [['DW_SEC_DW_OCC', 7], ['_T', 8]]) {
      for (let page = 1; page < 20; page++) {
        const r = await get(`https://api.insee.fr/melodi/data/DS_RP_LOGEMENT_PRINC?${base}&OCS=${ocs}&GEO=${niveau}&maxResult=10000&page=${page}`)
        if (r.status !== 200) { console.log(`::error::${niveau} ${ocs} page ${page} : HTTP ${r.status}`); process.exit(1) }
        const obs = JSON.parse(r.body).observations ?? []
        for (const o of obs) {
          const code = String(o.dimensions.GEO).split('-').pop()
          const a = (d[niveau][code] ||= [0, 0, 0, 0, 0, 0, 0])
          while (a.length < 9) a.push(0)
          a[i] = Math.round(Number(o.measures?.OBS_VALUE_NIVEAU?.value) || 0)
          if (i === 7) vu[niveau]++
        }
        await new Promise(res => setTimeout(res, 2500))
        if (obs.length < 10000) break
      }
    }
  }
  console.log('résidences secondaires :', JSON.stringify(vu))
  if (vu.COM < 30000 || vu.DEP < 90) { console.log('::error::relevé incomplet, fichier non écrit'); process.exit(1) }
  d.champs = [...d.champs.slice(0, 7), 'residences_secondaires', 'logements']
  d.logementAnnee = '2023'
  d.sources.logement = 'https://www.insee.fr/fr/statistiques/8202349'
  writeFileSync(FILE, JSON.stringify(d))
}
