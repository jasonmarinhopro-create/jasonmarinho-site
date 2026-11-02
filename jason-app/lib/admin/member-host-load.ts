// Usage de l'espace hôte pour la fiche membre de l'admin (02/11/2026).
// Admin vérifié par la page avant l'appel. Ne lit que des nombres et des
// dates (count + dernière date) : aucun montant, aucun nom, aucun contenu.
// Chaque lecture est indépendante : une table absente compte pour zéro.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import type { HostUsage, Usage } from './host-journey'
import type { Acquisition } from '@/lib/acquisition/rules'

type Q = any // eslint-disable-line @typescript-eslint/no-explicit-any

export interface MemberHostData {
  usage: HostUsage
  acquisition: Acquisition | null
  newsletter: boolean
}

export async function loadMemberHost(memberId: string): Promise<MemberHostData | null> {
  const db = getServiceClient()

  const usage = async (table: string, at = 'created_at', user = 'user_id', filter?: (q: Q) => Q): Promise<Usage> => {
    try {
      let q: Q = db.from(table).select(at, { count: 'exact' }).eq(user, memberId)
      if (filter) q = filter(q)
      const { data, count, error } = await q.order(at, { ascending: false }).limit(1)
      if (error) return { n: 0, last: null }
      return { n: count ?? 0, last: (data?.[0]?.[at] as string | undefined) ?? null }
    } catch { return { n: 0, last: null } }
  }
  const count = async (table: string, filter?: (q: Q) => Q, user = 'user_id'): Promise<number> => {
    try {
      let q: Q = db.from(table).select('id', { count: 'exact', head: true }).eq(user, memberId)
      if (filter) q = filter(q)
      const { count: c, error } = await q
      return error ? 0 : (c ?? 0)
    } catch { return 0 }
  }

  const [
    logements, calendriers, calEnErreur, importees, sejours, voyageurs, contrats, signes,
    revenus, charges, recurrentes, objectif, evenements, declarations, notifications, profileRes,
  ] = await Promise.all([
    usage('logements'),
    usage('ical_feeds'),
    count('ical_feeds', q => q.gt('consecutive_failures', 0)),
    count('ical_events'),
    usage('sejours', 'created_at', 'user_id', q => q.is('annule_at', null)),
    usage('voyageurs'),
    usage('contracts', 'created_at', 'user_id', q => q.neq('statut', 'annule')),
    count('contracts', q => q.eq('statut', 'signe')),
    usage('revenus_entries'),
    usage('revenus_charges'),
    count('revenus_charges', q => q.not('frequence', 'is', null)),
    count('revenus_objectifs'),
    usage('calendar_events'),
    usage('guest_declarations'),
    count('push_subscriptions'),
    db.from('profiles').select('stripe_account_id, stripe_onboarding_complete, acquisition, newsletter_opt_in').eq('id', memberId).maybeSingle(),
  ])

  const p = profileRes.data as { stripe_account_id: string | null; stripe_onboarding_complete: boolean | null; acquisition: Acquisition | null; newsletter_opt_in: boolean | null } | null
  return {
    usage: {
      logements,
      calendriers: { ...calendriers, enErreur: calEnErreur },
      reservationsImportees: importees,
      sejours,
      voyageurs,
      contrats: { ...contrats, signes },
      paiementsEnLigne: p?.stripe_onboarding_complete ? 'actif' : p?.stripe_account_id ? 'commence' : 'non',
      revenus,
      charges: { ...charges, recurrentes },
      objectif: objectif > 0,
      evenements,
      declarations,
      notifications,
    },
    acquisition: p?.acquisition ?? null,
    newsletter: !!p?.newsletter_opt_in,
  }
}
