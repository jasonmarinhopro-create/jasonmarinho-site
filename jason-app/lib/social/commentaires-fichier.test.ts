import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, checkReplies } from '../../../scripts/social/commentaires.mjs'

const key = 'a'.repeat(64)
const id = '5d7b0fb1-e5c6-4580-a58e-a73098047c6e'

describe('commentaires chiffrés de la routine', () => {
  it('chiffre et déchiffre, refuse une mauvaise clé', () => {
    const enc = encrypt({ commentaires: [{ id, commentaire: 'Super carrousel' }] }, key)
    expect(enc).not.toContain('Super carrousel')
    expect(decrypt(enc, key).commentaires[0].commentaire).toBe('Super carrousel')
    expect(() => decrypt(enc, 'b'.repeat(64))).toThrow()
  })
  it('vérifie les réponses déposées', () => {
    const { ok, errs } = checkReplies([
      { id, action: 'repondre', texte: 'Merci, tout est sur https://jasonmarinho.com/photographe-hotel' },
      { id, action: 'ignorer' },
      { id, action: 'repondre', texte: 'Top 🔥' },
      { id, action: 'repondre', texte: 'Voir https://exemple.com' },
      { id: 'x', action: 'ignorer' },
    ])
    expect(ok).toHaveLength(2)
    expect(errs).toHaveLength(3)
  })
})
