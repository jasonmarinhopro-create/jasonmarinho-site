// GET /api/social/connect/meta
// Démarre le flow OAuth Meta (Facebook + Instagram partagent la même app).
// Admin only. Le state anti-CSRF est posé en cookie httpOnly, vérifié au
// retour dans le callback.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorizeUrl } from '@/lib/social/meta'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', req.url))

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url))

  const state = randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('meta_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const redirectUri = `${APP_URL}/api/social/callback/meta`
  const authorizeUrl = buildAuthorizeUrl(redirectUri, state)
  return NextResponse.redirect(authorizeUrl)
}
