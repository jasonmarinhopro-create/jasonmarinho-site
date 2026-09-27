import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/connect/refresh')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// GET /api/stripe/connect/refresh?account_id=acct_xxx
// Stripe redirige ici si le lien d'onboarding a expiré, on en génère un nouveau.
// SÉCURITÉ : le lien n'est généré que pour le compte Connect de l'utilisateur
// connecté (getUser + profiles.stripe_account_id). Le paramètre account_id
// n'est jamais cru sur parole : sans ce contrôle, n'importe qui connaissant
// un acct_xxx obtenait un lien d'onboarding sur le compte d'un autre hôte.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('account_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .maybeSingle()
  const accountId = profile?.stripe_account_id as string | null | undefined

  if (!accountId || (requested && requested !== accountId)) {
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=error`)
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect/refresh?account_id=${accountId}`,
      return_url:  `${APP_URL}/api/stripe/connect/return?account_id=${accountId}`,
      type: 'account_onboarding',
    })
    return NextResponse.redirect(accountLink.url)
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=error`)
  }
}
