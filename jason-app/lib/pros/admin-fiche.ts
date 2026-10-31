// Actions admin communes aux 3 annuaires (31/10/2026, étape 4 du projet
// « Dépannage et maintenance ») : masquer, réactiver, supprimer une
// inscription jamais payée. Le dépannage s'en sert ; ménage et photographe
// gardent pour l'instant leurs propres actions (même logique), à brancher ici
// lors de leur passage sur fiche-core.ts.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'
import { isUnpaidFiche } from '@/lib/pros/paid'
import { KINDS, METIERS, type ProKind } from '@/lib/pros/metiers'

export type AdminResult = { success?: boolean; error?: string }

export async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return { error: 'Réservé administrateur' }
  return { userId: user.id }
}

/** Masque (ou réactive) une fiche : retirée du site, abonnement Stripe intact. */
export async function setFicheHidden(kind: ProKind, id: string, hidden: boolean): Promise<AdminResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }
  const M = METIERS[kind]
  const db = getServiceClient()
  const { data: row } = await db.from(M.table).select('id, status').eq('id', id).maybeSingle()
  if (!row) return { error: 'Fiche introuvable' }
  if (hidden ? row.status !== 'active' : row.status !== 'hidden') return { error: `Statut actuel : ${row.status}` }
  const { error } = await db.from(M.table).update({
    status: hidden ? 'hidden' : 'active',
    is_public: !hidden,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: 'Enregistrement impossible, réessaie.' }
  await triggerSiteRebuild(`admin ${M.slug}`)
  return { success: true }
}

/**
 * Supprime une inscription jamais payée : annule l'abonnement Stripe resté
 * ouvert, retire la fiche, puis le compte s'il ne sert qu'à elle (jamais un
 * compte hôte avec logements ni un compte qui a une autre fiche pro).
 */
export async function deleteUnpaidFiche(kind: ProKind, id: string): Promise<AdminResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }
  const M = METIERS[kind]
  const db = getServiceClient()
  const { data: f } = await db.from(M.table)
    .select('id, status, stripe_subscription_id, stripe_subscription_status, is_public, slug, user_id')
    .eq('id', id).maybeSingle()
  if (!f) return { error: 'Fiche introuvable' }
  if (!isUnpaidFiche(f)) return { error: 'Cette fiche a été payée : masque-la plutôt (son abonnement Stripe se gère à part).' }
  if (f.stripe_subscription_id && f.stripe_subscription_status !== 'incomplete_expired') {
    await stripe.subscriptions.cancel(f.stripe_subscription_id).catch(() => {})
  }
  const { error } = await db.from(M.table).delete().eq('id', id)
  if (error) return { error: 'Suppression impossible, réessaie.' }
  if (f.slug || f.is_public) await triggerSiteRebuild('admin suppression')

  if (f.user_id) {
    const counts = await Promise.all([
      db.from('logements').select('id', { count: 'exact', head: true }).eq('user_id', f.user_id),
      ...KINDS.map(k => db.from(METIERS[k].table).select('id', { count: 'exact', head: true }).eq('user_id', f.user_id)),
    ])
    if (counts.every(c => !c.error && !c.count)) {
      await db.auth.admin.deleteUser(f.user_id).catch(() => {})
    }
  }
  return { success: true }
}
