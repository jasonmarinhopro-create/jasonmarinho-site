import { describe, it, expect } from 'vitest'
import { priseToken, verifyPriseToken } from './prise'

const id = '4fc66739-6e2a-4398-aa2b-02c66cb847e1'

describe('jeton « Je m’en occupe »', () => {
  it('se vérifie avec le même secret', () => {
    expect(verifyPriseToken(priseToken('menage', id, 's3cret'), 's3cret')).toEqual({ metier: 'menage', contactId: id })
    expect(verifyPriseToken(priseToken('photographe', id, 's3cret'), 's3cret')).toEqual({ metier: 'photographe', contactId: id })
  })
  it('refuse un jeton modifié, un autre secret ou un secret vide', () => {
    const t = priseToken('menage', id, 's3cret')
    expect(verifyPriseToken(t, 'autre')).toBeNull()
    expect(verifyPriseToken(t.replace('m.', 'p.'), 's3cret')).toBeNull()
    expect(verifyPriseToken(t, '')).toBeNull()
    expect(verifyPriseToken('n.importe.quoi', 's3cret')).toBeNull()
  })
})
