import { describe, it, expect } from 'vitest'
import { cleanReply, isOwnComment, isPostGone } from './comment-rules'

describe('réponses aux commentaires', () => {
  it('reconnaît nos propres commentaires', () => {
    const acc = { external_account_id: '178', display_name: '@jason_marinho_lcd' }
    expect(isOwnComment({ authorId: '178', authorName: null }, acc)).toBe(true)
    expect(isOwnComment({ authorId: null, authorName: 'Jason_Marinho_LCD' }, acc)).toBe(true)
    expect(isOwnComment({ authorId: '99', authorName: 'marie' }, acc)).toBe(false)
  })
  it('refuse ce qui enfreint les règles de la marque', () => {
    expect(cleanReply('Merci Marie, contente que ça t’aide !')).toBe('Merci Marie, contente que ça t’aide !')
    expect(cleanReply('  ')).toBeNull()
    expect(cleanReply('Super — merci')).toBeNull()
    expect(cleanReply('Merci 🙏')).toBeNull()
    expect(cleanReply('Va voir https://exemple.com')).toBeNull()
    expect(cleanReply('Tout est ici : https://jasonmarinho.com/blog/taxe-de-sejour')).toContain('jasonmarinho.com')
    expect(cleanReply('x'.repeat(601))).toBeNull()
  })
})

describe('isPostGone', () => {
  it('reconnaît un post supprimé chez Meta', () => {
    expect(isPostGone("Unsupported get request. Object with ID '123' does not exist, cannot be loaded due to missing permissions, or does not support this operation.")).toBe(true)
  })
  it('laisse passer les autres erreurs', () => {
    expect(isPostGone('Error validating access token: Session has expired')).toBe(false)
    expect(isPostGone('fetch failed')).toBe(false)
  })
})
