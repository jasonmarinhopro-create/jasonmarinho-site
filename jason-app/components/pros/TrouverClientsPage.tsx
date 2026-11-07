// Page serveur « Trouver des clients » commune aux 3 métiers (07/11/2026) :
// la fiche du pro (prénom, ville, lien public), ses groupes rejoints et les
// groupes de son métier. Client utilisateur : la RLS limite la lecture à sa
// propre fiche et à ses adhésions ; la liste des groupes vient du cache public.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import { getCachedCommunityGroups } from '@/lib/queries/cache'
import { METIERS, type ProKind } from '@/lib/pros/metiers'
import { ficheShareUrl, groupsFor } from '@/lib/pros/groupes-clients'
import TrouverClients from './TrouverClients'

export default async function TrouverClientsPage({ kind }: { kind: ProKind }) {
  const m = METIERS[kind]
  const user = await getAuthIdentity()
  if (!user) redirect(`/auth/login?as=${m.slug}`)

  const supabase = await createClient()
  const [proRes, memRes, allGroups] = await Promise.all([
    supabase.from(m.table).select('id, slug, ville, pseudo, full_name, status, is_public').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_community_memberships').select('group_id, status').eq('user_id', user.id),
    getCachedCommunityGroups(),
  ])
  const pro = proRes.data as { id: string; slug: string | null; ville: string | null; pseudo: string | null; full_name: string | null; status: string | null; is_public: boolean | null } | null
  if (!pro) redirect(m.espace)

  const memberships: Record<string, 'joined' | 'dismissed'> = {}
  for (const r of (memRes.data ?? []) as Array<{ group_id: string; status: string }>) {
    if (r.status === 'joined' || r.status === 'dismissed') memberships[r.group_id] = r.status
  }
  const groups = groupsFor(allGroups, m.slug).map(g => ({
    id: g.id, name: g.name, description: g.description ?? '', members_count: g.members_count ?? 0, tag: g.tag,
  }))
  const online = pro.status === 'active' && pro.is_public !== false
  const prenom = (pro.pseudo || pro.full_name || '').trim().split(/\s+/)[0] || null

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%' }}>
      <TrouverClients
        metier={m.slug}
        groups={groups}
        initialMemberships={memberships}
        prenom={prenom}
        ville={pro.ville}
        ficheUrl={online ? ficheShareUrl(m.slug, pro.slug) : null}
      />
    </div>
  )
}
