// Vérification d'un paiement de loyer directement chez Stripe (04/10/2026,
// incident d'une hôte). Protégé par CRON_SECRET ou SOCIAL_CRON_SECRET, appelé
// par le workflow « Paiements des contrats » (journaux publics) : réponse
// sans nom, e-mail ni montant, seulement des pourcentages du loyer.
// Met aussi le contrat à « payé » si Stripe a un paiement (webhook manqué).
import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { syncLoyerPayment } from '@/lib/stripe/loyer-payment'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function authorized(req: Request) {
  const secrets = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  return secrets.length > 0 && secrets.some(s => req.headers.get('authorization') === `Bearer ${s}`)
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'non autorisé' }, { status: 401 })
  const { arrivee, depart } = await req.json().catch(() => ({})) as { arrivee?: string; depart?: string }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arrivee ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(depart ?? '')) {
    return NextResponse.json({ error: 'dates attendues : AAAA-MM-JJ' }, { status: 400 })
  }
  const db = getServiceClient()
  const { data: contracts } = await db.from('contracts').select('*').eq('date_arrivee', arrivee!).eq('date_depart', depart!)
  const out = []
  for (const c of contracts ?? []) {
    const { data: host } = await db.from('profiles').select('stripe_account_id').eq('id', c.user_id).maybeSingle()
    if (!host?.stripe_account_id) { out.push({ contrat: String(c.id).slice(0, 8), erreur: 'pas de compte Stripe' }); continue }
    const before = c.stripe_payment_status
    const sync = await syncLoyerPayment(db, c, host.stripe_account_id)
    const loyer = Number(c.montant_loyer) || 0
    out.push({
      contrat: String(c.id).slice(0, 8),
      acompte_prevu: `${Number(c.acompte_percent ?? 100)} %`,
      statut_avant: before,
      paiements_stripe: sync.sessions.map(s => ({
        part_du_loyer: loyer ? `${Math.round(s.amount / loyer * 100)} %` : '?',
        le: new Date(s.created * 1000).toISOString().slice(0, 16),
      })),
      statut_apres: sync.paid ? 'paid' : before,
    })
  }
  return NextResponse.json({ contrats: out })
}
