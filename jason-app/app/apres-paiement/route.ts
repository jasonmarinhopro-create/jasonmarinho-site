// Retour du paiement d'une fiche pro créée depuis le site (24/10/2026, Jason :
// « quand quelqu'un paye, ça le redirige sur son profil dans le dashboard bien
// connecté »). Avant : page de confirmation du site, puis connexion à la main.
//
// Stripe renvoie ici avec l'identifiant de la session de paiement. Le compte est
// connecté seulement si cette session est payée, récente (3 h), liée à une fiche
// de ce compte, et pas encore utilisée pour se connecter (marquée chez Stripe
// après le premier passage). Sinon : la page de confirmation du site, qui
// propose de se connecter. Hors du middleware (pas sous /auth ni /dashboard).
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { METIERS, metierParSlug } from '@/lib/pros/metiers'

export const dynamic = 'force-dynamic'
const log = logger('apres-paiement')

const MAX_AGE_S = 3 * 3600

export async function GET(req: NextRequest) {
  // ?pro=photographe | menage | depannage (registre lib/pros/metiers.ts)
  const m = metierParSlug(req.nextUrl.searchParams.get('pro')) ?? METIERS.photographer
  const k = { table: m.table, meta: m.idColumn, fiche: m.espace }
  const fallback = NextResponse.redirect(`https://jasonmarinho.com${m.annuaire}/inscription/confirmation?status=paid`)
  const sessionId = req.nextUrl.searchParams.get('session_id') ?? ''
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return fallback

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const meta = session.metadata ?? {}
    const userId = meta.user_id
    const ficheId = meta[k.meta]
    const fresh = Date.now() / 1000 - session.created < MAX_AGE_S
    const paid = session.status === 'complete' && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')
    if (!paid || !fresh || !userId || !ficheId || meta.login_used === '1') return fallback

    const db = getServiceClient()
    const { data: fiche } = await db.from(k.table).select('id').eq('id', ficheId).eq('user_id', userId).maybeSingle()
    if (!fiche) return fallback
    const { data: u } = await db.auth.admin.getUserById(userId)
    const email = u?.user?.email
    if (!email) return fallback

    // Lien de connexion à usage unique, vérifié aussitôt : la session est posée dans les cookies
    const { data: link, error: linkErr } = await db.auth.admin.generateLink({ type: 'magiclink', email })
    const tokenHash = link?.properties?.hashed_token
    if (linkErr || !tokenHash) { log.error('lien de connexion', { err: linkErr?.message }); return fallback }
    const supabase = await createClient()
    const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
    if (otpErr) { log.error('connexion après paiement', { err: otpErr.message }); return fallback }

    // Une seule connexion par paiement
    await stripe.checkout.sessions.update(sessionId, { metadata: { ...meta, login_used: '1' } }).catch(() => {})

    return NextResponse.redirect(new URL(`${k.fiche}?paid=1&bienvenue=1`, req.nextUrl.origin))
  } catch (e) {
    log.error('retour de paiement', { err: e instanceof Error ? e.message : String(e) })
    return fallback
  }
}
