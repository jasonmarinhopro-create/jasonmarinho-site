// Départements et régions de l'onglet Villes de l'admin (étape 6 de la feuille
// de route « géographie », 09/11/2026). Côté serveur seulement : localiser()
// lit l'index des communes (445 Ko), à ne pas envoyer au navigateur. Les
// types sont dans admin-rules.ts (importable par les composants client).
// Pur et testé : admin-zones.test.ts.
import { localiser, nomDepartement, nomRegion, regionDuDepartement } from '@/lib/geo/localiser'
import { VILLES_GEO } from '@/lib/geo/registre'
import type { CityItem, ZoneItem } from './admin-rules'

type ProLite = { kind: 'photographe' | 'menage' | 'depannage'; ville: string; demandes?: number }

export function groupZones(cities: CityItem[], pros: ProLite[], niveau: 'departement' | 'region'): ZoneItem[] {
  const zones = new Map<string, ZoneItem>()
  const zone = (dep: string | null, region: string): ZoneItem | null => {
    const code = niveau === 'departement' ? dep : region
    if (!code) return null
    let z = zones.get(code)
    if (!z) {
      const nom = niveau === 'departement' ? nomDepartement(code) : nomRegion(code)
      if (!nom) return null
      z = {
        code, nom, niveau, ...(niveau === 'departement' ? { regionNom: nomRegion(regionDuDepartement(code) ?? '') ?? undefined } : {}),
        villes: [], clicks: 0, impressions: 0, visitors: 0, pros: { photographes: 0, menage: 0, depannage: 0 }, prosHorsPages: 0, demandes: 0,
      }
      zones.set(code, z)
    }
    return z
  }

  // Villes du site : leurs chiffres Google et leurs visiteurs
  const geo = new Map(VILLES_GEO.map(v => [v.slug, v]))
  for (const c of cities) {
    const v = geo.get(c.slug)
    if (!v?.region) continue
    const z = zone(v.departement, v.region)
    if (!z) continue
    z.villes.push({ slug: c.slug, name: c.name })
    z.clicks += c.clicks
    z.impressions += c.impressions
    z.visitors += c.themes.reduce((n, t) => n + t.visitors, 0)
  }

  // Pros : rangés par leur ville saisie, même sans page
  for (const p of pros) {
    const lieu = localiser(p.ville)
    if (!lieu) continue
    const z = zone(lieu.departement, lieu.region)
    if (!z) continue
    if (p.kind === 'photographe') z.pros.photographes++
    else if (p.kind === 'menage') z.pros.menage++
    else z.pros.depannage++
    if (!lieu.villeSlug) z.prosHorsPages++
    z.demandes += p.demandes ?? 0
  }

  return [...zones.values()]
    .map(z => ({ ...z, villes: z.villes.sort((a, b) => a.name.localeCompare(b.name, 'fr')) }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.nom.localeCompare(b.nom, 'fr'))
}
