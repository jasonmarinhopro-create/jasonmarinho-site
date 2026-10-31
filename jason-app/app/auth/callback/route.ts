// Retour de Google (31/10/2026, inscription et connexion « Continuer avec
// Google »). Le code est échangé contre une session (cookies). Compte créé à
// l'instant : le profil reçoit ce qui a été choisi avant de partir chez Google
// (investisseur, lettre, provenance, cookie posé par la page d'inscription) et
// Jason est prévenu comme pour une inscription par formulaire.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { cleanAcquisition } from '@/lib/acquisition/rules'
import { COOKIE_INSCRIPTION } from '@/lib/auth/google'
import { annoncerInscription, inscrireNewsletter } from '@/lib/auth/nouveau-membre'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
const log = logger('auth-callback')

const NOUVEAU_MS = 10 * 60_000

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const code = req.nextUrl.searchParams.get('code')
  const echec = NextResponse.redirect(`${origin}/auth/login?google=echec`)
  if (!code) return echec

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  const user = data?.user
  if (error || !user) {
    log.warn('échange du code', { err: error?.message })
    return echec
  }

  let choix: { p?: string; nl?: boolean; acq?: unknown } = {}
  try { choix = JSON.parse(req.cookies.get(COOKIE_INSCRIPTION)?.value || '{}') } catch { choix = {} }

  const nouveau = Date.now() - new Date(user.created_at).getTime() < NOUVEAU_MS
  if (nouveau && user.email) {
    const isInvestor = choix.p === 'investor'
    const acquisition = cleanAcquisition(choix.acq)
    const fullName = (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || null
    const db = getServiceClient()
    const champs = {
      ...(isInvestor ? { is_investor: true } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(acquisition ? { acquisition } : {}),
      ...(choix.nl ? { newsletter_opt_in: true, newsletter_opt_in_at: new Date().toISOString() } : {}),
    }
    if (Object.keys(champs).length) {
      const { error: upErr } = await db.from('profiles').update(champs).eq('id', user.id)
      if (upErr) log.warn('profil', { msg: upErr.message })
    }
    await Promise.all([
      annoncerInscription({ email: user.email, fullName, isInvestor, isDriingMember: false, acquisition, via: 'google' }),
      choix.nl ? inscrireNewsletter(user.email) : Promise.resolve(),
    ])
  }

  const res = NextResponse.redirect(`${origin}/ouverture`)
  res.cookies.set(COOKIE_INSCRIPTION, '', { path: '/', maxAge: 0 })
  return res
}
