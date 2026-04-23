import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/connect/return')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET /api/stripe/connect/return?account_id=acct_xxx
// Stripe redirige ici après l'onboarding Express
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')

  if (!accountId) {
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
      .eq('stripe_account_id', accountId)

    const status = isComplete ? 'success' : 'pending'
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=${status}`)
  } catch (err) {
    log.error('unexpected', err)
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=error`)
  }
}
