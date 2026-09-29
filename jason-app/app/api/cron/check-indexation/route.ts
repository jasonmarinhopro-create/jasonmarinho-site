// Vérifie le statut d'indexation Google réel de toutes les pages du sitemap
// (API Search Console) et le persiste en DB. Déclenché une fois par jour par
// un GitHub Actions scheduled workflow (.github/workflows/check-indexation.yml),
// PAS par un Vercel Cron : le plan Hobby limite le nombre de crons Vercel du
// projet (déjà 2 utilisés : notifications-engine, ping-db) — même schéma que
// social-dispatch. Sécurisé par SEO_CRON_SECRET (dédié, distinct du
// CRON_SECRET auto-injecté par Vercel pour ses propres crons).

import { NextResponse } from 'next/server'
import { checkAllUrls } from '@/lib/seo/check-indexation'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const expectedSecret = process.env.SEO_CRON_SECRET
  if (expectedSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const result = await checkAllUrls()
  // Connexion Google expirée : le workflow GitHub échoue (e-mail d'échec à
  // Jason) au lieu de passer au vert sans rien vérifier.
  return NextResponse.json(result, { status: result.authExpired ? 503 : 200 })
}
