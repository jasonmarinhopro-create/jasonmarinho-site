import { describe, it, expect } from 'vitest'
import { extractPlanningToken } from './share-link'

const T = '3f1c2b9e-8a7d-4c6b-9e5f-1a2b3c4d5e6f'

describe('extractPlanningToken', () => {
  it('lit le token dans le lien partagé (https ou webcal)', () => {
    expect(extractPlanningToken(`https://app.jasonmarinho.com/api/calendar/menage-feed?token=${T}`)).toBe(T)
    expect(extractPlanningToken(`webcal://app.jasonmarinho.com/api/calendar/menage-feed?token=${T}`)).toBe(T)
  })
  it('accepte le token seul, entouré d’espaces ou collé dans un message', () => {
    expect(extractPlanningToken(`  ${T}  `)).toBe(T)
    expect(extractPlanningToken(`Voici mon planning : ${T.toUpperCase()} merci !`)).toBe(T)
  })
  it('refuse un lien sans token valide', () => {
    expect(extractPlanningToken('https://app.jasonmarinho.com/api/calendar/menage-feed?token=abc')).toBeNull()
    expect(extractPlanningToken('')).toBeNull()
    expect(extractPlanningToken('bonjour')).toBeNull()
  })
})
