import { describe, it, expect } from 'vitest'
import {
  buildEtatDescriptif, etatDescriptifLines, regimeText, bailleurCancelText, arriveeText, priceLines, contratOptions, EXTRA_UI,
} from './details'

const fmt = (n: number) => `${n} €`

describe('état descriptif', () => {
  it('reprend la fiche logement et ignore les champs vides', () => {
    const e = buildEtatDescriptif({ type_logement: 'gite', surface_m2: 45, nb_chambres: 2, nb_lits: 0, equipements: ['wifi', 'lave-linge'], classement_etoiles: 3, numero_enregistrement: ' 12345 ', pays: 'FR' })
    expect(e).toMatchObject({ type_logement: 'gite', surface_m: 45, nb_chambres: 2, nb_lits: null, numero: '12345' })
    const lines = etatDescriptifLines(e, 'fr', 'FR')
    expect(lines.map(l => l.label)).toEqual(['Type', 'Surface', 'Chambres', 'Classement', 'Équipements'])
    expect(lines.find(l => l.label === 'Équipements')?.value).toBe('Wi-Fi, Lave-linge')
    expect(lines.find(l => l.label === 'Classement')?.value).toContain('3 étoiles')
  })
  it('numéro AL au Portugal, sans ligne de classement français', () => {
    const e = buildEtatDescriptif({ numero_al: '98765/AL', numero_enregistrement: 'x', pays: 'PT', type_logement: 'maison' })
    expect(e.numero).toBe('98765/AL')
    expect(etatDescriptifLines(e, 'pt', 'PT').map(l => l.value)).toEqual(['Moradia'])
  })
  it('logement non classé en France', () => {
    expect(etatDescriptifLines({ classement_etoiles: null }, 'fr', 'FR')).toEqual([{ label: 'Classement', value: 'Non classé' }])
  })
})

describe('règles juridiques', () => {
  it('arrhes par défaut, acompte sur demande', () => {
    expect(contratOptions(null)).toEqual({ regime: 'arrhes', delai_caution_jours: 7, charges_incluses: true })
    expect(contratOptions({ regime: 'acompte', delai_caution_jours: 200 }).delai_caution_jours).toBe(7)
    expect(regimeText('arrhes', 'fr', 'FR')).toContain('L214-1')
    expect(regimeText('acompte', 'fr', 'FR')).toContain('acompte')
  })
  it('règles françaises absentes d’un contrat portugais', () => {
    expect(regimeText('arrhes', 'pt', 'PT')).toBeNull()
    expect(bailleurCancelText('arrhes', 'pt', 'PT')).not.toContain('L221-28')
    expect(bailleurCancelText('arrhes', 'fr', 'FR')).toContain('L221-28')
    expect(bailleurCancelText('arrhes', 'fr', 'FR')).toContain('1590')
  })
  it('identité : présentation sans copie, fiche de police en France', () => {
    expect(arriveeText('fr', 'FR')).toContain('sans en conserver de copie')
    expect(arriveeText('fr', 'FR')).toContain('R814-1')
    expect(arriveeText('en', 'PT')).toContain('SIBA')
  })
})

describe('prix détaillé', () => {
  it('ménage et taxe incluse en sous-lignes, taxe en sus à part', () => {
    expect(priceLines(700, { frais_menage: 60, taxe_sejour: 14, taxe_sejour_mode: 'incluse' }, 'fr', fmt)).toEqual([
      { label: 'Prix total du séjour', value: '700 €' },
      { label: 'dont frais de ménage', value: '60 €', sub: true },
      { label: 'dont taxe de séjour', value: '14 €', sub: true },
    ])
    expect(priceLines(700, { taxe_sejour: 14, taxe_sejour_mode: 'en_sus' }, 'fr', fmt)[1]).toEqual({ label: 'Taxe de séjour, à régler en plus du prix', value: '14 €' })
  })
})

describe('textes', () => {
  it('pas de tiret cadratin', () => {
    const all = JSON.stringify(EXTRA_UI) + (['fr', 'pt', 'en'] as const).flatMap(l => [
      regimeText('arrhes', l, 'FR'), regimeText('acompte', l, 'FR'), bailleurCancelText('arrhes', l, 'FR'), bailleurCancelText('acompte', l, 'PT'), arriveeText(l, 'FR'), arriveeText(l, 'PT'),
      EXTRA_UI[l].cautionText('300 €', 7),
    ]).join(' ')
    expect(all).not.toContain('—')
  })
})
