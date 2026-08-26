// GET /api/google/callback
// Retour du flow OAuth Google : échange le code contre un refresh_token,
// le chiffre et le stocke en base (google_oauth_tokens). Même schéma que
// /api/social/callback/meta.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { exchangeCodeForTokens } from '@/lib/google/oauth'
import { encryptToken } from '@/lib/security/crypto'
import { logger } from '@/lib/logger'

const log = logger('api/google/callback')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
const ADMIN_INDEXATION_URL = `${APP_URL}/dashboard/admin/indexation`

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', req.url))

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url))

  const searchParams = req.nextUrl.searchParams
  const error = searchParams.get('error')
  if (error) {
    return NextResponse.redirect(`${ADMIN_INDEXATION_URL}?google_error=${encodeURIComponent(error)}`)
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('google_oauth_state')?.value
  cookieStore.delete('google_oauth_state')

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${ADMIN_INDEXATION_URL}?google_error=state_invalide`)
  }

  try {
    const redirectUri = `${APP_URL}/api/google/callback`
    const { refreshToken } = await exchangeCodeForTokens(code, redirectUri)
    if (!refreshToken) {
      // Google ne renvoie un refresh_token que si prompt=consent a forcé un
      // nouvel accord — ne devrait pas arriver vu buildAuthorizeUrl, mais on
      // ne veut surtout pas écraser silencieusement un token existant avec null.
      return NextResponse.redirect(`${ADMIN_INDEXATION_URL}?google_error=pas_de_refresh_token`)
    }

    const db = serviceClient()
    await db.from('google_oauth_tokens').upsert({
      service: 'search_console',
      refresh_token: encryptToken(refreshToken),
      connected_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'service' })

    return NextResponse.redirect(`${ADMIN_INDEXATION_URL}?google_connected=1`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('callback échoué', { err: message })
    return NextResponse.redirect(`${ADMIN_INDEXATION_URL}?google_error=${encodeURIComponent(message)}`)
  }
}
