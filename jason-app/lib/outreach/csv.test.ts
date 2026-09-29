import { describe, it, expect } from 'vitest'
import { parseCsv, mapHeaders, rowsToContacts } from './csv'

describe('parseCsv', () => {
  it('point-virgule, guillemets et retour à la ligne', () => {
    const rows = parseCsv('﻿Nom;Email;Ville\n"Gîte ""Les Pins""";contact@pins.fr;Annecy\n"Chez\nMarie";;Lyon\n')
    expect(rows).toEqual([['Nom', 'Email', 'Ville'], ['Gîte "Les Pins"', 'contact@pins.fr', 'Annecy'], ['Chez\nMarie', '', 'Lyon']])
  })
  it('virgule', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })
})

describe('mapHeaders', () => {
  it('reconnaît les colonnes usuelles', () => {
    expect(mapHeaders(['Nom de l\'offre', 'Adresse e-mail', 'Commune', 'Code postal', 'Site web', 'Téléphone', 'Prénom']))
      .toEqual(['nom', 'email', 'ville', 'departement', 'site_web', 'telephone', 'prenom'])
  })
})

describe('rowsToContacts', () => {
  it('valide l\'e-mail, garde le département, complète le site', () => {
    const map = mapHeaders(['Nom', 'Mail', 'CP', 'Site'])
    const res = rowsToContacts([['Gîte A', 'pas-un-mail ; resa@gite-a.fr', '74400', 'gite-a.fr'], ['', '', '', '']], map)
    expect(res).toEqual([{ nom: 'Gîte A', email: 'resa@gite-a.fr', departement: '74', site_web: 'https://gite-a.fr' }])
  })
})
