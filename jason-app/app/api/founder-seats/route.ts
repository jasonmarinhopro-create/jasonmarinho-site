import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'
import { FOUNDER_TOTAL_SEATS } from '@/lib/constants/founder'

export const runtime = 'nodejs'
// On laisse Next.js mettre cette route en SSG-friendly avec revalidation : la
// donnée n'est pas critique au point d'exiger un fetch DB par requête.
export const revalidate = 60

const ALLOWED_ORIGINS = new Set([
  'https://jasonmarinho.com',
  'https://www.jasonmarinho.com',
  'https://app.jasonmarinho.com',
  'http://localhost:3000',
  'http://localhost:5500',
])

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://jasonmarinho.com'
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(req.headers.get('origin')),
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin')

  const FOUNDING_PRICE_IDS = [
    STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY,
    STRIPE_PLANS.STANDARD_FOUNDING_YEARLY,
  ].filter(Boolean) as string[]

  try {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { count, error } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('stripe_price_id', FOUNDING_PRICE_IDS)
      .in('stripe_subscription_status', ['active', 'trialing'])

    if (error) throw error

    const taken = count ?? 0
    const remaining = Math.max(0, FOUNDER_TOTAL_SEATS - taken)
    const exhausted = remaining === 0

    return NextResponse.json(
      { total: FOUNDER_TOTAL_SEATS, taken, remaining, exhausted },
      { headers: corsHeaders(origin) },
    )
  } catch {
    // Fallback safe : si la DB est down, on renvoie le maximum (offre encore
    // active) plutôt que de bloquer la page tarifs.
    return NextResponse.json(
      { total: FOUNDER_TOTAL_SEATS, taken: 0, remaining: FOUNDER_TOTAL_SEATS, exhausted: false, fallback: true },
      { headers: corsHeaders(origin) },
    )
  }
}
