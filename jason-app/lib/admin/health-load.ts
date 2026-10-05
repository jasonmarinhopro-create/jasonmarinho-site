// Chargement de la page « État de santé » de l'admin (05/10/2026). Appelée
// après vérification du rôle admin : service role pour lire toutes les
// lignes. Chaque bloc est indépendant : une source en panne (Stripe, GitHub)
// donne un bloc « indisponible », jamais une page en erreur.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/client'
import { depositActBefore, parisToday } from '@/lib/stripe/deposit-window'
import {
  type HealthCheck, type HealthItem, type HealthLevel, type StripeAccountInfo, type WorkflowRun,
  MIGRATION_PROBES, WATCHED_WORKFLOWS, envHealth, isMissingRelation, stripeAccountIssues, workflowHealth, worst,
} from './health'

const REPO = 'jasonmarinhopro-create/jasonmarinho-site'
const fmt = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const memberHref = (userId: string) => `/dashboard/admin/membres/${userId}`
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

function unavailable(key: string, title: string, err: unknown): HealthCheck {
  return { key, title, level: 'unknown', summary: `Lecture impossible : ${String((err as Error)?.message ?? err).slice(0, 140)}`, items: [] }
}

// ── Paiements et cautions ────────────────────────────────────────────────

async function paymentsCheck(): Promise<HealthCheck[]> {
  const db = getServiceClient()
  const today = parisToday()
  const since = new Date(Date.now() - 21 * 86400_000).toISOString().slice(0, 10)
  const [loyers, cautions] = await Promise.all([
    db.from('contracts')
      .select('id, user_id, logement_nom, date_arrivee, stripe_payment_status, statut')
      .in('stripe_payment_status', ['pending', 'failed'])
      .not('stripe_payment_checkout_id', 'is', null)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: true })
      .limit(200),
    db.from('contracts')
      .select('id, user_id, logement_nom, date_arrivee, date_depart, stripe_deposit_status, statut')
      .in('stripe_deposit_status', ['held', 'expired'])
      .gte('date_depart', since)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: true })
      .limit(200),
  ])
  const out: HealthCheck[] = []

  if (loyers.error) out.push(unavailable('loyers', 'Loyers payés en ligne', loyers.error))
  else {
    const rows = loyers.data ?? []
    const failed = rows.filter(r => r.stripe_payment_status === 'failed')
    const late = rows.filter(r => r.stripe_payment_status === 'pending' && r.date_arrivee <= today)
    const waiting = rows.filter(r => r.stripe_payment_status === 'pending' && r.date_arrivee > today)
    const items: HealthItem[] = [
      ...failed.map(r => ({ label: r.logement_nom || 'Logement', detail: `paiement refusé · arrivée ${fmt(r.date_arrivee)}`, href: memberHref(r.user_id), level: 'warn' as const })),
      ...late.map(r => ({ label: r.logement_nom || 'Logement', detail: `pas payé, séjour commencé le ${fmt(r.date_arrivee)}`, href: memberHref(r.user_id), level: 'warn' as const })),
    ]
    out.push({
      key: 'loyers',
      title: 'Loyers payés en ligne',
      level: items.length ? 'warn' : 'ok',
      summary: items.length
        ? `${plural(items.length, 'loyer')} à regarder · ${plural(waiting.length, 'paiement')} commencé${waiting.length > 1 ? 's' : ''} pour un séjour à venir`
        : `Rien d'anormal · ${plural(waiting.length, 'paiement')} commencé${waiting.length > 1 ? 's' : ''} pour un séjour à venir (vérifiés chez Stripe chaque nuit)`,
      items,
      advice: items.length ? 'Un paiement « commencé » est vérifié chez Stripe chaque nuit et à l\'ouverture du contrat. S\'il reste ici, l\'hôte a été payé autrement ou le voyageur n\'a pas payé : à voir avec l\'hôte.' : undefined,
    })
  }

  if (cautions.error) out.push(unavailable('cautions', 'Cautions bloquées', cautions.error))
  else {
    const rows = cautions.data ?? []
    const held = rows.filter(r => r.stripe_deposit_status === 'held')
    const overdue = held.filter(r => depositActBefore(r.date_arrivee) < today)
    const soon = held.filter(r => depositActBefore(r.date_arrivee) === today)
    const expired = rows.filter(r => r.stripe_deposit_status === 'expired')
    const items: HealthItem[] = [
      ...overdue.map(r => ({ label: r.logement_nom || 'Logement', detail: `blocage probablement tombé (décision attendue avant le ${fmt(depositActBefore(r.date_arrivee))})`, href: memberHref(r.user_id), level: 'alert' as const })),
      ...soon.map(r => ({ label: r.logement_nom || 'Logement', detail: 'dernier jour pour libérer ou retenir', href: memberHref(r.user_id), level: 'warn' as const })),
      ...expired.map(r => ({ label: r.logement_nom || 'Logement', detail: `blocage tombé (séjour du ${fmt(r.date_arrivee)} au ${fmt(r.date_depart)})`, href: memberHref(r.user_id), level: 'warn' as const })),
    ]
    out.push({
      key: 'cautions',
      title: 'Cautions bloquées',
      level: worst(items.map(i => i.level ?? 'ok')),
      summary: items.length
        ? `${plural(items.length, 'caution')} à regarder · ${held.length} bloquée${held.length > 1 ? 's' : ''} en ce moment`
        : `${held.length} caution${held.length > 1 ? 's' : ''} bloquée${held.length > 1 ? 's' : ''} en ce moment, toutes dans les temps`,
      items,
      advice: items.length ? 'Une carte reste bloquée environ 7 jours. L\'hôte libère ou retient depuis Contrats & paiements → Cautions ; une caution tombée peut être redemandée jusqu\'au départ.' : undefined,
    })
  }
  return out
}

// ── Comptes Stripe des hôtes ─────────────────────────────────────────────

interface StripeSnapshot {
  accounts: Array<StripeAccountInfo & { userId: string; name: string }>
  errors: Array<{ userId: string; name: string; message: string }>
  webhooks: Array<{ enabled: boolean; events: number; url: string }> | null
  fees30: number | null
}

const loadStripeSnapshot = unstable_cache(async (): Promise<StripeSnapshot> => {
  const db = getServiceClient()
  const { data: hosts } = await db.from('profiles').select('id, full_name, stripe_account_id').not('stripe_account_id', 'is', null).limit(100)
  const accounts: StripeSnapshot['accounts'] = []
  const errors: StripeSnapshot['errors'] = []
  await Promise.all((hosts ?? []).map(async h => {
    const name = (h.full_name as string | null)?.trim() || 'Compte sans nom'
    try {
      const a = await stripe.accounts.retrieve(h.stripe_account_id as string)
      accounts.push({
        userId: h.id, name, id: a.id,
        mcc: a.business_profile?.mcc ?? null,
        chargesEnabled: a.charges_enabled, payoutsEnabled: a.payouts_enabled,
        detailsSubmitted: a.details_submitted,
        currentlyDue: a.requirements?.currently_due?.length ?? 0,
        pastDue: a.requirements?.past_due?.length ?? 0,
        disabledReason: a.requirements?.disabled_reason ?? null,
        feesPayer: a.controller?.fees?.payer ?? null,
      })
    } catch (e) {
      errors.push({ userId: h.id, name, message: (e as Error).message.slice(0, 120) })
    }
  }))
  let webhooks: StripeSnapshot['webhooks'] = null
  try {
    const list = await stripe.webhookEndpoints.list({ limit: 20 })
    webhooks = list.data.map(w => ({ enabled: w.status === 'enabled', events: w.enabled_events.length, url: w.url.replace(/^https?:\/\//, '') }))
  } catch { /* lecture facultative */ }
  let fees30: number | null = null
  try {
    const since = Math.floor(Date.now() / 1000) - 30 * 86400
    const page = await stripe.applicationFees.list({ created: { gte: since }, limit: 100 })
    fees30 = page.data.length
  } catch { /* lecture facultative */ }
  accounts.sort((a, b) => a.name.localeCompare(b.name))
  return { accounts, errors, webhooks, fees30 }
}, ['admin-health-stripe-v1'], { revalidate: 600 })

async function stripeCheck(): Promise<HealthCheck> {
  let snap: StripeSnapshot
  try { snap = await loadStripeSnapshot() } catch (e) { return unavailable('stripe', 'Comptes Stripe des hôtes', e) }
  const items: HealthItem[] = []
  for (const a of snap.accounts) {
    const { level, issues } = stripeAccountIssues(a)
    items.push({ label: a.name, detail: issues.length ? issues.join(' · ') : `prêt (…${a.id.slice(-4)})`, href: memberHref(a.userId), level })
  }
  for (const e of snap.errors) items.push({ label: e.name, detail: `compte illisible : ${e.message}`, href: memberHref(e.userId), level: 'warn' })
  if (snap.webhooks) {
    const off = snap.webhooks.filter(w => !w.enabled)
    items.push({
      label: 'Webhooks Stripe',
      detail: off.length ? `${off.length} désactivé${off.length > 1 ? 's' : ''} par Stripe (${off.map(w => w.url).join(', ')})` : `${snap.webhooks.length} actif${snap.webhooks.length > 1 ? 's' : ''}`,
      level: off.length ? 'alert' : 'ok',
    })
  }
  const bad = items.filter(i => i.level && i.level !== 'ok')
  return {
    key: 'stripe',
    title: 'Comptes Stripe des hôtes',
    level: worst(items.map(i => i.level ?? 'ok')),
    summary: `${plural(snap.accounts.length, 'compte')} relié${snap.accounts.length > 1 ? 's' : ''}${bad.length ? ` · ${plural(bad.length, 'point')} à régler` : ', tous prêts'}${snap.fees30 != null ? ` · ${plural(snap.fees30, 'commission')} sur 30 jours` : ''}`,
    items,
    advice: bad.some(i => i.detail?.includes('code d\'activité'))
      ? 'Code d\'activité : se change dans Stripe (Connect → Comptes → le compte → Profil d\'entreprise) ou en écrivant au support Stripe. 7011 = hébergement, utile pour l\'autorisation étendue des cautions.'
      : undefined,
    action: { href: 'https://dashboard.stripe.com/connect/accounts/overview', label: 'Ouvrir Stripe Connect', external: true },
  }
}

// ── Calendriers iCal ─────────────────────────────────────────────────────

async function icalCheck(): Promise<HealthCheck> {
  const db = getServiceClient()
  const [failing, total] = await Promise.all([
    db.from('ical_feeds').select('id, user_id, name, consecutive_failures, last_sync_error_at').gte('consecutive_failures', 3).order('consecutive_failures', { ascending: false }).limit(50),
    db.from('ical_feeds').select('id', { count: 'exact', head: true }),
  ])
  if (failing.error) {
    if (isMissingRelation(failing.error.code)) return { key: 'ical', title: 'Calendriers Airbnb / Booking', level: 'unknown', summary: 'Suivi des échecs indisponible (migration 107 absente).', items: [] }
    return unavailable('ical', 'Calendriers Airbnb / Booking', failing.error)
  }
  const rows = failing.data ?? []
  return {
    key: 'ical',
    title: 'Calendriers Airbnb / Booking',
    level: rows.length ? 'warn' : 'ok',
    summary: rows.length
      ? `${plural(rows.length, 'calendrier')} en échec sur ${total.count ?? '?'} (l'hôte est prévenu par notification)`
      : `${total.count ?? '?'} calendriers reliés, synchros sans échec répété`,
    items: rows.map(r => ({
      label: r.name || 'Calendrier',
      detail: `${r.consecutive_failures} échecs de suite${r.last_sync_error_at ? `, dernier le ${fmt(r.last_sync_error_at)}` : ''}`,
      href: memberHref(r.user_id),
      level: 'warn' as const,
    })),
    advice: rows.length ? 'Souvent un lien iCal régénéré ou une annonce supprimée sur la plateforme : l\'hôte doit recoller le nouveau lien dans la fiche du logement.' : undefined,
  }
}

// ── E-mails et erreurs ───────────────────────────────────────────────────

async function emailsCheck(): Promise<HealthCheck[]> {
  const db = getServiceClient()
  const week = new Date(Date.now() - 7 * 86400_000).toISOString()
  const day = new Date(Date.now() - 86400_000).toISOString()
  const [mailErrors, outreachErr, bounces, errors24] = await Promise.all([
    db.from('app_errors').select('route, message, created_at').gte('created_at', week).or('route.ilike.email*,message.ilike.*resend*').order('created_at', { ascending: false }).limit(200),
    db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'erreur').gte('sent_at', week),
    db.from('outreach_suppressions').select('email_norm', { count: 'exact', head: true }).eq('reason', 'rebond').gte('created_at', week),
    db.from('app_errors').select('id', { count: 'exact', head: true }).gte('created_at', day),
  ])
  const out: HealthCheck[] = []

  if (mailErrors.error) out.push(unavailable('emails', 'E-mails', mailErrors.error))
  else {
    const groups = new Map<string, { n: number; last: string }>()
    for (const r of mailErrors.data ?? []) {
      const k = `${r.route} : ${String(r.message).slice(0, 90)}`
      const g = groups.get(k)
      if (g) g.n++
      else groups.set(k, { n: 1, last: r.created_at })
    }
    const items: HealthItem[] = Array.from(groups.entries()).slice(0, 8).map(([k, g]) => ({ label: k, detail: `${g.n} fois, dernière le ${fmt(g.last)}`, level: 'warn' as const }))
    const oErr = outreachErr.count ?? 0
    const oBounce = bounces.count ?? 0
    if (!outreachErr.error && oErr > 0) items.push({ label: 'Prospection', detail: `${plural(oErr, 'envoi')} en erreur sur 7 jours`, href: '/dashboard/admin/prospection', level: oErr > 5 ? 'warn' : 'ok' })
    if (!bounces.error && oBounce > 0) items.push({ label: 'Prospection', detail: `${plural(oBounce, 'adresse')} en rebond sur 7 jours (retirées automatiquement)`, href: '/dashboard/admin/prospection', level: oBounce > 10 ? 'warn' : 'ok' })
    const appMail = groups.size
    out.push({
      key: 'emails',
      title: 'E-mails',
      level: worst(items.map(i => i.level ?? 'ok')),
      summary: appMail ? `${plural(appMail, 'erreur')} d'envoi de l'app sur 7 jours` : 'Aucune erreur d\'envoi de l\'app sur 7 jours',
      items,
    })
  }

  const n24 = errors24.count ?? 0
  out.push({
    key: 'erreurs',
    title: 'Erreurs de l\'app',
    level: errors24.error ? 'unknown' : n24 > 30 ? 'warn' : 'ok',
    summary: errors24.error ? 'Lecture impossible' : n24 ? `${plural(n24, 'erreur')} remontée${n24 > 1 ? 's' : ''} sur 24 h` : 'Aucune erreur remontée sur 24 h',
    items: [],
    action: { href: '/dashboard/admin#erreurs', label: 'Voir les erreurs' },
  })
  return out
}

// ── Tâches automatiques ──────────────────────────────────────────────────

async function workflowsCheck(): Promise<HealthCheck> {
  try {
    // Une requête par tâche (5 derniers passages sur main), gardée 15 min en
    // cache : l'API GitHub sans jeton accepte 60 appels par heure.
    const lists = await Promise.all(WATCHED_WORKFLOWS.map(async w => {
      const file = w.path.split('/').pop()
      const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${file}/runs?per_page=5&branch=main`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'jasonmarinho-admin' },
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(6000),
      })
      if (r.status === 404) return [] as WorkflowRun[]
      if (!r.ok) throw new Error(`GitHub ${r.status}`)
      const json = await r.json() as { workflow_runs?: Array<{ path: string; status: string; conclusion: string | null; created_at: string }> }
      return (json.workflow_runs ?? []).map(x => ({ path: w.path, status: x.status, conclusion: x.conclusion, createdAt: x.created_at }))
    }))
    const runs = lists.flat()
    const now = new Date()
    const items = WATCHED_WORKFLOWS.map(w => ({ ...workflowHealth(w, runs, now), href: `https://github.com/${REPO}/actions/workflows/${w.path.split('/').pop()}` }))
    const level = worst(items.map(i => i.level ?? 'ok'))
    return {
      key: 'taches',
      title: 'Tâches automatiques',
      level,
      summary: level === 'ok' ? 'Sauvegarde, indexation, actualités et prospection tournent' : 'Une tâche automatique ne tourne plus comme prévu',
      items,
      advice: items.find(i => i.label === 'Sauvegarde de la base' && i.level !== 'ok')
        ? 'Sauvegarde : vérifier que le secret BACKUP_PASSPHRASE existe dans GitHub (Settings → Secrets and variables → Actions).'
        : undefined,
      action: { href: `https://github.com/${REPO}/actions`, label: 'Ouvrir GitHub Actions', external: true },
    }
  } catch (e) {
    return unavailable('taches', 'Tâches automatiques', e)
  }
}

// ── Migrations ───────────────────────────────────────────────────────────

async function migrationsCheck(): Promise<HealthCheck> {
  const db = getServiceClient()
  const results = await Promise.all(MIGRATION_PROBES.map(async p => {
    const { error } = await db.from(p.table).select(p.column).limit(1)
    return { p, missing: !!error && isMissingRelation(error.code), error: error && !isMissingRelation(error.code) ? error.message : null }
  }))
  const missing = results.filter(r => r.missing)
  const items: HealthItem[] = missing.map(r => ({ label: r.p.file, detail: r.p.what, level: 'warn' as const }))
  for (const r of results.filter(x => x.error)) items.push({ label: r.p.file, detail: `vérification impossible : ${r.error!.slice(0, 80)}`, level: 'unknown' })
  return {
    key: 'migrations',
    title: 'Migrations de la base',
    level: missing.length ? 'warn' : 'ok',
    summary: missing.length
      ? `${plural(missing.length, 'migration')} à coller dans l'éditeur SQL de Supabase`
      : `Les ${MIGRATION_PROBES.length} dernières migrations sont appliquées`,
    items,
    advice: missing.length ? 'Fichiers dans jason-app/supabase/migrations/ : copier le contenu dans Supabase → SQL Editor → Run. Sans elles, l\'app fonctionne mais la fonction concernée reste masquée.' : undefined,
    action: { href: 'https://supabase.com/dashboard/project/_/sql/new', label: 'Ouvrir l\'éditeur SQL', external: true },
  }
}

// ── Configuration ────────────────────────────────────────────────────────

function configCheck(): HealthCheck {
  const items = envHealth(process.env)
  const upstash = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL)
  items.push({ label: 'Limiteur de tentatives (Upstash)', detail: upstash ? 'configuré' : 'absent : limite en mémoire seulement', level: upstash ? 'ok' : 'warn' })
  items.push({
    label: 'Autorisation étendue des cautions',
    detail: process.env.STRIPE_EXTENDED_AUTH === '1' ? 'activée (STRIPE_EXTENDED_AUTH=1)' : 'désactivée, en attente de la réponse de Stripe',
    level: 'ok',
  })
  const level: HealthLevel = worst(items.map(i => i.level ?? 'ok'))
  const okCount = items.filter(i => i.level === 'ok').length
  return {
    key: 'config',
    title: 'Configuration',
    level,
    summary: level === 'ok'
      ? `Toutes les clés nécessaires sont en place (${okCount} réglages vérifiés)`
      : `Une clé manque dans Vercel · ${okCount} réglages en place`,
    // Seulement ce qui manque, plus l'état de l'autorisation étendue (en attente de Stripe)
    items: items.filter(i => i.level !== 'ok' || i.label.startsWith('Autorisation étendue')),
    advice: level !== 'ok' ? 'Les clés se règlent dans Vercel → projet jasonmarinho-dashboard → Settings → Environment Variables, puis redéployer.' : undefined,
  }
}

export async function loadHealth(): Promise<HealthCheck[]> {
  const guard = <T,>(key: string, title: string, p: Promise<T>) => p.catch(e => unavailable(key, title, e) as unknown as T)
  const [payments, stripeC, ical, emails, workflows, migrations] = await Promise.all([
    guard('paiements', 'Paiements', paymentsCheck()),
    guard('stripe', 'Comptes Stripe des hôtes', stripeCheck()),
    guard('ical', 'Calendriers Airbnb / Booking', icalCheck()),
    guard('emails', 'E-mails', emailsCheck()),
    guard('taches', 'Tâches automatiques', workflowsCheck()),
    guard('migrations', 'Migrations de la base', migrationsCheck()),
  ])
  const flat = (x: HealthCheck | HealthCheck[]) => (Array.isArray(x) ? x : [x])
  return [...flat(payments), stripeC, ...flat(ical), ...flat(emails), workflows, migrations, configCheck()]
}
