import { describe, it, expect } from 'vitest'
import { providerHint, spfAllows } from './spf'

describe('garde-fou SPF', () => {
  it('fournisseur tiré du serveur SMTP', () => {
    expect(providerHint('smtp.hostinger.com')).toBe('hostinger')
    expect(providerHint('smtp.gmail.com')).toBe('google')
  })
  it('SPF absent ou sans le fournisseur : envois retenus', () => {
    expect(spfAllows(['google-site-verification=abc'], 'smtp.hostinger.com')).toBe(false)
    expect(spfAllows(['v=spf1 include:amazonses.com ~all'], 'smtp.hostinger.com')).toBe(false)
  })
  it('SPF qui inclut le fournisseur : envois autorisés', () => {
    expect(spfAllows(['v=spf1 include:_spf.mail.hostinger.com ~all'], 'smtp.hostinger.com')).toBe(true)
    expect(spfAllows(['v=spf1 include:_spf.google.com ~all'], 'smtp.gmail.com')).toBe(true)
  })
})
