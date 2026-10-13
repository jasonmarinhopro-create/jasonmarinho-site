import { describe, expect, it } from 'vitest'
import {
  cleanComment, cleanIdea, concerns, countByStatus, isEspace, lastDelivered, shortName,
  sortIdeas, statusNotification, IDEES_HREF, ESPACES, type IdeeLike,
} from './rules'

describe('cleanIdea', () => {
  it('nettoie les espaces et accepte une idée normale', () => {
    expect(cleanIdea('  Export   CSV des   voyageurs ', '  ')).toEqual({ ok: true, title: 'Export CSV des voyageurs', description: null })
  })
  it('refuse un titre trop court ou trop long', () => {
    expect(cleanIdea('abc', '').ok).toBe(false)
    expect(cleanIdea('x'.repeat(121), '').ok).toBe(false)
  })
  it('garde les retours à la ligne des détails sans en empiler', () => {
    const r = cleanIdea('Une vraie idée', 'Ligne 1\n\n\n\nLigne 2')
    expect(r).toEqual({ ok: true, title: 'Une vraie idée', description: 'Ligne 1\n\nLigne 2' })
  })
  it('refuse des détails trop longs', () => {
    expect(cleanIdea('Une vraie idée', 'x'.repeat(601)).ok).toBe(false)
  })
})

describe('cleanComment', () => {
  it('vide ou trop long : refusé', () => {
    expect(cleanComment('   ')).toBeNull()
    expect(cleanComment('x'.repeat(401))).toBeNull()
    expect(cleanComment('  oui  merci ')).toBe('oui merci')
  })
})

describe('shortName', () => {
  it('prénom + initiale du nom', () => {
    expect(shortName('camille sénéchal')).toBe('Camille S.')
    expect(shortName('Jean Paul Martin')).toBe('Jean M.')
    expect(shortName('Lou')).toBe('Lou')
    expect(shortName(null)).toBe('Un membre')
    expect(shortName('  ')).toBe('Un membre')
  })
})

const item = (id: string, over: Partial<IdeeLike> = {}): IdeeLike => ({
  id, status: 'suggestion', espace: null, created_at: '2026-10-01T10:00:00Z', ...over,
})

describe('concerns', () => {
  it('une idée sans espace concerne tout le monde', () => {
    expect(concerns(item('a'), 'photographe')).toBe(true)
    expect(concerns(item('a', { espace: 'hote' }), 'photographe')).toBe(false)
    expect(concerns(item('a', { espace: 'hote' }), 'tous')).toBe(true)
  })
})

describe('sortIdeas', () => {
  const list = [
    item('vieux', { created_at: '2026-09-01T00:00:00Z' }),
    item('recent', { created_at: '2026-10-10T00:00:00Z' }),
    item('vote', { created_at: '2026-08-01T00:00:00Z' }),
  ]
  it('populaires : votes puis date', () => {
    expect(sortIdeas(list, { vote: 3 }, 'populaires').map(i => i.id)).toEqual(['vote', 'recent', 'vieux'])
  })
  it('récentes : date seule', () => {
    expect(sortIdeas(list, { vote: 3 }, 'recentes').map(i => i.id)).toEqual(['recent', 'vieux', 'vote'])
  })
})

describe('countByStatus et lastDelivered', () => {
  it('compte et range les livrées par date de livraison', () => {
    const list = [
      item('a', { status: 'done', status_changed_at: '2026-10-01T00:00:00Z' }),
      item('b', { status: 'done', status_changed_at: '2026-10-05T00:00:00Z' }),
      item('c', { status: 'planned' }),
    ]
    expect(countByStatus(list)).toEqual({ suggestion: 0, planned: 1, in_progress: 0, done: 2 })
    expect(lastDelivered(list).map(i => i.id)).toEqual(['b', 'a'])
  })
})

describe('statusNotification', () => {
  it('rien pour une idée simplement proposée', () => {
    expect(statusNotification('suggestion', 'x')).toBeNull()
    expect(statusNotification('done', 'Export CSV')?.title).toBe('Ton idée est livrée')
  })
  it('sans tiret cadratin', () => {
    for (const st of ['planned', 'in_progress', 'done'] as const) {
      const n = statusNotification(st, 'Une idée')!
      expect(`${n.title} ${n.body}`).not.toMatch(/—/)
    }
  })
})

describe('espaces', () => {
  it('chaque espace a sa page, sous le chemin de son menu', () => {
    for (const e of ESPACES) expect(IDEES_HREF[e]).toMatch(/^\/dashboard\//)
    expect(IDEES_HREF.photographe.startsWith('/dashboard/ma-fiche-photographe')).toBe(true)
    expect(IDEES_HREF.menage.startsWith('/dashboard/ma-fiche-menage')).toBe(true)
    expect(IDEES_HREF.investisseur.startsWith('/dashboard/investir')).toBe(true)
    expect(isEspace('hote')).toBe(true)
    expect(isEspace('admin')).toBe(false)
  })
})

describe('pourQui', () => {
  it('libellé de l\'espace, ou tout le monde', async () => {
    const { pourQui } = await import('./rules')
    expect(pourQui('photographe')).toBe('Pour les photographes')
    expect(pourQui(null)).toBe('Pour tout le monde')
  })
})
