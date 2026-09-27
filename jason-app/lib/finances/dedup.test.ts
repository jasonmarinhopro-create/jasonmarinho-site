import { describe, expect, it } from 'vitest'
import { sejoursSansContrat } from './dedup'

describe('sejoursSansContrat', () => {
  const sejours = [{ id: 's1', montant: 350 }, { id: 's2', montant: 200 }]

  it('retire le séjour déjà compté par son contrat', () => {
    expect(sejoursSansContrat(sejours, [{ sejour_id: 's1', statut: 'signe' }]).map(s => s.id)).toEqual(['s2'])
  })

  it('garde le séjour si le contrat est annulé ou sans séjour lié', () => {
    expect(sejoursSansContrat(sejours, [{ sejour_id: 's1', statut: 'annule' }, { sejour_id: null, statut: 'signe' }]).map(s => s.id))
      .toEqual(['s1', 's2'])
  })
})
