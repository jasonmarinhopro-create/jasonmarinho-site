// Chargement de la page Idées (server only). Les idées, commentaires et votes
// sont communs à tout le monde (cache de lib/queries/cache.ts) ; seul « mes
// votes » est lu pour la personne connectée. Avant d'aller au navigateur, le
// nom complet des auteurs devient « Prénom N. » et leur identifiant devient
// un simple « c'est moi ».
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { adminUserIds } from '@/lib/pros/demo'
import { getCachedRoadmapComments, getCachedRoadmapItems, getCachedRoadmapVotes } from '@/lib/queries/cache'
import { isEspace, isStatus, shortName, type IdeeEspace, type IdeeStatus } from './rules'

export interface IdeeItem {
  id: string
  title: string
  description: string | null
  status: IdeeStatus
  espace: IdeeEspace | null
  reponse: string | null
  created_at: string
  status_changed_at: string | null
  author: string
  mine: boolean
}

export interface IdeeComment {
  id: string
  item_id: string
  author: string
  mine: boolean
  isJason: boolean
  content: string
  created_at: string
}

export interface IdeesData {
  items: IdeeItem[]
  comments: IdeeComment[]
  votes: Record<string, number>
  myVotes: string[]
  isAdmin: boolean
  firstName: string | null
}

// Comptes admin (commentaires signés « Jason »), gardés 1 h
const cachedAdminIds = unstable_cache(
  async () => [...await adminUserIds(getServiceClient())],
  ['idees-admin-ids-v1'],
  { revalidate: 3600 },
)

export async function loadIdees(): Promise<IdeesData> {
  const profile = await getProfile()
  const userId = profile?.userId ?? null
  const isAdmin = profile?.role === 'admin'
  const supabase = await createClient()

  const [items, comments, votes, mine, admins] = await Promise.all([
    getCachedRoadmapItems(),
    getCachedRoadmapComments(),
    getCachedRoadmapVotes(),
    userId
      ? supabase.from('roadmap_votes').select('item_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { item_id: string }[] }),
    cachedAdminIds().catch(() => [] as string[]),
  ])

  // Les réponses de l'admin sont signées « Jason »
  const adminIds = new Set(admins)
  if (isAdmin && userId) adminIds.add(userId)

  const voteCounts: Record<string, number> = {}
  for (const v of votes) voteCounts[v.item_id] = (voteCounts[v.item_id] ?? 0) + 1

  return {
    items: items
      .filter(r => isStatus(r.status))
      .map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status as IdeeStatus,
        espace: isEspace(r.espace) ? r.espace : null,
        reponse: r.reponse ?? null,
        created_at: r.created_at,
        status_changed_at: r.status_changed_at ?? null,
        author: r.author_id && adminIds.has(r.author_id) ? 'Jason' : shortName(r.author_name),
        mine: !!userId && r.author_id === userId,
      })),
    comments: comments.map(c => ({
      id: c.id,
      item_id: c.item_id,
      author: c.author_id && adminIds.has(c.author_id) ? 'Jason' : shortName(c.author_name),
      mine: !!userId && c.author_id === userId,
      isJason: !!c.author_id && adminIds.has(c.author_id),
      content: c.content,
      created_at: c.created_at,
    })),
    votes: voteCounts,
    myVotes: (mine.data ?? []).map(v => v.item_id),
    isAdmin,
    firstName: profile?.full_name?.split(/\s+/)[0] ?? null,
  }
}
