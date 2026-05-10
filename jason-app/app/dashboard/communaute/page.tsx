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

export interface SavedFacebookPost {
  id: string
  logement_id: string | null
  title: string
  content: string
}

export default async function CommunautePage() {
  const [profile, supabase, groups, templates] = await Promise.all([
    getProfile(),
    createClient(),
    getCachedCommunityGroups(),
    getCachedTemplatesCatalog(),
  ])

  let userLogementsData: { id: string; nom: string; adresse: string | null; lien_driing: string | null; lien_site_direct: string | null }[] = []
  let mems: { group_id: string; status: string }[] = []
  let savedFbPosts: SavedFacebookPost[] = []

  if (profile?.userId) {
    const [memsRes, logRes, postsRes] = await Promise.all([
      supabase.from('user_community_memberships').select('group_id, status').eq('user_id', profile.userId),
      // On tente avec lien_driing (migration 035). Si la migration n'est pas
      // encore appliquée, fallback gracieux sans cette colonne.
      supabase.from('logements').select('id, nom, adresse, lien_driing, lien_site_direct').eq('user_id', profile.userId).order('nom'),
      // Posts Facebook sauvegardés (migration 036). Fallback gracieux si pas encore appliquée.
      supabase.from('user_facebook_posts').select('id, logement_id, title, content').eq('user_id', profile.userId),
    ])
    mems = memsRes.data ?? []
    if (logRes.error) {
      // Fallback : la colonne lien_driing n'existe pas encore (migration 035 pas appliquée).
      const fallback = await supabase.from('logements').select('id, nom, adresse, lien_site_direct').eq('user_id', profile.userId).order('nom')
      userLogementsData = (fallback.data ?? []).map(l => ({ ...l, lien_driing: null }))
    } else {
      userLogementsData = logRes.data ?? []
    }
    if (!postsRes.error) {
      savedFbPosts = (postsRes.data ?? []) as SavedFacebookPost[]
    }
  }

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
  // Fallback : si lien_driing est vide mais que lien_site_direct contient
  // "driing.co" (ancien champ combiné), on l'utilise. Évite de redemander
  // une saisie aux users existants.
  const userLogements: CommunauteLogement[] = (userLogementsData ?? []).map(l => {
    let effectiveLien = l.lien_driing
    if (!effectiveLien && l.lien_site_direct && /driing\.co/i.test(l.lien_site_direct)) {
      effectiveLien = l.lien_site_direct
    }
    return { id: l.id, nom: l.nom, lien_driing: effectiveLien }
  })

  return (
    <>
      <CommunauteView
        groups={groups}
        userId={profile?.userId ?? null}
        initialMemberships={memberships}
        userAdresses={userAdresses}
        facebookTemplates={facebookTemplates}
        userLogements={userLogements}
        savedFbPosts={savedFbPosts}
      />
    </>
  )
}
