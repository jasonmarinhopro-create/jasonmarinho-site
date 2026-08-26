// GET /api/google/connect
// Démarre le flow OAuth Google (Search Console). Admin only. Le state
// anti-CSRF est posé en cookie httpOnly, vérifié au retour dans le callback.
// Même schéma que /api/social/connect/meta.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorizeUrl, SEARCH_CONSOLE_SCOPE } from '@/lib/google/oauth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', req.url))

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url))

  const state = randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const redirectUri = `${APP_URL}/api/google/callback`
  const authorizeUrl = buildAuthorizeUrl(redirectUri, state, SEARCH_CONSOLE_SCOPE)
  return NextResponse.redirect(authorizeUrl)
}
