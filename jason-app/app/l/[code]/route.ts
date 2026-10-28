// Liens courts suivis (10/10/2026) : jasonmarinho.com/l/<code> est redirigé ici
// (vercel.json du site), on compte le clic puis on envoie vers la page voulue
// avec utm_source / utm_medium / utm_campaign=<code>. Les robots d'aperçu
// (Facebook, WhatsApp…) ne sont pas comptés. Aucune IP ni navigateur gardés.
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { BUILTIN_LINKS, isPreviewBot, trackedTarget } from '@/lib/acquisition/rules'

export const dynamic = 'force-dynamic'

const HOME = 'https://jasonmarinho.com/'

function deviceOf(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet'
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

// La base ne doit jamais retenir le visiteur (28/10/2026 : Supabase en panne
// 2 h, le lien chargeait sans fin, « le lien ne marche pas » sur téléphone) :
// lecture limitée à 1,5 s, comptage du clic à 0,8 s, et mémoire des liens déjà
// lus par cette instance pour rediriger quand même.
type Link = { code: string; channel: string; destination: string }
const seen = new Map<string, Link>()
const within = <T,>(p: PromiseLike<T>, ms: number): Promise<T | null> =>
  Promise.race([Promise.resolve(p).catch(() => null), new Promise<null>(r => setTimeout(() => r(null), ms))])

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = String(params.code || '').toLowerCase().slice(0, 60)
  if (!/^[a-z0-9-]+$/.test(code)) return NextResponse.redirect(HOME, 302)
  // Liens d'office (prospection, fiche Google…) : connus même si la base ne répond pas
  const builtin = BUILTIN_LINKS.find(l => l.code === code) ?? null
  try {
    const db = getServiceClient()
    const lu = await within(db.from('tracked_links').select('code, channel, destination').eq('code', code).maybeSingle(), 1500)
    const row = (lu?.data as Link | null) ?? null
    if (row) seen.set(code, row)
    const data = row ?? seen.get(code) ?? builtin
    if (!data) return NextResponse.redirect(HOME, 302)
    const ua = req.headers.get('user-agent') ?? ''
    if (!isPreviewBot(ua)) {
      await within(db.from('tracked_link_clicks').insert({ code, device: deviceOf(ua) }), 800)
    }
    const res = NextResponse.redirect(trackedTarget(data.destination, data.code, data.channel), 302)
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Robots-Tag', 'noindex')
    return res
  } catch {
    return NextResponse.redirect(builtin ? trackedTarget(builtin.destination, builtin.code, builtin.channel) : HOME, 302)
  }
}
