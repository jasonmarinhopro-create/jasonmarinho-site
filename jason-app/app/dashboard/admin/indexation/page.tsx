import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IndexationUI from './IndexationUI'

export const metadata = { title: 'Indexation, Jason Marinho' }

interface SitemapEntry {
  url: string
  lastmod: string | null
}

// Pas de lib XML (le reste du projet évite les dépendances lourdes, cf.
// lib/security/validate.ts) — un sitemap.xml est un format assez simple
// pour une extraction par regex.
function parseSitemap(xml: string): SitemapEntry[] {
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

export default async function IndexationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  let entries: SitemapEntry[] = []
  let fetchError: string | null = null
  try {
    // revalidate 1h : cette page est consultée ponctuellement, pas besoin
    // de retélécharger le sitemap (500+ URLs) à chaque visite.
    const res = await fetch('https://jasonmarinho.com/sitemap.xml', { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    entries = parseSitemap(await res.text())
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Erreur inconnue'
  }

  // Plus récemment modifiées en premier : ce sont celles qui ont le plus
  // besoin d'être (re)soumises à l'indexation.
  entries.sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''))

  return <IndexationUI entries={entries} fetchError={fetchError} />
}
