// Pastille « QG demandes » du menu admin (18/11/2026) : nombre d'éléments à
// traiter, mêmes règles que les compteurs de la page QG (AdminQG) :
// demandes d'hôtes à traiter (aTraiter), membres Driing en attente,
// signalements (non validés + publics en attente + demandes de retrait) et
// suggestions non traitées. Gardé 15 min ; vidé par les actions admin (tag
// admin-overview, déjà posé par les actions du QG) et par admin-qg-count.
// Comptes admin seulement (appelé par le layout quand profile.role === 'admin').
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { loadDemandesQG } from '@/app/dashboard/admin/qg/demandes-load'

export const getQgCount = unstable_cache(async (): Promise<number> => {
  const db = getServiceClient()
  const head = { count: 'exact' as const, head: true }
  const [demandes, driing, nonValides, moderation, retraits, suggestions] = await Promise.all([
    loadDemandesQG(),
    db.from('profiles').select('id', head).eq('driing_status', 'pending'),
    db.from('reported_guests').select('id', head).eq('is_validated', false),
    db.from('reported_guests').select('id', head).eq('moderation_status', 'pending'),
    db.from('reported_guests').select('id', head).not('removal_request_at', 'is', null).eq('moderation_status', 'approved'),
    db.from('suggestions').select('id', head).is('treated_at', null),
  ])
  if (demandes.error) throw new Error(`qg-count : ${demandes.error}`)
  for (const r of [driing, nonValides, moderation, retraits, suggestions]) {
    if (r.error) throw new Error(`qg-count : ${r.error.message}`)
  }
  return demandes.demandes.filter(d => d.aTraiter).length
    + (driing.count ?? 0) + (nonValides.count ?? 0) + (moderation.count ?? 0) + (retraits.count ?? 0) + (suggestions.count ?? 0)
}, ['admin-qg-count-v1'], { revalidate: 900, tags: ['admin-qg-count', 'admin-overview'] })
