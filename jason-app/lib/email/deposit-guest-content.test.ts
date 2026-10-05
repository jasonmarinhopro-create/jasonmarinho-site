import { describe, it, expect } from 'vitest'
import { buildDepositGuestEmail, type DepositGuestEmail } from './deposit-guest-content'

const base: DepositGuestEmail = {
  to: 'voyageur@exemple.fr', langue: 'fr', token: 'abc123', guestFirstName: 'Manon',
  hostName: 'Jason Marinho', hostEmail: 'hote@exemple.fr', property: 'Casa Do Pedreiro',
  deposit: 300, outcome: 'released',
}
const APP = 'https://app.jasonmarinho.com'

describe('e-mail au voyageur sur sa caution', () => {
  it('libération : rien prélevé, montant libéré, lien vers le contrat', () => {
    const m = buildDepositGuestEmail(base, APP)
    expect(m.subject).toBe('Caution libérée : Casa Do Pedreiro')
    expect(m.html).toContain('rien n&#39;a été prélevé'.replace('&#39;', "'"))
    expect(m.html).toContain('300,00')
    expect(m.html).toContain(`${APP}/sign/abc123#depot-garantie`)
    expect(m.fromName).toBe('Jason Marinho via Jason Marinho')
  })
  it('retenue partielle : montant retenu, reste libéré, motif', () => {
    const m = buildDepositGuestEmail({ ...base, outcome: 'captured', kept: 80, reason: 'Verre cassé' }, APP)
    expect(m.subject).toBe('Caution : somme retenue, Casa Do Pedreiro')
    expect(m.html).toContain('80,00')
    expect(m.html).toContain('220,00')
    expect(m.html).toContain('Verre cassé')
  })
  it('échappe le motif et le nom (pas de HTML injecté)', () => {
    const m = buildDepositGuestEmail({ ...base, outcome: 'captured', kept: 10, reason: '<script>x</script>', hostName: '<b>Hôte</b>' }, APP)
    expect(m.html).not.toContain('<script>')
    expect(m.html).not.toContain('<b>Hôte</b>')
    expect(m.fromName).not.toMatch(/[<>"]/)
  })
  it('suit la langue du contrat (portugais)', () => {
    const m = buildDepositGuestEmail({ ...base, langue: 'pt' }, APP)
    expect(m.subject).toBe('Caução libertada: Casa Do Pedreiro')
    expect(m.html).toContain('nada foi cobrado')
  })
  it('sans prénom : pas de « Bonjour , »', () => {
    const m = buildDepositGuestEmail({ ...base, guestFirstName: null }, APP)
    expect(m.html).not.toContain('Bonjour ,')
  })
  it('sans tiret cadratin ni emoji', () => {
    for (const o of ['released', 'captured'] as const) {
      const m = buildDepositGuestEmail({ ...base, outcome: o, kept: 50, reason: 'Test' }, APP)
      expect(m.subject + m.html).not.toContain('—')
    }
  })
})
