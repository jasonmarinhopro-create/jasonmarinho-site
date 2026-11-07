import { describe, it, expect } from 'vitest'
import { isSessionCookie, mayRemoveAuthCookie, isTransientAuthError } from './session-cookies'

describe('cookies de session Supabase', () => {
  it('reconnaît la session et ses morceaux, pas le vérificateur PKCE', () => {
    expect(isSessionCookie('sb-xwucstjxoehyjnlrzrky-auth-token')).toBe(true)
    expect(isSessionCookie('sb-xwucstjxoehyjnlrzrky-auth-token.0')).toBe(true)
    expect(isSessionCookie('sb-xwucstjxoehyjnlrzrky-auth-token.12')).toBe(true)
    expect(isSessionCookie('sb-xwucstjxoehyjnlrzrky-auth-token-code-verifier')).toBe(false)
    expect(isSessionCookie('jm-admin-mode')).toBe(false)
  })

  it('le navigateur n’efface la session que pendant une déconnexion voulue', () => {
    expect(mayRemoveAuthCookie('sb-x-auth-token', false)).toBe(false)
    expect(mayRemoveAuthCookie('sb-x-auth-token.1', false)).toBe(false)
    expect(mayRemoveAuthCookie('sb-x-auth-token', true)).toBe(true)
    expect(mayRemoveAuthCookie('sb-x-auth-token-code-verifier', false)).toBe(true)
  })

  it('un doublon refusé (409) ou une panne n’est pas une session invalide', () => {
    expect(isTransientAuthError({ status: 409, code: 'conflict' })).toBe(true)
    expect(isTransientAuthError({ status: 504 })).toBe(true)
    expect(isTransientAuthError({ name: 'AuthRetryableFetchError', status: 0 })).toBe(true)
    expect(isTransientAuthError({ status: 400, code: 'refresh_token_not_found' })).toBe(false)
    expect(isTransientAuthError({ status: 401 })).toBe(false)
    expect(isTransientAuthError(null)).toBe(false)
  })
})
