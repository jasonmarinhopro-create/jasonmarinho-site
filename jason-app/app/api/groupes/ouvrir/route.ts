// Clic « Rejoindre » d'un groupe Facebook depuis l'app (07/11/2026, Jason :
// « fais des liens tracés pour que j'aie des stats sur tout ça »). Le clic est
// compté comme un lien suivi (code gfb-…, créé au premier clic, canal
// groupe_sortie : visible dans Provenance) puis on ouvre le groupe. Rien sur
// la personne n'est gardé (comme /l/[code]). Un groupe inconnu renvoie à l'app.
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { isPreviewBot } from '@/lib/acquisition/rules'
import { groupLinkCode } from '@/lib/pros/groupes-clients'

export const dynamic = 'force-dynamic'

const FALLBACK = 'https://app.jasonmarinho.com/dashboard'
const within = <T,>(p: PromiseLike<T>, ms: number): Promise<T | null> =>
  Promise.race([Promise.resolve(p).catch(() => null), new Promise<null>(r => setTimeout(() => r(null), ms))])

function deviceOf(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get('g') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(FALLBACK, 302)
  try {
    const db = getServiceClient()
    const lu = await within(db.from('community_groups').select('id, name, url').eq('id', id).maybeSingle(), 1500)
    const g = (lu?.data as { id: string; name: string; url: string } | null) ?? null
    if (!g || !/^https:\/\/(www\.)?(facebook\.com|fb\.com|chat\.whatsapp\.com)\//i.test(g.url)) {
      return NextResponse.redirect(FALLBACK, 302)
    }
    const ua = req.headers.get('user-agent') ?? ''
    if (!isPreviewBot(ua)) {
      const code = groupLinkCode(g.id)
      await within(db.from('tracked_links').upsert(
        { code, label: `Groupe : ${g.name}`.slice(0, 140), channel: 'groupe_sortie', destination: g.url },
        { onConflict: 'code', ignoreDuplicates: true },
      ), 800)
      await within(db.from('tracked_link_clicks').insert({ code, device: deviceOf(ua) }), 800)
    }
    const res = NextResponse.redirect(g.url, 302)
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Robots-Tag', 'noindex')
    return res
  } catch {
    return NextResponse.redirect(FALLBACK, 302)
  }
}
