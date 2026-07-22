// Redirection publique pour les QR codes "lien permanent" : le QR imprimé
// encode CETTE URL (stable pour toujours), qui redirige vers la destination
// actuellement configurée par l'hôte. 307 (temporaire) impératif : un 301/308
// serait mis en cache par les navigateurs/scanners et figerait la destination
// malgré tout changement ultérieur — l'inverse de ce que cette fonctionnalité
// doit garantir.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = svc()
  const { data } = await supabase
    .from('qr_redirects')
    .select('id, target_url, click_count')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!data) {
    return NextResponse.redirect('https://jasonmarinho.com', 307)
  }

  // Best-effort, ne doit jamais retarder ni casser la redirection.
  supabase
    .from('qr_redirects')
    .update({ click_count: data.click_count + 1 })
    .eq('id', data.id)
    .then(() => {}, () => {})

  return NextResponse.redirect(data.target_url, 307)
}
