// Règles de la page « État de santé » de l'admin (05/10/2026, idée validée
// par Jason : « tout au même endroit au lieu de lancer des workflows »).
// Pures et testées : le chargement est dans health-load.ts.

export type HealthLevel = 'ok' | 'warn' | 'alert' | 'unknown'

export interface HealthItem {
  label: string
  detail?: string
  href?: string
  level?: HealthLevel
}

export interface HealthCheck {
  key: string
  title: string
  level: HealthLevel
  /** Une phrase : ce qui se passe */
  summary: string
  items: HealthItem[]
  /** Ce qu'il faut faire, quand ce n'est pas évident */
  advice?: string
  action?: { href: string; label: string; external?: boolean }
}

const RANK: Record<HealthLevel, number> = { ok: 0, unknown: 1, warn: 2, alert: 3 }

export function worst(levels: HealthLevel[]): HealthLevel {
  return levels.reduce<HealthLevel>((w, l) => (RANK[l] > RANK[w] ? l : w), 'ok')
}

export function overallSummary(checks: HealthCheck[]): { level: HealthLevel; alerts: number; warns: number; text: string } {
  const alerts = checks.filter(c => c.level === 'alert').length
  const warns = checks.filter(c => c.level === 'warn').length
  const level = worst(checks.map(c => c.level))
  const text = alerts > 0
    ? `${alerts} point${alerts > 1 ? 's' : ''} à régler${warns ? `, ${warns} à surveiller` : ''}`
    : warns > 0
      ? `${warns} point${warns > 1 ? 's' : ''} à surveiller`
      : 'Tout va bien'
  return { level, alerts, warns, text }
}

// ── Comptes Stripe des hôtes ─────────────────────────────────────────────

export interface StripeAccountInfo {
  id: string
  mcc: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  currentlyDue: number
  pastDue: number
  disabledReason: string | null
  feesPayer: string | null
  detailsSubmitted: boolean
}

/** Code d'activité attendu : hébergement (hôtels, locations de vacances). */
export const EXPECTED_MCC = '7011'

export function stripeAccountIssues(a: StripeAccountInfo): { level: HealthLevel; issues: string[] } {
  const issues: string[] = []
  let level: HealthLevel = 'ok'
  const bump = (l: HealthLevel) => { level = worst([level, l]) }
  if (!a.detailsSubmitted) { issues.push('inscription Stripe pas terminée'); bump('warn') }
  if (a.detailsSubmitted && !a.chargesEnabled) { issues.push('paiements bloqués par Stripe'); bump('alert') }
  if (a.detailsSubmitted && !a.payoutsEnabled) { issues.push('virements bloqués par Stripe'); bump('alert') }
  if (a.pastDue > 0) { issues.push(`${a.pastDue} information${a.pastDue > 1 ? 's' : ''} en retard demandée${a.pastDue > 1 ? 's' : ''} par Stripe`); bump('alert') }
  else if (a.currentlyDue > 0) { issues.push(`${a.currentlyDue} information${a.currentlyDue > 1 ? 's' : ''} demandée${a.currentlyDue > 1 ? 's' : ''} par Stripe`); bump('warn') }
  if (a.disabledReason) { issues.push(`motif Stripe : ${a.disabledReason}`); bump('alert') }
  if (a.mcc && a.mcc !== EXPECTED_MCC) { issues.push(`code d'activité ${a.mcc} au lieu de ${EXPECTED_MCC} (hébergement)`); bump('warn') }
  if (a.feesPayer && a.feesPayer !== 'application') { issues.push(`frais payés par « ${a.feesPayer} »`); bump('warn') }
  return { level, issues }
}

// ── Migrations à coller dans Supabase ────────────────────────────────────

export interface MigrationProbe {
  file: string
  /** Ce que la migration apporte, en clair */
  what: string
  table: string
  column: string
}

/** Migrations récentes à vérifier : une table ou une colonne qu'elles créent. */
export const MIGRATION_PROBES: MigrationProbe[] = [
  { file: '20261004_122_pro_devis.sql', what: 'devis des photographes et équipes de ménage', table: 'pro_documents', column: 'id' },
  { file: '20261001_121', what: 'modèles de messages en anglais et portugais', table: 'user_template_customizations', column: 'content_en' },
  { file: '20260930_119', what: 'notifications sur le téléphone', table: 'push_subscriptions', column: 'id' },
  { file: '20260929_118', what: 'contrat détaillé (état descriptif, clauses)', table: 'contracts', column: 'details' },
  { file: '20260929_117', what: 'taux d\'ouverture de la prospection', table: 'outreach_open_stats', column: 'sequence_id' },
  { file: '20260929_116', what: 'étiquettes et rappels de la prospection', table: 'outreach_contacts', column: 'tags' },
  { file: '20260929_115', what: 'prospection par e-mail', table: 'outreach_contacts', column: 'id' },
  { file: '20260928_113', what: 'signalements avec e-mail et téléphone', table: 'reported_guests', column: 'extra_identifiers' },
  { file: '20260928_112', what: 'objectif par logement', table: 'logements', column: 'objectif_ca_annuel' },
  { file: '20260927_107', what: 'état des synchros iCal', table: 'ical_feeds', column: 'consecutive_failures' },
]

/** Codes renvoyés par Supabase quand une table ou une colonne n'existe pas. */
export function isMissingRelation(code: string | null | undefined): boolean {
  return code === '42P01' || code === '42703' || code === 'PGRST204' || code === 'PGRST205'
}

// ── Tâches automatiques (workflows GitHub) ───────────────────────────────

export interface WorkflowRun {
  path: string
  status: string
  conclusion: string | null
  createdAt: string
}

export interface WatchedWorkflow {
  path: string
  label: string
  /** Au-delà, la tâche est considérée comme arrêtée */
  maxAgeHours: number
  /** Seulement les jours ouvrés (prospection) */
  weekdaysOnly?: boolean
}

export const WATCHED_WORKFLOWS: WatchedWorkflow[] = [
  { path: '.github/workflows/sauvegarde.yml', label: 'Sauvegarde de la base', maxAgeHours: 30 },
  { path: '.github/workflows/check-indexation.yml', label: 'Indexation Google', maxAgeHours: 30 },
  { path: '.github/workflows/process-actualites.yml', label: 'Publication des actualités', maxAgeHours: 50 },
  { path: '.github/workflows/prospection-envois.yml', label: 'Envois de la prospection', maxAgeHours: 26, weekdaysOnly: true },
]

export function workflowHealth(w: WatchedWorkflow, runs: WorkflowRun[], now: Date): HealthItem {
  const mine = runs.filter(r => r.path === w.path).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const last = mine.find(r => r.status === 'completed')
  if (!last) return { label: w.label, detail: 'aucun passage récent', level: 'warn' }
  const ageH = (now.getTime() - new Date(last.createdAt).getTime()) / 3_600_000
  const when = ageH < 1 ? 'il y a moins d\'une heure' : ageH < 48 ? `il y a ${Math.round(ageH)} h` : `il y a ${Math.round(ageH / 24)} jours`
  if (last.conclusion !== 'success') return { label: w.label, detail: `dernier passage en échec (${when})`, level: 'alert' }
  // Le lundi matin, la prospection n'a pas tourné depuis vendredi : normal.
  const day = now.getUTCDay()
  const allowance = w.weekdaysOnly && (day === 0 || day === 6 || (day === 1 && now.getUTCHours() < 12)) ? 72 : 0
  if (ageH > w.maxAgeHours + allowance) return { label: w.label, detail: `pas de passage depuis ${when.replace('il y a ', '')}`, level: 'warn' }
  return { label: w.label, detail: `réussi ${when}`, level: 'ok' }
}

// ── Configuration (variables d'environnement) ────────────────────────────

export interface EnvRequirement {
  keys: string[]
  label: string
  /** Sans elle, une fonction importante est coupée */
  critical: boolean
}

export const ENV_REQUIREMENTS: EnvRequirement[] = [
  { keys: ['RESEND_API_KEY'], label: 'E-mails de l\'app (Resend)', critical: true },
  { keys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'], label: 'Stripe (abonnements)', critical: true },
  { keys: ['STRIPE_CONNECT_WEBHOOK_SECRET'], label: 'Stripe (paiements des hôtes, webhook Comptes connectés)', critical: true },
  { keys: ['VAPID_PRIVATE_KEY'], label: 'Notifications sur le téléphone', critical: false },
  { keys: ['OUTREACH_SMTP_HOST', 'OUTREACH_SMTP_USER', 'OUTREACH_SMTP_PASS'], label: 'Boîte de prospection', critical: false },
  { keys: ['GOOGLE_PLACES_API_KEY'], label: 'Audit express Google (Places API)', critical: false },
  { keys: ['VERCEL_DEPLOY_HOOK_URL'], label: 'Mise en ligne des fiches pros', critical: true },
  { keys: ['AFFILAE_API_KEY'], label: 'Ventes Affilae', critical: false },
]

export function envHealth(env: Record<string, string | undefined>): HealthItem[] {
  return ENV_REQUIREMENTS.map(r => {
    const missing = r.keys.filter(k => !env[k])
    // Upstash : deux jeux de noms possibles, traité à part.
    if (missing.length === 0) return { label: r.label, detail: 'configurée', level: 'ok' as const }
    return {
      label: r.label,
      detail: `manque ${missing.join(', ')}`,
      level: r.critical ? 'alert' as const : 'warn' as const,
    }
  })
}
