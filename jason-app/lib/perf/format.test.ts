import { describe, it, expect } from 'vitest'
import { cleanPath, slowMessage } from './format'

describe('mesures de lenteur', () => {
  it('retire les identifiants des chemins', () => {
    expect(cleanPath('/dashboard/voyageurs/3f2b1c4d-1111-2222-3333-444455556666?x=1')).toBe('/dashboard/voyageurs/<id>')
    expect(cleanPath('/dashboard/logements/12345/edit')).toBe('/dashboard/logements/<n>/edit')
  })
  it('écrit le détail des étapes', () => {
    expect(slowMessage('Serveur lent', '/dashboard', 2345.6, [['auth', 120], ['profil', 80.4]]))
      .toBe('Serveur lent : /dashboard 2346 ms (auth 120 ms, profil 80 ms)')
  })
})
