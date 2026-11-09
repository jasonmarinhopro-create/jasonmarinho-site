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
