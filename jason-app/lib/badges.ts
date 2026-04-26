export type BadgeId = 'pionnier' | 'visionnaire' | 'batisseur' | 'auditeur' | 'forme' | 'connecte'

export type Badge = {
  id: BadgeId
  label: string
  color: string
  bg: string
  title: string
}

export const BADGES: Record<BadgeId, Badge> = {
  pionnier:    { id: 'pionnier',    label: '⭐',  color: '#FFD56B', bg: 'rgba(255,213,107,0.18)', title: 'Pionnier — parmi les 20 premiers' },
  visionnaire: { id: 'visionnaire', label: '💡', color: '#a78bfa', bg: 'rgba(167,139,250,0.18)', title: 'Visionnaire — a soumis une idée' },
  batisseur:   { id: 'batisseur',   label: '🗳',  color: '#34d399', bg: 'rgba(52,211,153,0.18)',  title: 'Bâtisseur — a voté sur 3+ idées' },
  auditeur:    { id: 'auditeur',    label: '🔍', color: '#60a5fa', bg: 'rgba(96,165,250,0.18)',  title: 'Auditeur GBP — a réalisé un audit' },
  forme:       { id: 'forme',       label: '🎓', color: '#fb923c', bg: 'rgba(251,146,60,0.18)',  title: 'Formé — inscrit à une formation' },
  connecte:    { id: 'connecte',    label: '🌐', color: '#f472b6', bg: 'rgba(244,114,182,0.18)', title: 'Connecté — membre d\'une communauté FB' },
}

export type ContributorBadges = Record<string, BadgeId[]>

export function computeBadges(params: {
  contributorIds: string[]
  createdAts: Record<string, string>
  voteCountByUser: Record<string, number>
  ideaAuthorIds: Set<string>
  auditCompletedIds: Set<string>
  formationIds: Set<string>
  communityIds: Set<string>
}): ContributorBadges {
  const { contributorIds, createdAts, voteCountByUser, ideaAuthorIds,
          auditCompletedIds, formationIds, communityIds } = params

  const sorted = [...contributorIds].sort((a, b) =>
    (createdAts[a] ?? '').localeCompare(createdAts[b] ?? ''))
  const pioneers = new Set(sorted.slice(0, 20))

  const result: ContributorBadges = {}
  for (const uid of contributorIds) {
    const b: BadgeId[] = []
    if (pioneers.has(uid))                   b.push('pionnier')
    if (ideaAuthorIds.has(uid))              b.push('visionnaire')
    if ((voteCountByUser[uid] ?? 0) >= 3)   b.push('batisseur')
    if (auditCompletedIds.has(uid))          b.push('auditeur')
    if (formationIds.has(uid))               b.push('forme')
    if (communityIds.has(uid))               b.push('connecte')
    result[uid] = b
  }
  return result
}
