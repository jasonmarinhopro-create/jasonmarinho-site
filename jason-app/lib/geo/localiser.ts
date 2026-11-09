// Département et région d'une ville saisie (fiche d'un pro, demande, recherche
// de /chiffres), même sans page sur le site (étape 6 de la feuille de route
// « géographie », 09/11/2026). Côté serveur seulement : l'index des communes
// (communes.json, 445 Ko, généré par scripts/build-registre-geo.mjs depuis les
// données IGN) ne doit pas partir dans un composant client.
// Pur et testé : localiser.test.ts.
import data from './communes.json'
import { VILLES_GEO } from './registre'
import { citySlugOf } from '@/lib/visibility/city-page'

type Data = { departements: Record<string, [string, string]>; regions: Record<string, string>; communes: Record<string, string> }
const GEO = data as unknown as Data

/** Même normalisation que normNom (scripts/lib/secteur.mjs), sans article de tête */
export function normGeo(s: string | null | undefined): string {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe').replace(/['’`\-_.]/g, ' ').replace(/\bst\b/g, 'saint').replace(/\bste\b/g, 'sainte')
    .replace(/\s+/g, ' ').trim().replace(/^(la|le|les|l) /, '')
}

export interface Lieu {
  /** Code du département (France), null pour une région seule */
  departement: string | null
  departementNom: string | null
  region: string
  regionNom: string
  /** Ville du site qui a ses pages, si la saisie y correspond */
  villeSlug: string | null
  /** Comment la saisie a été reconnue */
  via: 'ville-du-site' | 'code-postal' | 'commune' | 'departement' | 'region'
}

let _communes: Map<string, string[]> | null = null
function communesIndex(): Map<string, string[]> {
  if (_communes) return _communes
  _communes = new Map()
  for (const [dep, noms] of Object.entries(GEO.communes)) {
    for (const n of noms.split('|')) {
      const list = _communes.get(n)
      if (list) list.push(dep)
      else _communes.set(n, [dep])
    }
  }
  return _communes
}

const DEP_PAR_NOM = new Map(Object.entries(GEO.departements).map(([code, [nom]]) => [normGeo(nom), code]))
const REGION_ALIAS: Record<string, string> = {
  paca: "provence alpes cote d azur", provence: "provence alpes cote d azur", 'cote d azur': "provence alpes cote d azur",
  idf: 'ile de france', 'region parisienne': 'ile de france', aura: 'auvergne rhone alpes', bretagne: 'bretagne',
}
const REGION_PAR_NOM = new Map(Object.entries(GEO.regions).map(([code, nom]) => [normGeo(nom), code]))

function lieuDep(dep: string, via: Lieu['via'], villeSlug: string | null = null): Lieu | null {
  const d = GEO.departements[dep]
  if (!d) return null
  return { departement: dep, departementNom: d[0], region: d[1], regionNom: GEO.regions[d[1]], villeSlug, via }
}

/** Département d'un code postal : 2A / 2B en Corse, 3 chiffres en outre-mer */
export function depOfCodePostal(cp: string): string | null {
  if (!/^\d{5}$/.test(cp)) return null
  if (cp.startsWith('20')) return Number(cp) < 20200 ? '2A' : '2B'
  if (cp.startsWith('97')) return cp.slice(0, 3)
  return cp.slice(0, 2)
}

/**
 * Lieu d'un texte saisi : ville du site (registre), code postal, nom de
 * commune sans ambiguïté, nom de département ou de région. Null si rien de
 * sûr (commune présente dans plusieurs départements sans code postal).
 */
export function localiser(texte: string | null | undefined): Lieu | null {
  const raw = String(texte ?? '').trim()
  if (!raw) return null

  const slug = citySlugOf(raw)
  if (slug) {
    const v = VILLES_GEO.find(x => x.slug === slug)
    if (v?.departement) return lieuDep(v.departement, 'ville-du-site', slug)
  }

  const cp = raw.match(/\b(\d{5})\b/)?.[1]
  const depCp = cp ? depOfCodePostal(cp) : null
  if (depCp && GEO.departements[depCp]) return lieuDep(depCp, 'code-postal')

  // « Lyon 6e », « Paris 15 », « Nantes Cedex » : on garde le nom
  const nom = normGeo(raw.replace(/\bcedex\b.*$/i, '').replace(/\s+\d{1,2}\s*(e|er|eme|ème)?\s*(arr(ondissement)?\.?)?$/i, ''))
  const deps = communesIndex().get(nom)
  if (deps?.length === 1) return lieuDep(deps[0], 'commune')

  const depNom = DEP_PAR_NOM.get(nom)
  if (depNom) return lieuDep(depNom, 'departement')
  if (/^\d{2}$|^2[ab]$/i.test(raw) && GEO.departements[raw.toUpperCase()]) return lieuDep(raw.toUpperCase(), 'departement')

  const reg = REGION_PAR_NOM.get(nom) ?? REGION_PAR_NOM.get(REGION_ALIAS[nom] ?? '')
  if (reg) return { departement: null, departementNom: null, region: reg, regionNom: GEO.regions[reg], villeSlug: null, via: 'region' }

  return null
}

/** Nom d'un département ou d'une région à partir de son code */
export const nomDepartement = (code: string) => GEO.departements[code]?.[0] ?? null
export const nomRegion = (code: string) => GEO.regions[code] ?? null
export const regionDuDepartement = (code: string) => GEO.departements[code]?.[1] ?? null
