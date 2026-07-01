import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

export interface UserSpace {
  key: 'host' | 'photographer' | 'cleaner'
  label: string
  href: string
  subtitle?: string | null
  active: boolean
}

export interface SpacesResult {
  spaces: UserSpace[]
  primary: UserSpace
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Détermine les espaces auxquels l'utilisateur connecté a accès.
 *
 * Logique de détection :
 *  - Hôte : actif si l'utilisateur a ≥ 1 logement OU est admin OU n'a
 *    aucun autre espace (cas par défaut pour les nouveaux comptes).
 *  - Photographe : actif si row dans photographers où user_id matche.
 *  - Ménage : actif si row dans cleaners où user_id matche.
 *
 * `primary` correspond au premier espace actif (utilisé par le post-login
 * redirect). L'espace courant est déduit côté client via usePathname() —
 * le passer ici en arg casserait le memo entre routes sœurs sous le même
 * layout (Next.js router cache).
 */
// PERF : les 3 queries (logements count + fiche photographe + fiche menage)
// sont cachees pendant 5 min. Ces valeurs ne changent quasi jamais dans
// la vie normale d'un utilisateur (ajout d'une fiche pro = action explicite
// qui peut trigger revalidateTag). Evite de refaire 3 queries a chaque
// navigation dans le dashboard.
const fetchSpacesDataForUser = (userId: string) => unstable_cache(
  async () => {
    const admin = getServiceClient()
    const [{ count: logementsCount }, { data: ph }, { data: cl }] = await Promise.all([
      admin.from('logements').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      admin.from('photographers').select('full_name, pseudo, slug, status').eq('user_id', userId).maybeSingle(),
      admin.from('cleaners').select('full_name, pseudo, slug, status').eq('user_id', userId).maybeSingle(),
    ])
    return { logementsCount, ph, cl }
  },
  ['user-spaces-data', userId],
  { revalidate: 300, tags: [`spaces:${userId}`] },
)()

export const getUserSpaces = cache(async (): Promise<SpacesResult> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const host: UserSpace = { key: 'host', label: 'Hôte LCD', href: '/dashboard', active: false }
    return { spaces: [host], primary: host }
  }

  const isAdmin = user.email === ADMIN_EMAIL
  const { logementsCount, ph, cl } = await fetchSpacesDataForUser(user.id)

  const hasLogements = (logementsCount ?? 0) > 0
  const hasPhoto = !!ph
  const hasCleaner = !!cl

  // Host actif si admin, ou logements présents, ou aucun autre espace.
  const hostActive = isAdmin || hasLogements || (!hasPhoto && !hasCleaner)

  const spaces: UserSpace[] = [
    {
      key: 'host',
      label: 'Hôte LCD',
      href: '/dashboard',
      subtitle: isAdmin ? 'Mode admin' : (hasLogements ? `${logementsCount} logement${logementsCount! > 1 ? 's' : ''}` : null),
      active: hostActive,
    },
  ]
  if (hasPhoto) {
    spaces.push({
      key: 'photographer',
      label: 'Photographe',
      href: '/dashboard/ma-fiche-photographe',
      subtitle: ph!.pseudo || ph!.full_name,
      active: true,
    })
  }
  if (hasCleaner) {
    spaces.push({
      key: 'cleaner',
      label: 'Équipe ménage',
      href: '/dashboard/ma-fiche-menage',
      subtitle: cl!.pseudo || cl!.full_name,
      active: true,
    })
  }

  return { spaces, primary: spaces[0] }
})
