// Lecture du sitemap statique (jasonmarinho.com/sitemap.xml). Pas de lib XML
// (le reste du projet évite les dépendances lourdes, cf. lib/security/validate.ts)
// — un sitemap.xml est un format assez simple pour une extraction par regex.

export interface SitemapEntry {
  url: string
  lastmod: string | null
}

export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? []
  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim()
    if (!loc) continue
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? null
    entries.push({ url: loc, lastmod })
  }
  return entries
}

export async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  const res = await fetch('https://jasonmarinho.com/sitemap.xml', { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`)
  return parseSitemap(await res.text())
}
