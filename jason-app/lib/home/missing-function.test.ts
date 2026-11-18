import { describe, it, expect } from 'vitest'
import { isMissingFunction } from './missing-function'

describe('isMissingFunction', () => {
  it('reconnaît une fonction absente', () => {
    expect(isMissingFunction({ code: 'PGRST202', message: 'Could not find the function public.home_state' })).toBe(true)
    expect(isMissingFunction({ code: '42883', message: 'function home_state does not exist' })).toBe(true)
    expect(isMissingFunction({ message: 'Could not find the function public.home_state(p_today) in the schema cache' })).toBe(true)
  })
  it('ne confond pas un délai dépassé ou une autre erreur', () => {
    expect(isMissingFunction({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(false)
    expect(isMissingFunction({ message: 'TimeoutError: The operation was aborted due to timeout' })).toBe(false)
    expect(isMissingFunction(null)).toBe(false)
  })
})
