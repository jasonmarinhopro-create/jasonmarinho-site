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
