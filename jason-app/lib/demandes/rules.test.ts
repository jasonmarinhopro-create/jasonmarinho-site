import { describe, it, expect } from 'vitest'
import { cleanDemande, proximite, choisirPros, messagePourPro, anonymizedNeed, prochaineAction, type DemandeInput } from './rules'

const base = { metier: 'photographe', ville: 'Lyon', nom: 'Paul Martin', email: 'Paul@Exemple.fr', consent: true }

describe('formulaire', () => {
  it('valide et nettoie', () => {
    const r = cleanDemande({ ...base, logement: 'T2 ou T3', quand: 'Dans le mois', frequence: 'x', telephone: '06 12 34 56 78', message: '  Bonjour   ' })
    expect('value' in r && r.value).toMatchObject({ metier: 'photographe', email: 'paul@exemple.fr', logement: 'T2 ou T3', quand: 'Dans le mois', frequence: null, telephone: '06 12 34 56 78', message: 'Bonjour' })
  })
  it('refuse sans consentement, e-mail ou ville', () => {
    expect('error' in cleanDemande({ ...base, consent: false })).toBe(true)
    expect('error' in cleanDemande({ ...base, email: 'paul@' })).toBe(true)
    expect('error' in cleanDemande({ ...base, ville: '' })).toBe(true)
    expect('error' in cleanDemande({ ...base, metier: 'plombier' })).toBe(true)
  })
  it('valeurs hors liste ignorées, fréquence seulement pour le ménage', () => {
    const r = cleanDemande({ ...base, metier: 'menage', logement: 'Château', frequence: 'Des ménages réguliers entre deux voyageurs' })
    expect('value' in r && r.value.logement).toBe(null)
    expect('value' in r && r.value.frequence).toBe('Des ménages réguliers entre deux voyageurs')
  })
})

describe('pros les plus proches', () => {
  const pros = [
    { id: 'a', ville: 'Lyon', zone_couverte: 'Lyon + 60 km', contacts_count: 5 },
    { id: 'b', ville: 'Villeurbanne', zone_couverte: null, villes_couvertes: ['Lyon'], contacts_count: 0 },
    { id: 'c', ville: 'Lyon 6e', zone_couverte: null, contacts_count: 1 },
    { id: 'd', ville: 'Annecy', zone_couverte: 'Haute-Savoie, Lyon', contacts_count: 0 },
    { id: 'e', ville: 'Bordeaux', zone_couverte: 'Gironde', contacts_count: 0 },
    { id: 'f', ville: 'Lyon', zone_couverte: null, contacts_count: 0 },
  ]
  it('ville exacte d’abord, puis villes couvertes, puis zone', () => {
    expect(proximite(pros[0], 'lyon')).toBe(100)
    expect(proximite(pros[2], 'Lyon')).toBe(90)
    expect(proximite(pros[1], 'Lyon')).toBe(80)
    expect(proximite(pros[3], 'Lyon')).toBe(50)
    expect(proximite(pros[4], 'Lyon')).toBe(0)
    expect(proximite({ id: 'x', ville: 'Saint-Malo', zone_couverte: null }, 'St Malo')).toBe(100)
  })
  it('3 au plus, les moins sollicités d’abord à égalité, sans ceux déjà sollicités', () => {
    expect(choisirPros(pros, 'Lyon', new Set()).map(p => p.id)).toEqual(['f', 'a', 'c'])
    expect(choisirPros(pros, 'Lyon', new Set(['f', 'a', 'c'])).map(p => p.id)).toEqual(['b', 'd'])
    expect(choisirPros(pros, 'Brest', new Set())).toEqual([])
  })
})

describe('textes', () => {
  const d: DemandeInput = { metier: 'menage', ville: 'Bordeaux', logement: 'T2 ou T3', quand: 'Au plus vite', frequence: 'Des ménages réguliers entre deux voyageurs', budget: '80 € le ménage', message: 'Code 1234, appelez-moi', nom: 'Paul Martin', email: 'paul@exemple.fr', telephone: '0612345678', source: null }
  it('message du pro complet', () => {
    const m = messagePourPro(d)
    expect(m).toContain('une équipe de ménage à Bordeaux')
    expect(m).toContain('Téléphone : 0612345678')
    expect(m).toContain('Code 1234')
  })
  it('besoin anonymisé : ni nom, ni e-mail, ni téléphone, ni message', () => {
    const a = anonymizedNeed(d)
    expect(a).toBe('Un hôte cherche une équipe de ménage à Bordeaux : T2 ou T3, des ménages réguliers entre deux voyageurs, au plus vite, budget 80 € le ménage.')
    for (const s of ['Paul', 'exemple.fr', '0612', '1234']) expect(a).not.toContain(s)
  })
})

describe('relances', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const d = { status: 'envoyee' as const, created_at: '2026-10-17T10:00:00Z', last_round_at: '2026-10-17T10:00:00Z', sent_to: [{ id: 'a', contact_id: 'c1', round: 1 }, { id: 'b', contact_id: 'c2', round: 1 }] }
  it('élargit après 48 h si personne n’a touché à la demande', () => {
    expect(prochaineAction(d, new Map([['c1', 'nouvelle'], ['c2', 'nouvelle']]), now)).toBe('elargir')
    expect(prochaineAction(d, new Map([['c1', 'repondue']]), now)).toBe('rien')
    expect(prochaineAction({ ...d, last_round_at: '2026-10-19T20:00:00Z' }, new Map(), now)).toBe('rien')
  })
  it('3 vagues au plus ; sans pro : nouveaux pros pendant 30 jours', () => {
    expect(prochaineAction({ ...d, sent_to: [{ id: 'x', contact_id: 'c', round: 3 }] }, new Map(), now)).toBe('rien')
    expect(prochaineAction({ ...d, status: 'sans_pro', sent_to: [] }, new Map(), now)).toBe('nouveaux_pros')
    expect(prochaineAction({ ...d, status: 'sans_pro', created_at: '2026-09-01T00:00:00Z', sent_to: [] }, new Map(), now)).toBe('rien')
  })
})

describe('photographes et vidéastes', () => {
  it('garde le besoin photo / vidéo dans la demande', async () => {
    const { cleanDemande } = await import('./rules')
    const r = cleanDemande({ metier: 'photographe', ville: 'Lyon', nom: 'Paul Dupont', email: 'paul@exemple.fr', consent: true, frequence: 'Une vidéo' })
    expect('value' in r && r.value.frequence).toBe('Une vidéo')
  })
  it('sert d\'abord les pros qui font ce que l\'hôte demande', async () => {
    const { choisirPros } = await import('./rules')
    const pros = [
      { id: 'photo', ville: 'Lyon', zone_couverte: null, metier: 'photo', options: [] },
      { id: 'video', ville: 'Villeurbanne', zone_couverte: 'Lyon', metier: 'video', options: [] },
      { id: 'drone', ville: 'Lyon', zone_couverte: null, metier: 'photo_video', options: ['drone'] },
    ]
    // Le photographe sans vidéo ne reçoit pas une demande de vidéo
    expect(choisirPros(pros, 'Lyon', new Set(), 3, 'Une vidéo').map(p => p.id)).toEqual(['drone', 'video'])
    expect(choisirPros(pros, 'Lyon', new Set(), 3, 'Des photos').map(p => p.id).sort()).toEqual(['drone', 'photo'])
    // Vidéo au drone : celui qui a le drone d'abord, le vidéaste sans drone ensuite
    expect(choisirPros(pros, 'Lyon', new Set(), 3, 'Une vidéo avec vues au drone').map(p => p.id)).toEqual(['drone', 'video'])
    // Photos et vidéo : celui qui fait les deux d'abord, puis ceux qui en font une
    expect(choisirPros(pros, 'Lyon', new Set(), 3, 'Des photos et une vidéo').map(p => p.id)).toEqual(['drone', 'photo', 'video'])
    expect(choisirPros(pros, 'Lyon', new Set(), 1, 'Des photos avec vues au drone').map(p => p.id)).toEqual(['drone'])
    expect(choisirPros(pros, 'Lyon', new Set(), 3, null).map(p => p.id).slice(0, 2).sort()).toEqual(['drone', 'photo'])
  })
  it('note l\'adéquation et explique au pro ce qui manque', async () => {
    const { convientAuBesoin, pourquoiCePro, manquesDuPro, cleanDemande } = await import('./rules')
    const photo = { id: 'p', ville: 'Lyon', zone_couverte: null, metier: 'photo', options: [] }
    const drone = { id: 'd', ville: 'Lyon', zone_couverte: null, metier: 'photo', options: ['drone'] }
    expect(convientAuBesoin(photo, 'Une vidéo')).toBe(0)
    expect(convientAuBesoin(photo, 'Des photos avec vues au drone')).toBe(1)
    expect(convientAuBesoin(drone, 'Des photos avec vues au drone')).toBe(2)
    expect(convientAuBesoin(drone, 'Une vidéo avec vues au drone')).toBe(0)
    expect(convientAuBesoin({ ...photo, metier: null }, 'Des photos')).toBe(2)
    expect(manquesDuPro(photo, 'Des photos et une vidéo')).toEqual(['la vidéo'])
    expect(pourquoiCePro(drone, 'Des photos avec vues au drone')).toBe('L’hôte demande la photo et les vues au drone, et ta fiche indique que tu le proposes.')
    expect(pourquoiCePro(photo, 'Des photos avec vues au drone')).toContain('Ta fiche n’indique pas les vues au drone')
    expect(pourquoiCePro(photo, null)).toBeNull()
    const r = cleanDemande({ metier: 'photographe', ville: 'Lyon', nom: 'Paul Dupont', email: 'paul@exemple.fr', consent: true, frequence: 'Une vidéo avec vues au drone' })
    expect('value' in r && r.value.frequence).toBe('Une vidéo avec vues au drone')
  })
})

describe('formulaire du site', () => {
  it('propose les mêmes besoins photo / vidéo que l’app', async () => {
    const { readFileSync } = await import('node:fs')
    const { PRESTATIONS_PHOTO } = await import('./rules')
    const src = readFileSync(new URL('../../../scripts/build-trouver-un-pro.mjs', import.meta.url), 'utf8')
    const m = src.match(/const PRESTATIONS_PHOTO = (\[[^\]]*\])/)
    expect(m && JSON.parse(m[1].replace(/'/g, '"'))).toEqual([...PRESTATIONS_PHOTO])
  })
  it('propose les mêmes logements, délais et besoins de ménage que l’app (sinon refusés à l’envoi)', async () => {
    const { readFileSync } = await import('node:fs')
    const rules = await import('./rules')
    const src = readFileSync(new URL('../../../scripts/build-trouver-un-pro.mjs', import.meta.url), 'utf8')
    for (const name of ['LOGEMENTS', 'QUAND', 'FREQUENCES', 'TAILLES_HOTEL', 'TAILLES_CONCIERGERIE'] as const) {
      const m = src.match(new RegExp(`const ${name} = (\\[[^\\]]*\\])`))
      expect(m && JSON.parse(m[1].replace(/'/g, '"'))).toEqual([...rules[name]])
    }
  })
})

describe('hôtels, conciergeries et gîtes (24/10/2026)', () => {
  const base = { metier: 'photographe', ville: 'Nice', nom: 'Hôtel Bleu', email: 'contact@hotel.fr', consent: true }
  it('type d’hébergement lu, taille selon le type', async () => {
    const { cleanDemande } = await import('./rules')
    const r = cleanDemande({ ...base, etablissement: 'hotel', logement: '15 à 50 chambres' })
    expect('value' in r && r.value.etablissement).toBe('hotel')
    expect('value' in r && r.value.logement).toBe('15 à 50 chambres')
    const autre = cleanDemande({ ...base, etablissement: 'hotel', logement: 'Studio ou T1' })
    expect('value' in autre && autre.value.logement).toBeNull()
    const ancien = cleanDemande({ ...base, logement: 'T2 ou T3' })
    expect('value' in ancien && ancien.value.etablissement).toBeNull()
    expect('value' in ancien && ancien.value.logement).toBe('T2 ou T3')
    const inconnu = cleanDemande({ ...base, etablissement: 'chateau' })
    expect('value' in inconnu && inconnu.value.etablissement).toBeNull()
  })
  it('à adéquation égale, d’abord les pros qui travaillent pour les hôtels', async () => {
    const { choisirPros } = await import('./rules')
    const pros = [
      { id: 'a', ville: 'Nice', zone_couverte: null, clienteles: [] as string[] },
      { id: 'b', ville: 'Nice', zone_couverte: null, clienteles: ['hotel'] },
    ]
    expect(choisirPros(pros, 'Nice', new Set(), 3, null, 'hotel').map(p => p.id)).toEqual(['b', 'a'])
    expect(choisirPros(pros, 'Nice', new Set(), 3, null, 'lcd').map(p => p.id)).toEqual(['a', 'b'])
  })
  it('textes : qui demande', async () => {
    const { anonymizedNeed, messagePourPro } = await import('./rules')
    expect(anonymizedNeed({ metier: 'photographe', ville: 'Nice', logement: '15 à 50 chambres', quand: null, frequence: null, budget: null, etablissement: 'hotel' }))
      .toBe('Un hôtel ou une résidence cherche un photographe à Nice : 15 à 50 chambres.')
    expect(anonymizedNeed({ metier: 'menage', ville: 'Lyon', logement: null, quand: null, frequence: null, budget: null }))
      .toBe('Un hôte cherche une équipe de ménage à Lyon.')
    const m = messagePourPro({ metier: 'photographe', etablissement: 'conciergerie', ville: 'Annecy', logement: '6 à 20 logements', quand: null, frequence: null, budget: null, message: null, nom: 'x', email: 'x@y.fr', telephone: null, source: null })
    expect(m).toContain('une conciergerie cherche un photographe à Annecy')
    expect(m).toContain('Taille : 6 à 20 logements')
  })
  it('même liste de clientèles sur le site et dans l’app', async () => {
    const { CLIENTELES, CLIENTELE_KEYS } = await import('@/lib/pros/clienteles')
    const site = await import('../../../scripts/lib/pro-clienteles.mjs')
    expect(site.CLIENTELES).toEqual(CLIENTELES)
    const { readFileSync } = await import('node:fs')
    for (const api of ['photographer', 'cleaner']) {
      const src = readFileSync(new URL(`../../../api/${api}/signup.js`, import.meta.url), 'utf8')
      const m = src.match(/const CLIENTELE_KEYS = (\[[^\]]*\])/)
      expect(m && JSON.parse(m[1].replace(/'/g, '"'))).toEqual([...CLIENTELE_KEYS])
    }
  })
})
