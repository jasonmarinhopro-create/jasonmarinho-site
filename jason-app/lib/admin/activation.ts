// Chargement du tableau « Où en sont tes membres » (Vue d'ensemble admin,
// 19/11/2026). Gardé 15 min comme le reste de la Vue d'ensemble (tag
// admin-overview, vidé par les actions admin). Lectures en service role,
// colonnes minimales ; appelé seulement par la page admin (rôle vérifié).
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { allRows } from '@/lib/supabase/all-rows'
import { computeActivation, type Activation } from './activation-rules'

export const getActivation = unstable_cache(async (): Promise<Activation> => {
  const db = getServiceClient()
  const [profiles, logements, ical, contracts] = await Promise.all([
    allRows<{ id: string; role: string | null; plan: string | null; created_at: string | null; last_seen_at: string | null; stripe_onboarding_complete: boolean | null }>((from, to) =>
      db.from('profiles').select('id, role, plan, created_at, last_seen_at, stripe_onboarding_complete').order('id').range(from, to)),
    allRows<{ user_id: string | null }>((from, to) => db.from('logements').select('user_id').not('user_id', 'is', null).order('id').range(from, to)),
    allRows<{ user_id: string | null }>((from, to) => db.from('ical_feeds').select('user_id').not('user_id', 'is', null).order('id').range(from, to)),
    allRows<{ user_id: string | null }>((from, to) => db.from('contracts').select('user_id').not('user_id', 'is', null).order('id').range(from, to)),
  ])
  for (const r of [profiles, logements, ical, contracts]) {
    if (r.error) throw new Error(`activation : ${r.error.message}`)
  }
  return computeActivation({
    profiles: profiles.rows,
    logementUsers: logements.rows.map(r => r.user_id),
    icalUsers: ical.rows.map(r => r.user_id),
    contractUsers: contracts.rows.map(r => r.user_id),
    now: new Date(),
  })
}, ['admin-activation-v1'], { revalidate: 900, tags: ['admin-overview'] })
