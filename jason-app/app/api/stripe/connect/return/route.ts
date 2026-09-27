import { getServiceClient as createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/connect/return')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// GET /api/stripe/connect/return?account_id=acct_xxx
// Stripe redirige ici après l'onboarding Express.
// SÉCURITÉ : on ne met à jour que le compte Connect de l'utilisateur connecté
// (le paramètre account_id doit correspondre à profiles.stripe_account_id).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('account_id')

  const userClient = await createUserClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  const { data: profile } = await userClient
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .maybeSingle()
  const accountId = profile?.stripe_account_id as string | null | undefined

  if (!accountId || (requested && requested !== accountId)) {
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=error`)
  }

  try {
    // Vérifier que le compte a bien terminé l'onboarding
    const account = await stripe.accounts.retrieve(accountId)
    const isComplete = account.details_submitted && !account.requirements?.currently_due?.length

    // Mettre à jour le profil via service role
    const supabase = createServiceClient()
    await supabase
      .from('profiles')
      .update({
        stripe_account_id: accountId,
        stripe_onboarding_complete: isComplete ?? false,
      })
      .eq('id', user.id)

    const status = isComplete ? 'success' : 'pending'
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=${status}`)
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=error`)
  }
}
