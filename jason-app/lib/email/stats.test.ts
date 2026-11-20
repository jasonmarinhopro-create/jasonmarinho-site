import { describe, it, expect } from 'vitest'
import { buildEmailDashboard, lastDays, type RawEmailStats } from './stats'

const raw: RawEmailStats = {
  par_categorie: [
    { categorie: 'bilan-pro', envoyes: 10, remis: 9, rejetes: 1, spam: 0, retardes: 0 },
    { categorie: 'voyageur', envoyes: 4, remis: 4, rejetes: 0, spam: 0, retardes: 0 },
    { categorie: 'mystere', envoyes: 2, remis: 2, rejetes: 0, spam: 1, retardes: 0 },
  ],
  par_jour: [{ jour: '2026-11-19', envoyes: 5 }],
  rejets: [],
  clics: [
    { categorie: 'bilan-pro', bouton: 'voir-mes-statistiques', clics: 4 },
    { categorie: 'bilan-pro', bouton: 'voir-ma-fiche', clics: 1 },
  ],
  dernier_evenement: '2026-11-19T10:00:00Z',
}

describe('page E-mails', () => {
  it('totaux, taux de remise, clics par catégorie', () => {
    const d = buildEmailDashboard(raw, { today: '2026-11-20', jours: 30, webhookConfigured: true, now: Date.parse('2026-11-20T10:00:00Z') })
    expect(d.total).toMatchObject({ envoyes: 16, remis: 15, rejetes: 1, spam: 1, clics: 5 })
    expect(d.total.tauxRemise).toBe(93.8)
    const bilan = d.groupes.find(g => g.audience === 'pros')!.lignes[0]
    expect(bilan).toMatchObject({ categorie: 'bilan-pro', clics: 5, tauxClic: 50, topBouton: { bouton: 'voir-mes-statistiques', clics: 4 } })
    expect(d.groupes.find(g => g.audience === 'voyageurs')!.lignes[0].tauxClic).toBeNull()
    expect(d.groupes.find(g => g.audience === 'toi')!.lignes[0].categorie).toBe('autre')
    expect(d.alertes.join(' ')).toContain('1 e-mail signalé comme spam')
  })
  it('alertes de branchement', () => {
    expect(buildEmailDashboard(raw, { today: '2026-11-20', jours: 30, webhookConfigured: false }).alertes[0]).toContain('pas encore branché')
    expect(buildEmailDashboard({ ...raw, dernier_evenement: null }, { today: '2026-11-20', jours: 30, webhookConfigured: true }).alertes[0]).toContain('aucun événement reçu')
    expect(buildEmailDashboard(raw, { today: '2026-11-20', jours: 30, webhookConfigured: true, now: Date.parse('2026-11-25T10:00:00Z') }).alertes[0]).toContain('plus de 3 jours')
  })
  it('jours manquants à zéro', () => {
    const j = lastDays('2026-11-20', 3, [{ jour: '2026-11-19', envoyes: 5 }])
    expect(j).toEqual([{ jour: '2026-11-18', envoyes: 0 }, { jour: '2026-11-19', envoyes: 5 }, { jour: '2026-11-20', envoyes: 0 }])
  })
})
