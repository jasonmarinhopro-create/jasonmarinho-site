// Commentaire Facebook/Instagram reçu par le webhook Meta
// (app/api/social/webhook/meta/route.ts) : enregistré dans social_comments
// pour le community manager, qui y répond en public (lib/social/comments.ts).
// Les anciens messages privés déclenchés par mot-clé (« Réponses auto ») ont
// été retirés le 24/10/2026 : ils ne fonctionnaient pas et faisaient doublon.

import { storeComments } from '@/lib/social/comments'

export interface IncomingComment {
  platform: 'facebook' | 'instagram'
  commentId: string
  postId: string | null
  commentText: string
  commenterName: string | null
  senderId: string | null
  // ID de la Page (Facebook) ou du compte Instagram Business qui a reçu
  // le commentaire : sert à ignorer les commentaires de la Page elle-même.
  pageId: string
}

export async function handleIncomingComment(comment: IncomingComment): Promise<void> {
  if (comment.senderId && comment.senderId === comment.pageId) return
  if (!comment.commentText.trim()) return
  await storeComments([{ platform: comment.platform, commentId: comment.commentId, parentId: null, postExternalId: comment.postId, text: comment.commentText, authorName: comment.commenterName, createdAt: new Date().toISOString() }])
}
