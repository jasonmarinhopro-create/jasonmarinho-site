// Membres de la Vue d'ensemble admin, filtrables par espace (16/11/2026,
// Jason : « une partie filtre entre les hôtes, photographes et tout, avec des
// raccourcis vers chaque page »). Pour chaque espace : nombre de comptes,
// nouveaux ce mois-ci, courbe du nombre de comptes sur 12 mois, répartition
// (formules des hôtes, fiches payées des pros) et derniers inscrits.
// Pur et testé (members-cockpit.test.ts). Comptes admin déjà écartés.
import { parisDay } from '@/lib/visibility/rules'

export type MemberSpace = 'tous' | 'hote' | 'investisseur' | 'photographe' | 'menage' | 'depannage'
export const MEMBER_SPACES: MemberSpace[] = ['tous', 'hote', 'investisseur', 'photographe', 'menage', 'depannage']
type ProKind = 'photographe' | 'menage' | 'depannage'

export interface CockpitProfile { id: string; full_name: string | null; email: string | null; created_at: string; plan: string | null; is_investor: boolean | null }
export interface CockpitPro { user_id: string | null; kind: ProKind; paid: boolean; tier: string | null }

export interface SpaceRecent {
  id: string; name: string; email: string; created_at: string; plan: string
  pros: Array<{ kind: ProKind; paid: boolean; tier: string | null }>
}
export interface SpaceSummary {
  count: number
  newThisMonth: number
  /** Nombre de comptes à la fin de chacun des 12 derniers mois (le dernier = aujourd'hui) */
  growth: Array<{ month: string; total: number }>
  /** Hôtes et tous : formules ; pros : fiches payées ou non ; investisseurs : rien */
  split: Array<{ label: string; count: number }>
  recent: SpaceRecent[]
}

function monthsBack(now: Date, n: number): string[] {
  const cur = parisDay(now.toISOString()).slice(0, 7)
  let [y, m] = cur.split('-').map(Number)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    out.unshift(`${y}-${String(m).padStart(2, '0')}`)
    m--; if (m === 0) { m = 12; y-- }
  }
  return out
}

export function buildMemberSpaces(profiles: CockpitProfile[], pros: CockpitPro[], now: Date): Record<MemberSpace, SpaceSummary> {
  const prosBy = new Map<string, SpaceRecent['pros']>()
  for (const p of pros) {
    if (!p.user_id) continue
    const list = prosBy.get(p.user_id) ?? []
    const same = list.find(x => x.kind === p.kind)
    if (same) same.paid = same.paid || p.paid
    else list.push({ kind: p.kind, paid: p.paid, tier: p.tier })
    prosBy.set(p.user_id, list)
  }
  const spacesOf = (p: CockpitProfile): MemberSpace[] => {
    const kinds = (prosBy.get(p.id) ?? []).map(x => x.kind as MemberSpace)
    const s: MemberSpace[] = ['tous', ...kinds]
    if (p.is_investor) s.push('investisseur')
    if (!kinds.length && !p.is_investor) s.push('hote')
    return s
  }
  const months = monthsBack(now, 12)
  const thisMonth = months[months.length - 1]
  const sorted = [...profiles].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const out = {} as Record<MemberSpace, SpaceSummary>
  for (const space of MEMBER_SPACES) {
    const list = sorted.filter(p => spacesOf(p).includes(space))
    const monthOf = (p: CockpitProfile) => parisDay(p.created_at).slice(0, 7)
    const growth = months.map(month => ({ month, total: list.filter(p => monthOf(p) <= month).length }))
    let split: SpaceSummary['split'] = []
    if (space === 'tous' || space === 'hote') {
      const n = (plan: string) => list.filter(p => (p.plan ?? 'decouverte') === plan).length
      split = [{ label: 'Découverte', count: list.length - n('standard') - n('driing') }, { label: 'Standard', count: n('standard') }, { label: 'Driing', count: n('driing') }]
    } else if (space !== 'investisseur') {
      const paid = list.filter(p => (prosBy.get(p.id) ?? []).some(x => x.kind === space && x.paid)).length
      split = [{ label: 'Fiche payée', count: paid }, { label: 'À payer', count: list.length - paid }]
    }
    out[space] = {
      count: list.length,
      newThisMonth: list.filter(p => monthOf(p) === thisMonth).length,
      growth,
      split,
      recent: list.slice(0, 6).map(p => ({
        id: p.id, name: p.full_name?.trim() || (p.email ?? '').split('@')[0] || 'Sans nom', email: p.email ?? '',
        created_at: p.created_at, plan: p.plan ?? 'decouverte', pros: prosBy.get(p.id) ?? [],
      })),
    }
  }
  return out
}
