// Newsletter mensuelle (11/10/2026) : pilotage par le workflow « Newsletter »
// (journaux publics : nombres et oui / non seulement). Protégé par CRON_SECRET
// ou SOCIAL_CRON_SECRET. op : etat (listes Brevo, expéditeur), apercu (lettre
// envoyée à Jason sans rien programmer), programmer (crée et programme la
// lettre du mois maintenant, sauf si elle existe déjà).
import { NextResponse, type NextRequest } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { brevoStatus, prepareMonthlyNewsletter, previewNewsletter } from '@/lib/newsletter/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(req: NextRequest) {
  const secrets = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  return secrets.length > 0 && secrets.some(s => req.headers.get('authorization') === `Bearer ${s}`)
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { op?: string }
  const db = getServiceClient()
  try {
    if (body.op === 'apercu') return NextResponse.json(await previewNewsletter(db, parisToday()))
    if (body.op === 'programmer') return NextResponse.json(await prepareMonthlyNewsletter(db, parisToday(), { force: true }))
    return NextResponse.json(await brevoStatus())
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message).slice(0, 200) }, { status: 500 })
  }
}
