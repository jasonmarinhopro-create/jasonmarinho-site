import { describe, it, expect } from 'vitest'
import { mxVerdict } from './mx'

describe('vérification MX avant le premier e-mail', () => {
  it('domaine avec un serveur de courrier', () => {
    expect(mxVerdict({ records: [{ exchange: 'mx1.hostinger.com' }] })).toBe('ok')
  })
  it('domaine qui ne reçoit rien', () => {
    expect(mxVerdict({ errorCode: 'ENOTFOUND' })).toBe('sans_mx')
    expect(mxVerdict({ errorCode: 'ENODATA' })).toBe('sans_mx')
    expect(mxVerdict({ records: [] })).toBe('sans_mx')
    expect(mxVerdict({ records: [{ exchange: '.' }] })).toBe('sans_mx')
  })
  it('panne DNS : on ne conclut pas', () => {
    expect(mxVerdict({ errorCode: 'ETIMEOUT' })).toBe('incertain')
    expect(mxVerdict({ errorCode: 'ESERVFAIL' })).toBe('incertain')
  })
})
