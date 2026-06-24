import { cache } from 'react'
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
 * Retourne aussi un `primary` = espace par défaut pour le post-login
 * redirect (généralement le premier espace actif dans l'ordre Hôte/Photo/Ménage).
 */
export const getUserSpaces = cache(async (currentPath: string = '/dashboard'): Promise<SpacesResult> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const host: UserSpace = { key: 'host', label: 'Hôte LCD', href: '/dashboard', active: false }
    return { spaces: [host], primary: host }
  }

  const admin = getServiceClient()
  const isAdmin = user.email === ADMIN_EMAIL

  // Parallel : logements count + photographers fiche + cleaners fiche
  const [{ count: logementsCount }, { data: ph }, { data: cl }] = await Promise.all([
    admin.from('logements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('photographers').select('full_name, pseudo, slug, status').eq('user_id', user.id).maybeSingle(),
    admin.from('cleaners').select('full_name, pseudo, slug, status').eq('user_id', user.id).maybeSingle(),
  ])

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

  // Détermine l'espace courant à partir du path
  let primary = spaces[0]
  if (currentPath.startsWith('/dashboard/ma-fiche-photographe')) {
    primary = spaces.find(s => s.key === 'photographer') ?? spaces[0]
  } else if (currentPath.startsWith('/dashboard/ma-fiche-menage')) {
    primary = spaces.find(s => s.key === 'cleaner') ?? spaces[0]
  }

  return { spaces, primary }
})
