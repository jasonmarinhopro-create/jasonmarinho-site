import { describe, it, expect } from 'vitest'
import { dueDepositReminders, depositOpenEmail, type DepositReminderRow } from './deposit-reminders'

const NOW = new Date('2026-10-08T07:00:00Z') // cron de 7 h UTC, le 8 oct. à Paris

function row(p: Partial<DepositReminderRow> = {}): DepositReminderRow {
  return {
    id: 'c1', user_id: 'host', token: 'tok', langue: 'fr',
    locataire_prenom: 'Ana', locataire_nom: 'Silva', locataire_email: 'ana@example.com',
    logement_nom: 'Casa do Pedreiro', logement_adresse: '1 rua', montant_caution: 300,
    date_arrivee: '2026-10-10', stripe_deposit_status: null, ...p,
  }
}

describe('dueDepositReminders', () => {
  const ready = new Set(['host'])
  it('cible les arrivées dans exactement 2 jours', () => {
    expect(dueDepositReminders([row()], ready, NOW)).toHaveLength(1)
    expect(dueDepositReminders([row({ date_arrivee: '2026-10-11' })], ready, NOW)).toHaveLength(0)
    expect(dueDepositReminders([row({ date_arrivee: '2026-10-09' })], ready, NOW)).toHaveLength(0)
  })
  it('ignore les cautions déjà bloquées, encaissées ou libérées', () => {
    for (const st of ['held', 'captured', 'released', 'capturing', 'releasing']) {
      expect(dueDepositReminders([row({ stripe_deposit_status: st })], ready, NOW)).toHaveLength(0)
    }
    expect(dueDepositReminders([row({ stripe_deposit_status: 'pending' })], ready, NOW)).toHaveLength(1)
    expect(dueDepositReminders([row({ stripe_deposit_status: 'expired' })], ready, NOW)).toHaveLength(1)
  })
  it('exige un email, une caution et un hôte connecté à Stripe', () => {
    expect(dueDepositReminders([row({ locataire_email: null })], ready, NOW)).toHaveLength(0)
    expect(dueDepositReminders([row({ montant_caution: 0 })], ready, NOW)).toHaveLength(0)
    expect(dueDepositReminders([row()], new Set(), NOW)).toHaveLength(0)
  })
})

describe('depositOpenEmail', () => {
  it('écrit dans la langue du contrat et échappe le nom', () => {
    const pt = depositOpenEmail(row({ langue: 'pt', locataire_prenom: '<b>Ana' }), 'https://app.test')
    expect(pt.subject).toContain('Caução')
    expect(pt.html).toContain('https://app.test/api/stripe/deposit/redirect?token=tok')
    expect(pt.html).not.toContain('<b>Ana')
    const fr = depositOpenEmail(row(), 'https://app.test')
    expect(fr.subject).toContain('Caution')
  })
})
