import { describe, it, expect } from 'vitest'
import {
  storageDecision, photoEgressEstimate, newPhotoPath, thumbPath, isPhotoPath, isLegacyPhoto,
  cleanFormules, cleanVilles, cleanDeroule, DEFAULT_DEROULE, PHOTOS_MAX,
  STORAGE_STOP_TOTAL_BYTES, PORTFOLIO_STOP_BYTES, PHOTO_EGRESS_BUDGET_BYTES, FREE_STORAGE_BYTES, FREE_EGRESS_BYTES,
} from './fiche-vitrine'
import { DEFAULT_DEROULE as SITE_DEROULE, PHOTOS_MAX as SITE_PHOTOS_MAX, vitrinePhotos } from '../../../scripts/lib/fiche-vitrine.mjs'

const PRO = '11111111-2222-3333-4444-555555555555'
const ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const MB = 1024 ** 2

describe('photos des fiches', () => {
  it('chemins : nouvelle forme seulement, rattachée au bon pro', () => {
    const p = newPhotoPath(PRO, ID)
    expect(p).toBe(`${PRO}/v2-${ID}.jpg`)
    expect(thumbPath(p)).toBe(`${PRO}/v2-${ID}-t.jpg`)
    expect(isPhotoPath(p, PRO)).toBe(true)
    expect(isPhotoPath(p, '99999999-2222-3333-4444-555555555555')).toBe(false)
    expect(isPhotoPath(`${PRO}/v2-${ID}.jpg/../x`, PRO)).toBe(false)
    expect(isPhotoPath(thumbPath(p), PRO)).toBe(false)
    expect(isLegacyPhoto(`${PRO}/${ID}.jpg`)).toBe(true)
    expect(isLegacyPhoto(p)).toBe(false)
  })

  it('le site n’affiche que les nouvelles photos, 6 au plus', () => {
    const paths = [`${PRO}/${ID}.jpg`, ...Array.from({ length: 8 }, (_, i) => `${PRO}/v2-${ID.slice(0, -1)}${i}.jpg`)]
    const out = vitrinePhotos(paths, 'https://x.supabase.co')
    expect(out).toHaveLength(6)
    expect(out[0].full).toBe(`https://x.supabase.co/storage/v1/object/public/pro-portfolio/${PRO}/v2-${ID.slice(0, -1)}0.jpg`)
    expect(out[0].thumb).toMatch(/0-t\.jpg$/)
    expect(vitrinePhotos(null, 'https://x.supabase.co')).toEqual([])
  })

  it('stockage : refuse avant la limite gratuite, et sans mesure', () => {
    expect(STORAGE_STOP_TOTAL_BYTES).toBeLessThan(FREE_STORAGE_BYTES)
    expect(PHOTO_EGRESS_BUDGET_BYTES).toBeLessThan(FREE_EGRESS_BYTES)
    expect(storageDecision(null, 1).ok).toBe(false)
    expect(storageDecision([{ bucket_id: 'menage-photos', bytes: 100 * MB }, { bucket_id: 'pro-portfolio', bytes: 10 * MB }], 2 * MB).ok).toBe(true)
    expect(storageDecision([{ bucket_id: 'menage-photos', bytes: STORAGE_STOP_TOTAL_BYTES - MB }], 2 * MB).ok).toBe(false)
    expect(storageDecision([{ bucket_id: 'pro-portfolio', bytes: PORTFOLIO_STOP_BYTES - MB }], 2 * MB).ok).toBe(false)
  })

  it('estimation de la sortie mensuelle', () => {
    expect(photoEgressEstimate(1000, 6, 70_000)).toBe(420_000_000)
    expect(photoEgressEstimate(1000, 20, 70_000)).toBe(1000 * PHOTOS_MAX * 70_000)
    expect(photoEgressEstimate(-3, 6)).toBe(0)
  })
})

describe('formules, villes, déroulé', () => {
  it('formules : 3 au plus, nom obligatoire, prix propre', () => {
    expect(cleanFormules([
      { nom: ' Essentielle ', prix: '350 €', detail: '20 photos   livrées en 5 jours' },
      { nom: '', prix: 100 },
      { nom: 'Complète', prix: 0, detail: 'Drone' },
      { nom: 'Premium', prix: 1200.4 },
      { nom: 'Trop', prix: 10 },
    ])).toEqual([
      { nom: 'Essentielle', prix: 350, detail: '20 photos livrées en 5 jours' },
      { nom: 'Complète', prix: null, detail: 'Drone' },
      { nom: 'Premium', prix: 1200, detail: '' },
    ])
    expect(cleanFormules('x')).toEqual([])
  })

  it('formules : une seule mise en avant (« La plus demandée »)', () => {
    expect(cleanFormules([
      { nom: 'A', prix: 1, vedette: 'oui' },
      { nom: 'B', prix: 2, vedette: true },
      { nom: 'C', prix: 3, vedette: true },
    ])).toEqual([
      { nom: 'A', prix: 1, detail: '' },
      { nom: 'B', prix: 2, detail: '', vedette: true },
      { nom: 'C', prix: 3, detail: '' },
    ])
  })

  it('villes : sans doublon (accents, casse), 10 au plus, saisie séparée par des virgules', () => {
    expect(cleanVilles('Lyon, Villeurbanne ; lyon\nÉcully, ecully')).toEqual(['Lyon', 'Villeurbanne', 'Écully'])
    expect(cleanVilles(Array.from({ length: 14 }, (_, i) => `Ville ${i}`))).toHaveLength(10)
  })

  it('déroulé : 3 étapes ou rien, les étapes par défaut ne sont pas enregistrées', () => {
    expect(cleanDeroule(DEFAULT_DEROULE.photographe, 'photographe')).toEqual([])
    expect(cleanDeroule([{ titre: 'A', texte: 'a' }, { titre: 'B' }], 'menage')).toEqual([])
    const custom = [{ titre: 'Appel', texte: '15 min' }, { titre: 'Shooting', texte: '2 h' }, { titre: 'Photos', texte: '48 h' }]
    expect(cleanDeroule(custom, 'photographe')).toEqual(custom)
  })

  it('mêmes étapes par défaut et même nombre de photos que le site', () => {
    expect(SITE_DEROULE).toEqual(DEFAULT_DEROULE)
    expect(SITE_PHOTOS_MAX).toBe(PHOTOS_MAX)
  })
})
