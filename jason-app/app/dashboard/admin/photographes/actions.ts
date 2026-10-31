'use server'

import { syncProSubscriptions } from '@/lib/pros/subscription-sync'
import { getServiceClient } from '@/lib/supabase/service'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'
import { isUnpaidFiche } from '@/lib/pros/paid'
import { revalidatePath } from 'next/cache'
import { requireAdmin, setFicheHidden, deleteUnpaidFiche, type AdminResult } from '@/lib/pros/admin-fiche'

/**
 * Récupère les KPIs + listes pour la page admin photographes.
 *
 * Le flow étant désormais self-service (paiement direct), il n'y a plus
 * de queue de validation manuelle. L'admin se concentre sur :
 * - active : fiches publiques actuellement dans l'annuaire
 * - pendingPayment : inscrits qui ont créé un compte mais pas confirmé
 *   le paiement Stripe (orphelins potentiels nettoyés au prochain
 *   signup avec le même email)
 * - hidden : fiches masquées par modération (action admin)
 * - cancelled : abonnements résiliés (volonté du pro ou non-paiement)
 */
export async function getPhotographersQueue(): Promise<{
  active: any[]
  pendingPayment: any[]
  hidden: any[]
  cancelled: any[]
  founderActiveCount: number
  demo?: any[]
  // Legacy pour la rétro-compat du composant existant.
  pending: any[]
  approvedPendingPayment: any[]
  rejected: any[]
  error?: string
}> {
  const auth = await requireAdmin()
  if ('error' in auth) return {
    active: [], pendingPayment: [], hidden: [], cancelled: [],
    founderActiveCount: 0,
    pending: [], approvedPendingPayment: [], rejected: [],
    error: auth.error,
  }

  const admin = getServiceClient()
  // Statut des abonnements relu chez Stripe avant d'afficher (3 s au plus)
  await syncProSubscriptions(admin, 3000)
  const [activeRes, pendingPaymentRes, hiddenRes, cancelledRes, admins] = await Promise.all([
    admin.from('photographers').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(200),
    admin.from('photographers').select('*').eq('status', 'pending_payment').order('created_at', { ascending: false }).limit(50),
    admin.from('photographers').select('*').eq('status', 'hidden').order('updated_at', { ascending: false }).limit(50),
    admin.from('photographers').select('*').eq('status', 'cancelled').order('updated_at', { ascending: false }).limit(50),
    adminUserIds(admin),
  ])
  // Fiches d'exemple (comptes admin) : à part, hors chiffres et places Fondateur
  const lists = [activeRes.data ?? [], pendingPaymentRes.data ?? [], hiddenRes.data ?? [], cancelledRes.data ?? []].map(rows => splitDemo(rows, admins))
  const [activeAll, pendingRaw, hidden, cancelled] = lists.map(l => l.real)
  // Une fiche jamais payée n'est pas « active », même si un ancien bug l'avait marquée ainsi (20/10/2026)
  const active = activeAll.filter(r => !isUnpaidFiche(r))
  const pendingPayment = [...activeAll.filter(r => isUnpaidFiche(r)), ...pendingRaw]

  return {
    active,
    pendingPayment,
    hidden,
    cancelled,
    demo: lists.flatMap(l => l.demo),
    founderActiveCount: active.filter(r => r.tier === 'fondateur').length,
    pending: [], approvedPendingPayment: [], rejected: [],
  }
}

// Masquer, réactiver, supprimer une inscription jamais payée : code commun aux
// 3 annuaires (lib/pros/admin-fiche.ts, 31/10/2026). Validation et refus à la
// main retirés (inscription en libre-service depuis octobre 2026, plus appelés).

export async function hidePhotographer(id: string): Promise<AdminResult> {
  const r = await setFicheHidden('photographer', id, true)
  if (r.success) revalidatePath('/dashboard/admin/photographes')
  return r
}

export async function unhidePhotographer(id: string): Promise<AdminResult> {
  const r = await setFicheHidden('photographer', id, false)
  if (r.success) revalidatePath('/dashboard/admin/photographes')
  return r
}

export async function deleteOrphanPhotographer(id: string): Promise<AdminResult> {
  const r = await deleteUnpaidFiche('photographer', id)
  if (r.success) revalidatePath('/dashboard/admin/photographes')
  return r
}
