// Types et styles partagés de la page Admin → Prospection.

import type { Audience, Source, Stage } from '@/lib/outreach/engine'
import { AMBER, BROWN, PINK, tint } from '../_ui/theme'

export interface StepRow { id: string; position: number; delay_days: number; subject: string; body: string; same_thread: boolean }
export interface SequenceRow {
  id: string
  nom: string
  audience: Audience
  description: string | null
  trigger: 'manuel' | 'nouveau_contact' | 'etape'
  trigger_stage: Stage | null
  enabled: boolean
  stop_on_reply: boolean
  repeat_after_days: number | null
  max_repeats: number
  then_sequence_id: string | null
  end_stage: Stage | null
  position: number
  steps: StepRow[]
  counts: { en_cours: number; terminee: number; arretee: number }
  /** Personnes en cours dont le prochain e-mail est l'étape i */
  atStep: number[]
}
export interface ContactRow {
  id: string
  audience: Audience
  email: string | null
  prenom: string | null
  nom: string | null
  entreprise: string | null
  ville: string | null
  departement: string | null
  site_web: string | null
  telephone: string | null
  instagram: string | null
  source: Source
  source_detail: string | null
  stage: Stage
  notes: string | null
  last_contacted_at: string | null
  replied_at: string | null
  created_at: string
  active_sequence_id: string | null
}
export interface Stats { sentToday: number; sent7: number; sent30: number; errors7: number; replies30: number; contacted30: number }
export interface SettingsRow { daily_cap: number; send_days: number[]; paused: boolean; signature: string | null; last_run_at: string | null; last_run_summary: string | null }
export interface MailConfig { configured: boolean; from: string | null; placesKey: boolean }

export const STAGE_COLOR: Record<Stage, string> = {
  a_trouver: 'var(--text-3)',
  a_contacter: BROWN,
  contacte: AMBER,
  a_repondu: PINK,
  interesse: PINK,
  inscrit: 'var(--accent-text)',
  client: 'var(--accent-text)',
  pas_interesse: 'var(--text-3)',
  desinscrit: 'var(--text-3)',
  invalide: 'var(--danger)',
}

export const TRIGGER_LABEL = {
  manuel: 'Ajout manuel',
  nouveau_contact: 'Automatique : chaque contact « À contacter »',
  etape: 'Arrivée à une étape du pipeline',
} as const

export function displayName(c: Pick<ContactRow, 'prenom' | 'nom' | 'entreprise' | 'email'>): string {
  return c.entreprise || c.nom || [c.prenom].filter(Boolean).join(' ') || c.email || 'Sans nom'
}

export function fmtDay(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
}

export const ui: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '18px 20px', minWidth: 0 },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.25 },
  sub: { fontSize: '12.5px', color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  label: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', minWidth: 0 },
  input: { width: '100%', padding: '9px 11px', fontSize: '14px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '11px 13px', fontSize: '14px', lineHeight: 1.55, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '11px', border: 'none', background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 13px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' },
  btnSoft: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${tint('var(--danger)', 35)}`, background: tint('var(--danger)', 8), color: 'var(--danger)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', whiteSpace: 'nowrap' },
  notice: { display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: tint(AMBER, 10), border: `1px solid ${tint(AMBER, 30)}`, color: 'var(--text-2)', fontSize: '13px', lineHeight: 1.55 },
}

export function stagePill(stage: Stage): React.CSSProperties {
  const c = STAGE_COLOR[stage]
  return { ...ui.pill, color: c, borderColor: tint(c, 35), background: tint(c, 10) }
}
