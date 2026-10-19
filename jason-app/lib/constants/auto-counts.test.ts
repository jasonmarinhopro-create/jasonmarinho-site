import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { VILLES_TOTAL } from './auto-counts'

// Le nombre de villes est compté au build par scripts/sync-counts.mjs (liste
// CITIES de footer.js) : ce test rappelle de lancer le script si une ville
// est ajoutée sans lui.
describe('compteurs automatiques', () => {
  it('le nombre de villes suit la liste CITIES de footer.js', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../../footer.js'), 'utf8')
    const open = src.indexOf('[', src.indexOf('var CITIES = ['))
    const cities = new Function('return ' + src.slice(open, src.indexOf('];', open) + 1))() as unknown[]
    expect(VILLES_TOTAL).toBe(cities.length)
  })
})
