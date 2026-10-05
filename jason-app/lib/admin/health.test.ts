import { describe, it, expect } from 'vitest'
import {
  worst, overallSummary, stripeAccountIssues, isMissingRelation, workflowHealth, envHealth,
  WATCHED_WORKFLOWS, type HealthCheck, type StripeAccountInfo,
} from './health'

const okAccount: StripeAccountInfo = {
  id: 'acct_123456', mcc: '7011', chargesEnabled: true, payoutsEnabled: true,
  currentlyDue: 0, pastDue: 0, disabledReason: null, feesPayer: 'application', detailsSubmitted: true,
}

describe('worst / overallSummary', () => {
  it('garde le niveau le plus grave', () => {
    expect(worst(['ok', 'warn', 'ok'])).toBe('warn')
    expect(worst(['unknown', 'alert', 'warn'])).toBe('alert')
    expect(worst([])).toBe('ok')
  })
  it('résume en français', () => {
    const c = (level: HealthCheck['level']): HealthCheck => ({ key: level, title: level, level, summary: '', items: [] })
    expect(overallSummary([c('ok'), c('ok')]).text).toBe('Tout va bien')
    expect(overallSummary([c('warn'), c('ok')]).text).toBe('1 point à surveiller')
    expect(overallSummary([c('alert'), c('alert'), c('warn')]).text).toBe('2 points à régler, 1 à surveiller')
  })
})

describe('stripeAccountIssues', () => {
  it('compte prêt : rien à signaler', () => {
    expect(stripeAccountIssues(okAccount)).toEqual({ level: 'ok', issues: [] })
  })
  it('code d\'activité 7392 au lieu de 7011 : à surveiller', () => {
    const r = stripeAccountIssues({ ...okAccount, mcc: '7392' })
    expect(r.level).toBe('warn')
    expect(r.issues[0]).toContain('7392')
  })
  it('paiements bloqués et informations en retard : à régler', () => {
    const r = stripeAccountIssues({ ...okAccount, chargesEnabled: false, pastDue: 2 })
    expect(r.level).toBe('alert')
    expect(r.issues).toContain('paiements bloqués par Stripe')
    expect(r.issues.some(i => i.includes('2 informations en retard'))).toBe(true)
  })
  it('inscription pas terminée : à surveiller, pas d\'alerte paiements', () => {
    const r = stripeAccountIssues({ ...okAccount, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false })
    expect(r.level).toBe('warn')
    expect(r.issues).toEqual(['inscription Stripe pas terminée'])
  })
})

describe('isMissingRelation', () => {
  it('reconnaît table ou colonne absente', () => {
    for (const c of ['42P01', '42703', 'PGRST204', 'PGRST205']) expect(isMissingRelation(c)).toBe(true)
    expect(isMissingRelation('23505')).toBe(false)
    expect(isMissingRelation(null)).toBe(false)
  })
})

describe('workflowHealth', () => {
  const backup = WATCHED_WORKFLOWS.find(w => w.label === 'Sauvegarde de la base')!
  const prosp = WATCHED_WORKFLOWS.find(w => w.weekdaysOnly)!
  const now = new Date('2026-10-07T10:00:00Z') // mercredi
  it('réussi récemment : ok', () => {
    const r = workflowHealth(backup, [{ path: backup.path, status: 'completed', conclusion: 'success', createdAt: '2026-10-07T02:17:00Z' }], now)
    expect(r.level).toBe('ok')
    expect(r.detail).toContain('il y a 8 h')
  })
  it('dernier passage en échec : alerte', () => {
    const r = workflowHealth(backup, [{ path: backup.path, status: 'completed', conclusion: 'failure', createdAt: '2026-10-07T02:17:00Z' }], now)
    expect(r.level).toBe('alert')
  })
  it('passage en cours ignoré, on lit le dernier terminé', () => {
    const r = workflowHealth(backup, [
      { path: backup.path, status: 'in_progress', conclusion: null, createdAt: '2026-10-07T09:59:00Z' },
      { path: backup.path, status: 'completed', conclusion: 'success', createdAt: '2026-10-07T02:17:00Z' },
    ], now)
    expect(r.level).toBe('ok')
  })
  it('trop ancien : à surveiller', () => {
    const r = workflowHealth(backup, [{ path: backup.path, status: 'completed', conclusion: 'success', createdAt: '2026-10-04T02:17:00Z' }], now)
    expect(r.level).toBe('warn')
  })
  it('aucun passage : à surveiller', () => {
    expect(workflowHealth(backup, [], now).level).toBe('warn')
  })
  it('prospection : le lundi matin, vendredi soir est normal', () => {
    const monday = new Date('2026-10-12T08:00:00Z')
    const r = workflowHealth(prosp, [{ path: prosp.path, status: 'completed', conclusion: 'success', createdAt: '2026-10-09T15:30:00Z' }], monday)
    expect(r.level).toBe('ok')
  })
})

describe('envHealth', () => {
  it('signale les clés absentes, critiques en alerte', () => {
    const items = envHealth({ RESEND_API_KEY: 'x', STRIPE_SECRET_KEY: 'x', STRIPE_WEBHOOK_SECRET: 'x' })
    const connect = items.find(i => i.label.includes('Comptes connectés'))!
    expect(connect.level).toBe('alert')
    expect(connect.detail).toContain('STRIPE_CONNECT_WEBHOOK_SECRET')
    expect(items.find(i => i.label.startsWith('E-mails'))!.level).toBe('ok')
    expect(items.find(i => i.label.startsWith('Notifications'))!.level).toBe('warn')
  })
  it('ne renvoie jamais la valeur d\'une clé', () => {
    const items = envHealth({ RESEND_API_KEY: 'secret-value-123' })
    expect(JSON.stringify(items)).not.toContain('secret-value-123')
  })
})
