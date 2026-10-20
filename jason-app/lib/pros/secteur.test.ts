import { describe, it, expect } from 'vitest'

// Carte « Où j'interviens » des fiches pros : lecture de la zone écrite par le pro
// (scripts/lib/secteur.mjs, utilisé au build du site statique)
const load = () => import(/* @vite-ignore */ '../../../scripts/lib/secteur.mjs' as string)

describe('secteur des fiches pros', () => {
  it('rayon, villes citées et noms tapés de toutes les façons', async () => {
    const { resolveSecteur } = await load()
    const s = resolveSecteur({ ville: 'Roanne', zone: 'Roanne et 30km, Renaison, Riorges, Mably, Saint Germain Laval, Charlieu, Balbigny' })
    expect(s.centre.nom).toBe('Roanne')
    expect(s.km).toBe(30)
    expect(s.communes.map((c: { nom: string }) => c.nom)).toEqual(['Renaison', 'Riorges', 'Mably', 'Saint-Germain-Laval', 'Charlieu', 'Balbigny'])
    expect(s.unknown).toEqual([])
  })
  it('ville avec arrondissement, code postal ou abréviation', async () => {
    const { resolveSecteur, cleanVille } = await load()
    expect(resolveSecteur({ ville: 'Lyon 6e', zone: '' }).centre.nom).toBe('Lyon')
    expect(resolveSecteur({ ville: '75015 Paris', zone: '' }).centre.nom).toBe('Paris')
    expect(resolveSecteur({ ville: 'St Etienne', zone: '' }).centre.nom).toBe('Saint-Étienne')
    expect(cleanVille('13008 Marseille 8ème')).toEqual({ nom: 'Marseille', dep: '13' })
  })
  it('garde le nom de la fiche (« Les Sables d’Olonne ») et lit les départements', async () => {
    const { resolveSecteur } = await load()
    const s = resolveSecteur({ ville: "Les Sables d'Olonne", zone: 'Vendée' })
    expect(s.nom).toBe("Les Sables d'Olonne")
    expect(s.deps).toEqual(['85'])
    expect(resolveSecteur({ ville: 'Saint-Étienne', zone: 'Loire (42) et Haute-Loire' }).deps).toEqual(['42', '43'])
    expect(resolveSecteur({ ville: 'Paris', zone: 'Paris et petite couronne' }).deps).toEqual(['92', '93', '94'])
  })
  it('régions, France entière, rayon écrit autrement', async () => {
    const { resolveSecteur, rayonKm } = await load()
    const b = resolveSecteur({ ville: 'Rennes', zone: 'Toute la Bretagne' })
    expect(b.regions).toEqual(['Bretagne'])
    expect(b.deps.sort()).toEqual(['22', '29', '35', '56'])
    expect(resolveSecteur({ ville: 'Marseille', zone: 'PACA' }).deps).toContain('06')
    expect(resolveSecteur({ ville: 'Toulouse', zone: 'Partout en France' }).france).toBe(true)
    expect(rayonKm('rayon de 40')).toBe(40)
    expect(rayonKm('Lyon + 60 kms')).toBe(60)
    expect(rayonKm('1 km')).toBeNull()
  })
  it('ce qui ne se place pas reste écrit, une ville inconnue ne fait pas de carte', async () => {
    const { resolveSecteur } = await load()
    expect(resolveSecteur({ ville: 'Bordeaux', zone: 'Bordeaux + Médoc + Bassin d’Arcachon' }).unknown).toEqual(['Médoc', 'Bassin d’Arcachon'])
    expect(resolveSecteur({ ville: 'Québec', zone: '' })).toBeNull()
    // Un homonyme lointain n'est pas pris (Vienne est à côté de Lyon, pas dans la Vienne)
    const l = resolveSecteur({ ville: 'Lyon', zone: '', villes: ['Vienne'] })
    expect(l.communes[0].dep).toBe('38')
  })
  it('cartes légères, même pour les grandes zones', async () => {
    const { resolveSecteur, secteurMap } = await load()
    for (const [ville, zone] of [['Lyon', 'Lyon + 60 km'], ['Montpellier', 'Montpellier et 150 km'], ['Toulouse', 'Partout en France'], ['Marseille', 'PACA'], ['Roanne', 'Roanne et 30km']]) {
      const { svg } = secteurMap(resolveSecteur({ ville, zone }))
      expect(svg.length, `${ville} : ${zone}`).toBeLessThan(60000)
    }
  })
  it('plusieurs villes éloignées : un secteur par ville, région comprise, rien au-delà de 250 km oublié', async () => {
    const { resolveSecteur, secteurHtml } = await load()
    const s = resolveSecteur({ ville: 'Paris', zone: 'Le Mans, Lille, Paris Ile de France, Nantes' })
    expect(s.multi).toBe(true)
    expect(s.poles.map((p: { label: string }) => p.label)).toEqual(['Paris et Île-de-France', 'Le Mans', 'Lille', 'Nantes'])
    expect(s.regions).toEqual(['Île-de-France'])
    expect(s.unknown).toEqual([])
    const h = secteurHtml({ ville: 'Paris', zone: 'Le Mans, Lille, Paris Ile de France, Nantes', prenom: 'Eric', metier: 'menage' })
    expect(h).toContain('4 secteurs')
    expect(h).not.toContain('jusqu’à')
  })
  it('villes proches : toujours une seule ville et son rayon', async () => {
    const { resolveSecteur } = await load()
    const s = resolveSecteur({ ville: 'Lyon', zone: 'Lyon + 40 km, Villeurbanne, Vienne' })
    expect(s.multi).toBe(false)
    expect(s.poles).toHaveLength(1)
  })
})
