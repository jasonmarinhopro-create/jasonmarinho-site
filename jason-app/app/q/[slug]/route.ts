// Redirection publique pour les QR codes "lien permanent" : le QR imprimé
// encode CETTE URL (stable pour toujours), qui redirige vers la destination
// actuellement configurée par l'hôte. 307 (temporaire) impératif : un 301/308
// serait mis en cache par les navigateurs/scanners et figerait la destination
// malgré tout changement ultérieur — l'inverse de ce que cette fonctionnalité
// doit garantir.
//
// Le statut 307 seul NE SUFFIT PAS : sans en-tête Cache-Control explicite,
// le navigateur ET le CDN Vercel peuvent quand même mettre la redirection en
// cache (constaté : changer la destination ne changeait rien pour un
// visiteur ayant déjà scanné le QR). no-store force une revalidation
// serveur à CHAQUE scan, garantissant que la redirection reflète toujours
// la valeur actuelle en base.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function noCacheRedirect(url: string) {
  const res = NextResponse.redirect(url, 307)
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  res.headers.set('CDN-Cache-Control', 'no-store')
  res.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  return res
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = svc()
  const { data } = await supabase
    .from('qr_redirects')
    .select('id, target_url, click_count')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!data) {
    return noCacheRedirect('https://jasonmarinho.com')
  }

  // Best-effort, ne doit jamais retarder ni casser la redirection.
  supabase
    .from('qr_redirects')
    .update({ click_count: data.click_count + 1 })
    .eq('id', data.id)
    .then(() => {}, () => {})

  return noCacheRedirect(data.target_url)
}
