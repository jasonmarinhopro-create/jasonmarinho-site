// Onglet « Pilote automatique » d'Admin > Réseaux sociaux (24/10/2026) :
// reconnaître les posts de la routine « Community manager » et résumer leurs
// résultats par format. Règles pures, testées.

export type PostFormat = 'reel' | 'carrousel' | 'photo' | 'texte'

const isVideo = (u: string) => /\.mp4(\?|$)/i.test(u)

export function postFormat(mediaUrls: string[] | null | undefined): PostFormat {
  const m = mediaUrls ?? []
  if (m.some(isVideo)) return 'reel'
  if (m.length > 1) return 'carrousel'
  return m.length ? 'photo' : 'texte'
}

/** Slug du sujet pour un post de la routine (dossier auto/AAAA-MM-JJ-<slug>/), sinon null. */
export function autoSlug(mediaUrls: string[] | null | undefined): string | null {
  for (const u of mediaUrls ?? []) {
    const m = u.match(/\/auto\/\d{4}-\d{2}-\d{2}-([a-z0-9-]+)\//)
    if (m) return m[1]
  }
  return null
}

/** Image à montrer en vignette (la couverture d'un Reel, pas la vidéo). */
export function coverOf(mediaUrls: string[] | null | undefined): string | null {
  const m = mediaUrls ?? []
  return m.find(u => !isVideo(u)) ?? null
}

export interface FormatStat { format: PostFormat; posts: number; likes: number; comments: number; perPost: number }

/** Engagement moyen par format (j'aime + commentaires par post publié). */
export function statsByFormat(posts: Array<{ media_urls: string[]; targets: Array<{ status: string; like_count: number | null; comment_count: number | null }> }>): FormatStat[] {
  const map = new Map<PostFormat, FormatStat>()
  for (const p of posts) {
    const pub = p.targets.filter(t => t.status === 'published')
    if (!pub.length) continue
    const f = postFormat(p.media_urls)
    const s = map.get(f) ?? { format: f, posts: 0, likes: 0, comments: 0, perPost: 0 }
    s.posts++
    s.likes += pub.reduce((n, t) => n + (t.like_count ?? 0), 0)
    s.comments += pub.reduce((n, t) => n + (t.comment_count ?? 0), 0)
    map.set(f, s)
  }
  return [...map.values()]
    .map(s => ({ ...s, perPost: Math.round(((s.likes + s.comments) / s.posts) * 10) / 10 }))
    .sort((a, b) => b.perPost - a.perPost)
}
