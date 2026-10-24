import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import * as fv from './fiche-vitrine'

// Inscription des pros tout en une fois (site) : mêmes règles que l'app
const require = createRequire(import.meta.url)
const x = require('../../../scripts/lib/pro-signup-extras.cjs')

describe('inscription des pros en une fois : règles du site = règles de l’app', () => {
  it('mêmes limites de photos, formules, villes et stockage', () => {
    expect(x.PHOTOS_MAX).toBe(fv.PHOTOS_MAX)
    expect(x.PHOTO_FULL_MAX_BYTES).toBe(fv.PHOTO_FULL_MAX_BYTES)
    expect(x.PHOTO_THUMB_MAX_BYTES).toBe(fv.PHOTO_THUMB_MAX_BYTES)
    expect(x.STORAGE_STOP_TOTAL_BYTES).toBe(fv.STORAGE_STOP_TOTAL_BYTES)
    expect(x.PORTFOLIO_STOP_BYTES).toBe(fv.PORTFOLIO_STOP_BYTES)
    expect(x.PORTFOLIO_BUCKET).toBe(fv.PORTFOLIO_BUCKET)
    expect(x.FORMULES_MAX).toBe(fv.FORMULES_MAX)
    expect(x.VILLES_MAX).toBe(fv.VILLES_MAX)
  })
  it('formules nettoyées comme dans Ma fiche', () => {
    const raw = [{ nom: ' Essentiel ', prix: '250 €', detail: '20 photos' }, { nom: '', prix: 9 }, { nom: 'Complet', prix: 0 }, { nom: 'A' }, { nom: 'B' }]
    expect(x.cleanFormules(raw)).toEqual(fv.cleanFormules(raw))
  })
  it('villes couvertes sans doublon ni la ville principale', () => {
    expect(x.cleanVilles(['Villeurbanne', 'lyon', 'Bron', 'villeurbanne', ' '], 'Lyon')).toEqual(['Villeurbanne', 'Bron'])
    expect(x.cleanVilles('Annecy, Thônes; Annecy', '')).toEqual(fv.cleanVilles('Annecy, Thônes; Annecy'))
  })
  it('place de stockage : même décision que l’app', () => {
    const rows = [{ bucket_id: 'pro-portfolio', bytes: 300 * 1024 ** 2 }, { bucket_id: 'autre', bytes: 100 * 1024 ** 2 }]
    for (const incoming of [1_000, 60 * 1024 ** 2]) expect(x.storageOk(rows, incoming)).toBe(fv.storageDecision(rows, incoming).ok)
    expect(x.storageOk(null, 1)).toBe(false)
  })
  it('signature des photos liée à la fiche et au compte', () => {
    const sig = x.photoSig('f1', 'u1', 'secret')
    expect(x.sigOk(sig, 'f1', 'u1', 'secret')).toBe(true)
    expect(x.sigOk(sig, 'f2', 'u1', 'secret')).toBe(false)
    expect(x.sigOk(sig, 'f1', 'u1', 'autre')).toBe(false)
    expect(x.sigOk(undefined, 'f1', 'u1', 'secret')).toBe(false)
  })
  it('photo : JPEG seulement, dans la taille permise', () => {
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(500, 1)])
    expect(x.decodeJpeg(jpeg.toString('base64'), 1000)?.length).toBe(502)
    expect(x.decodeJpeg('data:image/jpeg;base64,' + jpeg.toString('base64'), 1000)).not.toBeNull()
    expect(x.decodeJpeg(jpeg.toString('base64'), 400)).toBeNull()
    expect(x.decodeJpeg(Buffer.alloc(500, 1).toString('base64'), 1000)).toBeNull()
    expect(x.decodeJpeg('<script>', 1000)).toBeNull()
  })
  it('retour du paiement vers l’app, connecté', () => {
    expect(x.successUrl('menage')).toContain('/apres-paiement?pro=menage&session_id={CHECKOUT_SESSION_ID}')
  })
})
