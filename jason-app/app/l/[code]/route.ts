// Liens courts suivis (10/10/2026) : jasonmarinho.com/l/<code> est redirigé ici
// (vercel.json du site), on compte le clic puis on envoie vers la page voulue
// avec utm_source / utm_medium / utm_campaign=<code>. Les robots d'aperçu
// (Facebook, WhatsApp…) ne sont pas comptés. Aucune IP ni navigateur gardés.
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { isPreviewBot, trackedTarget } from '@/lib/acquisition/rules'

export const dynamic = 'force-dynamic'

const HOME = 'https://jasonmarinho.com/'

function deviceOf(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = String(params.code || '').toLowerCase().slice(0, 60)
  if (!/^[a-z0-9-]+$/.test(code)) return NextResponse.redirect(HOME, 302)
  try {
    const db = getServiceClient()
    const { data } = await db.from('tracked_links').select('code, channel, destination').eq('code', code).maybeSingle()
    if (!data) return NextResponse.redirect(HOME, 302)
    const ua = req.headers.get('user-agent') ?? ''
    if (!isPreviewBot(ua)) {
      await db.from('tracked_link_clicks').insert({ code, device: deviceOf(ua) }).then(() => undefined, () => undefined)
    }
    const res = NextResponse.redirect(trackedTarget(data.destination, data.code, data.channel), 302)
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Robots-Tag', 'noindex')
    return res
  } catch {
    return NextResponse.redirect(HOME, 302)
  }
}
