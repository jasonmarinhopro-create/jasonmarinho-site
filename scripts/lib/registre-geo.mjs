// Lecture du registre géographique (scripts/data/registre-geo.mjs) : pour
// chaque ville, son département et sa région officiels déduits du code INSEE
// avec les données IGN (scripts/data/geo, Licence Ouverte), et l'adresse de
// chacune de ses pages. Pur à part la lecture des fichiers IGN.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VILLES, PAYS } from '../data/registre-geo.mjs'

const GEO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'geo')
const readJson = f => JSON.parse(fs.readFileSync(path.join(GEO, f), 'utf8'))

/** Code du département d'un code commune : 2A/2B en Corse, 3 chiffres en outre-mer */
export function depOfInsee(insee) {
  const s = String(insee ?? '').toUpperCase()
  if (/^97\d{3}$/.test(s)) return s.slice(0, 3)
  if (/^(\d{2}|2A|2B)\d{3}$/.test(s)) return s.slice(0, 2)
  return null
}

/** Adresse d'une page d'une ville (sans « / » final) */
export function cheminPage(kind, v) {
  switch (kind) {
    case 'photographe': return `/photographe-lcd-${v.slug}`
    case 'menage': return `/menage-lcd-${v.slug}`
    case 'depannage': return `/depannage-lcd-${v.slug}`
    case 'hote': return `/devenir-hote-airbnb-${v.slug}`
    case 'revenus': return v.revenus ? `/services/simulateurs/revenus-lcd/${v.revenus}` : null
    default: throw new Error(`Type de page inconnu : ${kind}`)
  }
}

let _cache = null
/** Villes du registre, complétées : pays, département, région, adresses des pages */
export function villesRegistre() {
  if (_cache) return _cache
  const deps = new Map(readJson('departements.json').map(d => [d.code, d.nom]))
  const regions = readJson('regions.json')
  const regionOfDep = new Map(regions.flatMap(r => r.deps.map(d => [d, r])))
  const communes = new Map()
  const communeNom = (dep, insee) => {
    if (!communes.has(dep)) {
      const f = path.join(GEO, 'communes', `${dep}.json`)
      communes.set(dep, new Map(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).map(c => [c[0], { nom: c[1], centre: [c[2], c[3]] }]) : []))
    }
    return communes.get(dep).get(insee) ?? null
  }
  const seen = new Set()
  _cache = VILLES.map(v => {
    if (seen.has(v.slug)) throw new Error(`Ville en double dans le registre : ${v.slug}`)
    seen.add(v.slug)
    const pays = v.insee ? 'FR' : v.pays
    if (!PAYS[pays]) throw new Error(`${v.slug} : pays inconnu (${pays})`)
    let dep = null, region = null
    if (pays === 'FR') {
      dep = depOfInsee(v.insee)
      if (!dep || !deps.has(dep)) throw new Error(`${v.slug} : département introuvable pour le code ${v.insee}`)
      if (!communeNom(dep, v.insee)?.nom) throw new Error(`${v.slug} : commune ${v.insee} absente des données IGN`)
      const r = regionOfDep.get(dep)
      if (!r) throw new Error(`${v.slug} : région introuvable pour le département ${dep}`)
      region = { code: r.code, nom: r.nom }
    }
    const kinds = [...v.pages, ...(v.revenus ? ['revenus'] : [])]
    return {
      slug: v.slug,
      nom: v.nom,
      pays,
      paysNom: PAYS[pays],
      insee: v.insee ?? null,
      communeIgn: pays === 'FR' ? communeNom(dep, v.insee).nom : null,
      /** Centre de la commune [longitude, latitude] en millièmes de degré (IGN) */
      centre: pays === 'FR' ? communeNom(dep, v.insee).centre : null,
      departement: dep ? { code: dep, nom: deps.get(dep) } : null,
      region,
      province: v.province ?? null,
      pages: Object.fromEntries(kinds.map(k => [k, cheminPage(k, v)])),
    }
  })
  return _cache
}

/** Villes qui ont une page d'un type donné */
export const villesAvec = kind => villesRegistre().filter(v => v.pages[kind])

/** Régions (France) qui ont au moins une ville, avec leurs villes, dans l'ordre alphabétique */
export function regionsRegistre(kind = null) {
  const by = new Map()
  for (const v of villesRegistre()) {
    if (!v.region || (kind && !v.pages[kind])) continue
    if (!by.has(v.region.code)) by.set(v.region.code, { ...v.region, villes: [] })
    by.get(v.region.code).villes.push(v)
  }
  return [...by.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}
