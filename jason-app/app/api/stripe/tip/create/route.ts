import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

const MIN_AMOUNT = 100   // 1,00 € minimum
const MAX_AMOUNT = 50000 // 500,00 € maximum

// POST /api/stripe/tip/create, route publique, aucune auth requise
// Body: { amount: number }, montant en centimes (ex: 298 pour 2,98 €)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { amount } = body as { amount?: number }

  if (!amount || !Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Contribution, jasonmarinho.com',
          description: 'Soutenir le développement de la plateforme pour les hôtes LCD.',
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    success_url: `${APP_URL}/soutenir?merci=1`,
    cancel_url:  `${APP_URL}/soutenir`,
    locale: 'fr',
    payment_method_types: ['card'],
  })

  return NextResponse.json({ url: session.url })
}
