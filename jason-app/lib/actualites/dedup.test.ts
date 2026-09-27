import { describe, it, expect } from 'vitest'
import { dedupeActualites, findSimilarActualite, isSimilarActualite, tokens } from './dedup'
import actus from './__fixtures__/actus-2026-09.json'

// Les 54 actualités réellement publiées du 28/08 au 26/09/2026, dont 22
// reformulations de « Airbnb passe à 15,5 % ». Étiquetage manuel des sujets.
function sujet(title: string): string {
  const t = title.toLowerCase()
  if (/15,5|15\.5/.test(t)) return 'airbnb-15.5'
  if (/été 2026/.test(t)) return 'bilan-ete'
  if (/factur/.test(t)) return 'facture-electronique'
  if (/declaloc|déclaloc|api meublés|téléservice|enregistrement meublé/.test(t)) return 'enregistrement'
  if (/super-app|intègre hôtels|nouveaux services/.test(t)) return 'airbnb-services'
  if (/bruxelles|l'ue donne/.test(t)) return 'proposition-ue-9-septembre'
  return 'unique:' + t
}

describe('tokens', () => {
  it('normalise accents, pluriels et nombres', () => {
    expect([...tokens('Les hôtes : 15,5 % dès le 13 octobre, 83 600 euros')])
      .toEqual(['hote', '15_5', '13', 'octobre', '83600', 'euro'])
  })
})

describe('isSimilarActualite (données réelles)', () => {
  it('ne rapproche jamais deux sujets différents', () => {
    const faux: string[] = []
    for (let i = 0; i < actus.length; i++) for (let j = 0; j < i; j++) {
      if (sujet(actus[i].title) !== sujet(actus[j].title) && isSimilarActualite(actus[i], actus[j])) {
        faux.push(`${actus[i].title} ≈ ${actus[j].title}`)
      }
    }
    expect(faux).toEqual([])
  })

  it('aurait bloqué toutes les reformulations Airbnb 15,5 %, bilan été et facture électronique', () => {
    const passees: string[] = []
    for (let i = 0; i < actus.length; i++) {
      const s = sujet(actus[i].title)
      if (!['airbnb-15.5', 'bilan-ete', 'facture-electronique'].includes(s)) continue
      const avant = actus.slice(0, i).filter(a => sujet(a.title) === s)
      if (avant.length && !findSimilarActualite(actus[i], avant)) passees.push(actus[i].title)
    }
    // Seule exception assumée : un vrai fait différent (part des séjours en France).
    expect(passees).toEqual(['Été 2026 : 70 % des réservations Airbnb des Français restent en France'])
  })

  it('laisse passer une actu distincte du même domaine', () => {
    const airbnb = actus.find(a => a.title.includes('15,5'))!
    expect(findSimilarActualite(
      { title: 'Booking.com supprime la parité tarifaire en France', summary: 'Booking ne peut plus imposer ses prix. Tu peux proposer moins cher sur ton site direct.', source_url: 'https://example.fr/booking' },
      [airbnb],
    )).toBeNull()
  })
})

describe('dedupeActualites (affichage)', () => {
  const dated = actus.map(a => ({ ...a, published_at: `${a.date.slice(0, 4)}-${a.date.slice(4, 6)}-${a.date.slice(6, 8)}T07:00:00Z` }))
  const newestFirst = [...dated].reverse()

  it('ne montre plus qu\'une seule actu « Airbnb 15,5 % » et une seule facture électronique', () => {
    const out = dedupeActualites(newestFirst)
    expect(out.filter(a => sujet(a.title) === 'airbnb-15.5')).toHaveLength(1)
    expect(out.filter(a => sujet(a.title) === 'facture-electronique')).toHaveLength(1)
    // Bilans de l'été : 13 publiés, 3 au plus restent à l'affichage (dont le
    // fait distinct « 70 % des séjours en France ») ; la migration 111 fait le reste.
    expect(out.filter(a => sujet(a.title) === 'bilan-ete').length).toBeLessThanOrEqual(3)
    // La plus récente est gardée (info la plus à jour).
    expect(out.find(a => sujet(a.title) === 'airbnb-15.5')!.date).toBe('20260926')
  })

  it('garde toutes les actus uniques', () => {
    const out = dedupeActualites(newestFirst)
    const uniques = newestFirst.filter(a => sujet(a.title).startsWith('unique:'))
    for (const u of uniques) expect(out).toContain(u)
  })
})
