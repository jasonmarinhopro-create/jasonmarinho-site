import { describe, it, expect } from 'vitest'
import { previewFromLogement, paymentLabels, showsIban } from './preview'

const base = { id: 'l1', nom: 'Le Cabanon', adresse: '3 chemin des Pins, Hossegor', pays: 'FR' }
const bailleur = { prenom: 'Manon', nom: 'Durand', email: 'manon@x.fr', adresse: '1 rue A' }

describe('aperçu du contrat', () => {
  it('prix d’exemple : 3 nuits au tarif moyen + ménage, caution de la fiche', () => {
    const p = previewFromLogement({ ...base, tarif_nuitee_moyen: 120, frais_menage: 50, caution: 400, surface_m2: 38 }, bailleur, '2026-09-29')
    expect(p.contract.montant_loyer).toBe(410)
    expect(p.contract.montant_caution).toBe(400)
    expect(p.contract.date_arrivee).toBe('2026-10-29')
    expect(p.contract.date_depart).toBe('2026-11-01')
    expect((p.contract.details as { etat: { surface_m: number } }).etat.surface_m).toBe(38)
  })
  it('propriétaire tiers (conciergerie) à la place du bailleur connecté', () => {
    const p = previewFromLogement({ ...base, proprietaire_nom: 'Jean Martin Dupuis', proprietaire_email: 'j@x.fr' }, bailleur, '2026-09-29')
    expect(p.contract.bailleur_prenom).toBe('Jean')
    expect(p.contract.bailleur_nom).toBe('Martin Dupuis')
  })
  it('textes par défaut quand la fiche est vide', () => {
    const p = previewFromLogement(base, bailleur, '2026-09-29')
    expect(String(p.contract.conditions_annulation)).toContain('30 jours')
    expect(p.contract.montant_loyer).toBe(300)
  })
  it('moyens de paiement et IBAN', () => {
    expect(paymentLabels('stripe')).toBe('Paiement en ligne (Stripe)')
    expect(showsIban('Paiement en ligne (Stripe)', true)).toBe(false)
    expect(showsIban('Virement bancaire, Paiement en ligne (Stripe)', true)).toBe(true)
    expect(showsIban('Espèces', false)).toBe(true)
  })
})
