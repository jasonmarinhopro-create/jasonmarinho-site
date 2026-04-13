import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

// GET /api/stripe/connect/refresh?account_id=acct_xxx
// Stripe redirige ici si le lien d'onboarding a expiré — on en génère un nouveau
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')

  if (!accountId) {
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
    console.error('[stripe/connect/refresh]', err)
    return NextResponse.redirect(`${APP_URL}/dashboard/profil?stripe=error`)
  }
}
