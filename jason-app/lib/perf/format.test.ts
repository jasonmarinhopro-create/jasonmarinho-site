import { describe, it, expect } from 'vitest'
import { cleanPath, slowMessage, supabaseCallLabel, slowestCalls } from './format'

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

describe('appels Supabase', () => {
  it('nomme la table, la fonction ou le service', () => {
    expect(supabaseCallLabel('https://x.supabase.co/rest/v1/contracts?select=id&user_id=eq.1')).toBe('contracts')
    expect(supabaseCallLabel('https://x.supabase.co/rest/v1/rpc/issue_next_invoice_number')).toBe('rpc issue_next_invoice_number')
    expect(supabaseCallLabel('https://x.supabase.co/auth/v1/user')).toBe('auth user')
    expect(supabaseCallLabel('https://example.com/a')).toBe('autre')
  })
  it('garde le pire temps par table, du plus lent au plus rapide', () => {
    expect(slowestCalls([['a', 100], ['b', 900], ['a', 300], ['c', 50]], 2)).toEqual([['b', 900], ['a', 300]])
  })
})
