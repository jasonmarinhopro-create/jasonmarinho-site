import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getCachedCommunityGroups, getCachedTemplatesCatalog } from '@/lib/queries/cache'
import CommunauteView from './CommunauteView'

export const dynamic = 'force-dynamic'

export interface FacebookTemplate {
  id: string
  title: string
  content: string
}

export interface CommunauteLogement {
  id: string
  nom: string
  lien_driing: string | null
}

export default async function CommunautePage() {
  const [profile, supabase, groups, templates] = await Promise.all([
    getProfile(),
    createClient(),
    getCachedCommunityGroups(),
    getCachedTemplatesCatalog(),
  ])

  const [{ data: mems }, { data: userLogementsData }] = profile?.userId
    ? await Promise.all([
        supabase.from('user_community_memberships').select('group_id, status').eq('user_id', profile.userId),
        supabase.from('logements').select('id, nom, adresse, lien_driing').eq('user_id', profile.userId).order('nom'),
      ])
    : [{ data: [] as { group_id: string; status: string }[] }, { data: [] as { id: string; nom: string; adresse: string | null; lien_driing: string | null }[] }]

  const memberships: Record<string, 'joined' | 'dismissed'> = {}
  ;(mems ?? []).forEach(m => {
    memberships[m.group_id] = m.status as 'joined' | 'dismissed'
  })

  const userAdresses = (userLogementsData ?? []).map(l => (l.adresse ?? '').toLowerCase()).filter(Boolean)

  // Templates Facebook : posts prêts à coller dans les groupes (catalogue cached).
  const facebookTemplates: FacebookTemplate[] = templates
    .filter(t => t.category === 'facebook')
    .map(t => ({ id: t.id, title: t.title, content: t.content }))

  // Logements de l'utilisateur pour le sélecteur (auto-fill du lien Driing).
  const userLogements: CommunauteLogement[] = (userLogementsData ?? []).map(l => ({
    id: l.id,
    nom: l.nom,
    lien_driing: l.lien_driing,
  }))

  return (
    <>
      <CommunauteView
        groups={groups}
        userId={profile?.userId ?? null}
        initialMemberships={memberships}
        userAdresses={userAdresses}
        facebookTemplates={facebookTemplates}
        userLogements={userLogements}
      />
    </>
  )
}
