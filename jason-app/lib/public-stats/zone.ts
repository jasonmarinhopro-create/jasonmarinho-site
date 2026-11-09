// /chiffres, recherche « Ta ville » (étape 6 de la feuille de route
// « géographie », 09/11/2026) : une saisie qui n'est pas une ville du site
// (commune sans page, code postal, département, région) renvoie sa zone et
// les villes du site qu'elle contient, avec leurs pros en ligne. Côté serveur
// seulement (localiser lit l'index des communes). Pur et testé : zone.test.ts.
import { localiser } from '@/lib/geo/localiser'
import { VILLES_GEO } from '@/lib/geo/registre'
import type { CityFull } from './load'

export interface ZoneRecherche {
  /** Ce que la saisie désigne */
  via: 'commune' | 'code-postal' | 'departement' | 'region'
  departement: string | null
  departementNom: string | null
  regionNom: string
  /** Niveau des villes listées : le département, ou la région s'il n'en a aucune */
  portee: 'departement' | 'region'
  villes: Array<{ slug: string; label: string; pros: number }>
  pros: number
}

export function zoneDeRecherche(texte: string, cityFull: Record<string, CityFull> | null): ZoneRecherche | null {
  const lieu = localiser(texte)
  if (!lieu || lieu.via === 'ville-du-site') return null
  const prosDe = (slug: string) => {
    const p = cityFull?.[slug]?.pros
    return p ? p.photographe + p.menage + (p.depannage ?? 0) : 0
  }
  const villesDe = (f: (v: (typeof VILLES_GEO)[number]) => boolean) => VILLES_GEO
    .filter(v => v.pays === 'FR' && (v.pages.photographe || v.pages.menage || v.pages.hote) && f(v))
    .map(v => ({ slug: v.slug, label: v.nom, pros: prosDe(v.slug) }))
    .sort((a, b) => b.pros - a.pros || a.label.localeCompare(b.label, 'fr'))
  let portee: ZoneRecherche['portee'] = 'region'
  let villes = lieu.departement ? villesDe(v => v.departement === lieu.departement) : []
  if (villes.length) portee = 'departement'
  else villes = villesDe(v => v.region === lieu.region)
  return {
    via: lieu.via,
    departement: lieu.departement,
    departementNom: lieu.departementNom,
    regionNom: lieu.regionNom,
    portee,
    villes,
    pros: villes.reduce((n, v) => n + v.pros, 0),
  }
}
