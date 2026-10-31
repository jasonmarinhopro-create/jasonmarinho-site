import { describe, expect, it } from 'vitest'
import { GROUPES, PROFILS, compteDansLApp, profil, profilDepuisRole } from './profils'

describe('profils d’inscription', () => {
  it('chaque profil a un groupe connu et un identifiant unique', () => {
    const groupes = new Set(GROUPES.map(g => g.id))
    expect(PROFILS.every(p => groupes.has(p.groupe))).toBe(true)
    expect(new Set(PROFILS.map(p => p.id)).size).toBe(PROFILS.length)
  })

  it('les pros ouverts vont sur l’inscription du site', () => {
    for (const p of PROFILS.filter(x => x.groupe === 'pro' && !x.bientot)) {
      expect(p.inscriptionPro).toMatch(/^https:\/\/jasonmarinho\.com\/annuaires\/.+\/inscription$/)
    }
  })

  it('lit les anciens liens ?role=', () => {
    expect(profilDepuisRole('host')).toBe('host')
    expect(profilDepuisRole('investor')).toBe('investor')
    expect(profilDepuisRole('photographe')).toBe('photo')
    expect(profilDepuisRole('menage')).toBe('menage')
    expect(profilDepuisRole('maintenance')).toBeNull()
    expect(profilDepuisRole(null)).toBeNull()
  })

  it('seuls hôte et investisseur créent leur compte dans l’app', () => {
    expect(compteDansLApp(profil('host'))).toBe(true)
    expect(compteDansLApp(profil('investor'))).toBe(true)
    expect(compteDansLApp(profil('photo'))).toBe(false)
    expect(compteDansLApp(profil('maintenance'))).toBe(false)
    expect(compteDansLApp(null)).toBe(false)
  })

  it('aucun tiret cadratin dans les textes', () => {
    const textes = PROFILS.flatMap(p => [p.titre, p.ligne, p.accroche, p.pastille, ...p.points])
    expect(textes.some(t => t.includes('—'))).toBe(false)
  })
})
