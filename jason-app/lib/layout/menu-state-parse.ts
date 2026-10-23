// Lecture défensive de la réponse de la fonction SQL menu_state (testée).
import type { ContractTodoInput } from '@/lib/contracts/todo'
import type { OnboardingAutoFlags } from '@/lib/onboarding/flags'

export interface MenuState {
  notifUnread: number
  chezNousUnread: number
  contracts: ContractTodoInput[]
  onboarding: OnboardingAutoFlags | null
  demandes: { photographer: number; cleaner: number } | null
  actusSeen: { photographer: string | null; cleaner: string | null } | null
}

const FLAGS = ['logement', 'sejour', 'contrat', 'gbp_audit', 'chez_nous_post', 'affiche', 'ical_connected', 'menage_shared'] as const

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)
const str = (v: unknown) => (typeof v === 'string' && v ? v : null)
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null)

export function parseMenuState(raw: unknown): MenuState | null {
  const r = obj(raw)
  if (!r) return null
  const ob = obj(r.onboarding)
  const dem = obj(r.demandes)
  const seen = obj(r.actus_seen)
  return {
    notifUnread: num(r.notif_unread),
    chezNousUnread: num(r.chez_nous_unread),
    contracts: Array.isArray(r.contracts) ? r.contracts.filter(c => obj(c)) as ContractTodoInput[] : [],
    onboarding: ob ? Object.fromEntries(FLAGS.map(k => [k, ob[k] === true])) as OnboardingAutoFlags : null,
    demandes: dem ? { photographer: num(dem.photographer), cleaner: num(dem.cleaner) } : null,
    actusSeen: seen ? { photographer: str(seen.photographer), cleaner: str(seen.cleaner) } : (r.actus_seen === null && 'actus_seen' in r ? { photographer: null, cleaner: null } : null),
  }
}
