import { describe, it, expect } from 'vitest'
import { parseMenuState } from './menu-state-parse'

describe('menu en une requête (menu_state)', () => {
  it('lit une réponse complète', () => {
    const s = parseMenuState({
      notif_unread: 3, chez_nous_unread: 1,
      contracts: [{ id: 'c1', statut: 'signe' }, null, 'x'],
      onboarding: { logement: true, sejour: false, affiche: 'oui' },
      demandes: { photographer: 2, cleaner: 0, depannage: 1 },
      actus_seen: { photographer: '2026-10-23T10:00:00Z', cleaner: null },
    })
    expect(s?.notifUnread).toBe(3)
    expect(s?.chezNousUnread).toBe(1)
    expect(s?.contracts).toHaveLength(1)
    expect(s?.onboarding?.logement).toBe(true)
    expect(s?.onboarding?.sejour).toBe(false)
    expect(s?.onboarding?.affiche).toBe(false)
    expect(s?.onboarding?.menage_shared).toBe(false)
    expect(s?.demandes).toEqual({ photographer: 2, cleaner: 0, depannage: 1 })
    expect(s?.actusSeen).toEqual({ photographer: '2026-10-23T10:00:00Z', cleaner: null })
  })
  it('parties absentes quand non demandées', () => {
    const s = parseMenuState({ notif_unread: 0, chez_nous_unread: 0, contracts: [] })
    expect(s?.onboarding).toBeNull()
    expect(s?.demandes).toBeNull()
    expect(s?.actusSeen).toBeNull()
  })
  it('profil sans ligne : jamais visitées', () => {
    expect(parseMenuState({ actus_seen: null })?.actusSeen).toEqual({ photographer: null, cleaner: null })
  })
  it('réponse invalide : null (le layout reprend les anciennes requêtes)', () => {
    expect(parseMenuState(null)).toBeNull()
    expect(parseMenuState('x')).toBeNull()
    expect(parseMenuState([])).toBeNull()
    expect(parseMenuState({ notif_unread: -2, chez_nous_unread: 'a' })?.notifUnread).toBe(0)
  })
})
