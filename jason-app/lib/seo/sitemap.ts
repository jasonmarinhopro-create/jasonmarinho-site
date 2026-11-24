// Lecture des sitemaps statiques de jasonmarinho.com. Pas de lib XML (le reste
// du projet évite les dépendances lourdes, cf. lib/security/validate.ts) : un
// sitemap est un format assez simple pour une extraction par regex.
//
// 24/11/2026 (Jason : « je vois encore que 619 pages, fais en sorte que tout
// soit bien paramétré ») : l’indexation suit les sitemaps déclarés dans
// robots.txt, pas seulement sitemap.xml. Les fiches des pros (photographes,
// ménage, dépannage) y sont comptées, avec leur famille.

export type FamilleSitemap = 'site' | 'pros'

export interface SitemapEntry {
  url: string
  lastmod: string | null
  famille: FamilleSitemap
}

export const SITEMAPS: { file: string; famille: FamilleSitemap }[] = [
  { file: 'sitemap.xml', famille: 'site' },
  { file: 'sitemap-photographes.xml', famille: 'pros' },
  { file: 'sitemap-menages.xml', famille: 'pros' },
  { file: 'sitemap-depannage.xml', famille: 'pros' },
]

export function parseSitemap(xml: string, famille: FamilleSitemap = 'site'): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? []
  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim()
    if (!loc) continue
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? null
    entries.push({ url: loc, lastmod, famille })
  }
  return entries
}

/** Réunit plusieurs sitemaps, sans doublon (la première famille rencontrée gagne) */
export function fusionnerSitemaps(lus: { xml: string; famille: FamilleSitemap }[]): SitemapEntry[] {
  const vus = new Map<string, SitemapEntry>()
  for (const { xml, famille } of lus) {
    for (const e of parseSitemap(xml, famille)) if (!vus.has(e.url)) vus.set(e.url, e)
  }
  return [...vus.values()]
}

/** Tous les sitemaps du site. Échoue si l'un d'eux ne répond pas : mieux vaut
 *  ne rien vérifier que de travailler sur une liste incomplète. */
export async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  const lus = await Promise.all(SITEMAPS.map(async ({ file, famille }) => {
    const res = await fetch(`https://jasonmarinho.com/${file}`, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`${file} HTTP ${res.status}`)
    return { xml: await res.text(), famille }
  }))
  return fusionnerSitemaps(lus)
}
