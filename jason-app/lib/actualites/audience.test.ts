import { describe, it, expect } from 'vitest'
import { readAudience, forAudience, actusForEdition } from './audience'

describe('public des actualités', () => {
  it('hôtes par défaut, valeurs connues seulement', () => {
    expect(readAudience(undefined)).toEqual(['hote'])
    expect(readAudience([])).toEqual(['hote'])
    expect(readAudience('menage')).toEqual(['menage'])
    expect(readAudience(['photographe', 'Menage', 'x'])).toEqual(['photographe', 'menage'])
    expect(readAudience('hote, photographe')).toEqual(['hote', 'photographe'])
  })
  it('filtre par public', () => {
    const list = [
      { id: 'a' },
      { id: 'b', audience: ['photographe'] },
      { id: 'c', audience: ['hote', 'menage'] },
    ]
    expect(forAudience(list, 'hote').map(x => x.id)).toEqual(['a', 'c'])
    expect(forAudience(list, 'photographe').map(x => x.id)).toEqual(['b'])
    expect(forAudience(list, 'menage').map(x => x.id)).toEqual(['c'])
  })
  it('lettre : les actus du métier en tête, puis celles des hôtes', () => {
    const list = [{ id: 'h1' }, { id: 'p1', audience: ['photographe'] }, { id: 'm1', audience: ['menage'] }]
    expect(actusForEdition(list, 'photographe').map(x => x.id)).toEqual(['p1', 'h1'])
    expect(actusForEdition(list, 'hote').map(x => x.id)).toEqual(['h1'])
    expect(actusForEdition(list, 'investisseur').map(x => x.id)).toEqual(['h1'])
  })
})
