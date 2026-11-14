import { describe, it, expect } from 'vitest'
import { parsePaypalMe, paypalMeUrl, contractOffersPaypal } from './paypal'

describe('parsePaypalMe', () => {
  it('lit les formes courantes', () => {
    expect(parsePaypalMe('paypal.me/AliceM')).toBe('AliceM')
    expect(parsePaypalMe('https://paypal.me/AliceM')).toBe('AliceM')
    expect(parsePaypalMe('https://www.paypal.me/AliceM/20')).toBe('AliceM')
    expect(parsePaypalMe('https://www.paypal.com/paypalme/AliceM')).toBe('AliceM')
    expect(parsePaypalMe('@AliceM')).toBe('AliceM')
    expect(parsePaypalMe('  AliceM  ')).toBe('AliceM')
  })
  it('refuse le reste', () => {
    expect(parsePaypalMe('')).toBeNull()
    expect(parsePaypalMe(null)).toBeNull()
    expect(parsePaypalMe('alice@mail.fr')).toBeNull()
    expect(parsePaypalMe('https://evil.com/AliceM')).toBeNull()
    expect(parsePaypalMe('nom avec espace')).toBeNull()
    expect(parsePaypalMe('a'.repeat(21))).toBeNull()
  })
})

describe('paypalMeUrl', () => {
  it('ajoute le montant', () => {
    expect(paypalMeUrl('AliceM', 450)).toBe('https://paypal.me/AliceM/450')
    expect(paypalMeUrl('AliceM', 123.456)).toBe('https://paypal.me/AliceM/123.46')
    expect(paypalMeUrl('AliceM', 99.5)).toBe('https://paypal.me/AliceM/99.50')
  })
  it('sans montant', () => {
    expect(paypalMeUrl('AliceM')).toBe('https://paypal.me/AliceM')
    expect(paypalMeUrl('AliceM', 0)).toBe('https://paypal.me/AliceM')
  })
})

describe('contractOffersPaypal', () => {
  it('repère PayPal dans les modalités', () => {
    expect(contractOffersPaypal('Virement bancaire, Carte bancaire, PayPal')).toBe(true)
    expect(contractOffersPaypal('Virement bancaire')).toBe(false)
    expect(contractOffersPaypal(null)).toBe(false)
  })
})
