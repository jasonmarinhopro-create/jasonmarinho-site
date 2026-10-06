import { describe, it, expect } from 'vitest'
import { newsletterAudience, toBrevoCsv } from './newsletter'

const v = (o: Partial<{ prenom: string; nom: string; email: string | null; source: string | null; bloque: boolean | null }>) =>
  ({ prenom: 'Léa', nom: 'Martin', email: 'lea@exemple.fr', source: 'direct', bloque: false, ...o })

describe('newsletter des voyageurs directs', () => {
  it('ne garde que les voyageurs directs avec un e-mail, sans doublon', () => {
    const a = newsletterAudience([
      v({}),
      v({ email: 'LEA@exemple.fr ' }),
      v({ prenom: 'Tom', email: 'tom@exemple.fr', source: 'driing' }),
      v({ email: 'x@exemple.fr', source: 'airbnb' }),
      v({ email: 'y@exemple.fr', source: 'booking' }),
      v({ email: 'z@exemple.fr', source: null }),
      v({ email: null, source: 'recommandation' }),
      v({ email: 'abc123@guest.booking.com', source: 'direct' }),
      v({ email: 'b@exemple.fr', bloque: true }),
    ])
    expect(a.eligible.map(x => x.email)).toEqual(['lea@exemple.fr', 'tom@exemple.fr'])
    expect(a).toMatchObject({ platform: 2, unknownSource: 1, noEmail: 2 })
  })

  it('CSV pour Brevo, cellules protégées', () => {
    const csv = toBrevoCsv([v({ prenom: '=SOMME(1)', nom: 'Le "Grand"' })])
    expect(csv).toBe('"EMAIL";"PRENOM";"NOM"\r\n"lea@exemple.fr";"\'=SOMME(1)";"Le ""Grand"""\r\n')
  })
})
