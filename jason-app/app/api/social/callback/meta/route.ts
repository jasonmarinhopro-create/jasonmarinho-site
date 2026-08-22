// GET /api/social/callback/meta
// Retour du flow OAuth Meta : échange le code, obtient un token longue
// durée, récupère les Pages gérées (+ leur Instagram Business Account lié
// s'il existe), et connecte tout ce qui est trouvé. Un compte peut gérer
// plusieurs Pages — chacune devient une ligne social_accounts distincte,
// sélectionnable dans le composeur.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { exchangeCodeForUserToken, exchangeForLongLivedToken, getManagedPages } from '@/lib/social/meta'
import { encryptToken } from '@/lib/security/crypto'
import { logger } from '@/lib/logger'

const log = logger('api/social/callback/meta')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
const ADMIN_SOCIAL_URL = `${APP_URL}/dashboard/admin/social`

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
    return NextResponse.redirect(`${ADMIN_SOCIAL_URL}?meta_error=${encodeURIComponent(error)}`)
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('meta_oauth_state')?.value
  cookieStore.delete('meta_oauth_state')

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${ADMIN_SOCIAL_URL}?meta_error=state_invalide`)
  }

  try {
    const redirectUri = `${APP_URL}/api/social/callback/meta`
    const shortLivedToken = await exchangeCodeForUserToken(code, redirectUri)
    const { accessToken: longLivedToken, expiresInSeconds } = await exchangeForLongLivedToken(shortLivedToken)
    const pages = await getManagedPages(longLivedToken)

    if (pages.length === 0) {
      return NextResponse.redirect(`${ADMIN_SOCIAL_URL}?meta_error=aucune_page`)
    }

    const db = serviceClient()
    // Les Page Access Tokens n'expirent pas tant que le token utilisateur
    // longue durée reste valide — on propage sa date d'expiration à titre
    // indicatif (pour savoir quand redemander une connexion).
    const tokenExpiresAt = expiresInSeconds
      ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      : null

    for (const page of pages) {
      const encryptedPageToken = encryptToken(page.accessToken)
      await db.from('social_accounts').upsert({
        user_id: user.id,
        platform: 'facebook',
        external_account_id: page.id,
        display_name: page.name,
        access_token: encryptedPageToken,
        token_expires_at: tokenExpiresAt,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'platform,external_account_id' })

      if (page.instagramAccountId) {
        await db.from('social_accounts').upsert({
          user_id: user.id,
          platform: 'instagram',
          external_account_id: page.instagramAccountId,
          display_name: page.instagramUsername ? `@${page.instagramUsername}` : page.name,
          access_token: encryptedPageToken, // la publication IG passe par le token de la Page liée
          token_expires_at: tokenExpiresAt,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'platform,external_account_id' })
      }
    }

    return NextResponse.redirect(`${ADMIN_SOCIAL_URL}?meta_connected=1`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('callback échoué', { err: message })
    return NextResponse.redirect(`${ADMIN_SOCIAL_URL}?meta_error=${encodeURIComponent(message)}`)
  }
}
