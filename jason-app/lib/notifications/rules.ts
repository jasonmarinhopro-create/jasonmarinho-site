// Rules engine : génère des notifications pour un utilisateur donné en
// vérifiant un ensemble de règles métier. Idempotent grâce à dedup_key.
//
// Conçu pour être appelé :
//   - À l'ouverture du dashboard (throttlé à 1×/heure via cache navigateur)
//   - Par un cron Vercel quotidien (Vercel cron → /api/cron/notifications)
//   - Manuellement après une mutation importante (ex: nouveau séjour)
//
// Chaque règle est défensive : elle ne throw jamais, log et continue. Une
// règle cassée ne doit pas empêcher les autres de tourner.

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { createNotification } from './create'

// Schema en `any` explicite (cf. note dans create.ts).
type ServiceClient = SupabaseClient<any, 'public', any>

let _service: ServiceClient | null = null
function svc(): ServiceClient {
  if (_service) return _service
  _service = createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  return _service
}

// ─── Règle 1 : Arrivée demain (J-1) ───────────────────────────────────
async function ruleArriveeDemain(userId: string): Promise<number> {
  const supabase = svc()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(23, 59, 59, 999)

  // Le séjour stocke `logement` (string) et `voyageur_id` (FK). On joint
  // voyageurs pour récupérer prenom/nom.
  const { data: sejours, error } = await supabase
    .from('sejours')
    .select('id, logement, date_arrivee, voyageur_id, voyageurs(prenom, nom)')
    .eq('user_id', userId)
    .is('annule_at', null)
    .gte('date_arrivee', tomorrow.toISOString().split('T')[0])
    .lte('date_arrivee', tomorrowEnd.toISOString().split('T')[0])

  if (error || !sejours) return 0

  // Note typage : Supabase typecase la jointure `voyageurs(...)` comme un
  // tableau (relations 1:N génériques), alors qu'au runtime une FK
  // sejour.voyageur_id → voyageurs.id renvoie un objet unique. On passe par
  // `unknown` puis on normalise défensivement.
  type SejourRow = {
    id: string
    logement: string | null
    date_arrivee: string
    voyageur_id: string | null
    voyageurs: { prenom: string | null; nom: string | null } | Array<{ prenom: string | null; nom: string | null }> | null
  }

  let created = 0
  for (const s of (sejours as unknown as SejourRow[])) {
    const raw = s.voyageurs
    const v = Array.isArray(raw) ? raw[0] ?? null : raw
    const nom = v ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() : 'le voyageur'
    const ok = await createNotification({
      recipientId: userId,
      category: 'sejour',
      type: 'arrivee_demain',
      title: `Arrivée demain — ${nom || 'voyageur'}`,
      body: `${nom || 'Le voyageur'} arrive demain à ${s.logement ?? 'ton logement'}. As-tu envoyé le message de bienvenue avec les infos d'accès ?`,
      ctaLabel: 'Voir le séjour',
      ctaHref: s.voyageur_id ? `/dashboard/voyageurs/${s.voyageur_id}` : '/dashboard/voyageurs',
      severity: 'info',
      metadata: { sejour_id: s.id, voyageur: nom, logement: s.logement },
      dedupKey: `arrivee_demain:sejour_${s.id}`,
      // Expire 2 jours après l'arrivée (devient obsolète)
      expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    })
    if (ok) created++
  }
  return created
}

// ─── Règle 1bis : Départ aujourd'hui (état des lieux + caution) ──────
async function ruleDepartAujourdhui(userId: string): Promise<number> {
  const supabase = svc()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.toISOString().split('T')[0]
  const tomorrowEnd = new Date(today)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const { data: sejours, error } = await supabase
    .from('sejours')
    .select('id, logement, date_depart, voyageur_id, voyageurs(prenom, nom)')
    .eq('user_id', userId)
    .is('annule_at', null)
    .gte('date_depart', todayStart)
    .lte('date_depart', tomorrowEnd.toISOString().split('T')[0])

  if (error || !sejours) return 0

  type SejourRow = {
    id: string
    logement: string | null
    date_depart: string
    voyageur_id: string | null
    voyageurs: { prenom: string | null; nom: string | null } | Array<{ prenom: string | null; nom: string | null }> | null
  }

  let created = 0
  for (const s of (sejours as unknown as SejourRow[])) {
    const raw = s.voyageurs
    const v = Array.isArray(raw) ? raw[0] ?? null : raw
    const nom = v ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() : 'le voyageur'
    const ok = await createNotification({
      recipientId: userId,
      category: 'sejour',
      type: 'depart_aujourdhui',
      title: `Départ aujourd'hui — ${nom || 'voyageur'}`,
      body: `${nom || 'Le voyageur'} part aujourd'hui de ${s.logement ?? 'ton logement'}. Pense à l'état des lieux et à libérer la caution si tout est OK.`,
      ctaLabel: 'Voir le séjour',
      ctaHref: s.voyageur_id ? `/dashboard/voyageurs/${s.voyageur_id}` : '/dashboard/voyageurs',
      severity: 'info',
      metadata: { sejour_id: s.id, voyageur: nom, logement: s.logement },
      dedupKey: `depart_aujourdhui:sejour_${s.id}`,
      // Expire en fin de journée
      expiresAt: new Date(Date.now() + 30 * 3600 * 1000),
    })
    if (ok) created++
  }
  return created
}

// ─── Règle 2 : Approche plafond fiscal micro-BIC ──────────────────────
// Seuils 2025 LCD non classé : 15 000 € (au-delà, sortie du régime).
// Seuils 2025 LCD classé : 77 700 € (micro-BIC général).
// On alerte aux paliers 80 % et 100 %.
async function rulePlafondMicro(userId: string): Promise<number> {
  const supabase = svc()
  const annee = new Date().getFullYear()
  const debut = `${annee}-01-01`
  const fin = `${annee}-12-31`

  // CA encaissé (revenus_entries) sur l'année
  const { data: entries } = await supabase
    .from('revenus_entries')
    .select('montant')
    .eq('user_id', userId)
    .gte('date_paiement', debut)
    .lte('date_paiement', fin)

  const caCumule = (entries ?? []).reduce((sum, e) => sum + (Number(e.montant) || 0), 0)
  if (caCumule === 0) return 0

  // Profil pour savoir si LCD classé ou non
  const { data: profile } = await supabase
    .from('profiles')
    .select('autres_revenus_pro')
    .eq('id', userId)
    .maybeSingle()

  // On part du seuil non-classé conservateur (15k) sauf si CA déjà > 15k
  // (l'utilisateur est forcément classé ou en BIC réel)
  const seuils = [
    { plafond: 15000, label: 'micro-BIC LCD non classé', code: 'micro_15k' },
    { plafond: 23000, label: 'plafond rattachement BIC professionnel', code: 'micro_23k' },
    { plafond: 77700, label: 'micro-BIC général (LCD classé)', code: 'micro_77k' },
  ]

  let created = 0
  for (const s of seuils) {
    if (caCumule < s.plafond * 0.8) continue
    const pct = caCumule >= s.plafond ? 100 : 80
    const dedup = `plafond_${s.code}_${pct}:${annee}`
    const ok = await createNotification({
      recipientId: userId,
      category: 'fiscal',
      type: pct === 100 ? `plafond_${s.code}_atteint` : `plafond_${s.code}_proche`,
      title: pct === 100
        ? `🚨 Plafond ${s.label} atteint`
        : `⚠️ Tu approches du plafond ${s.label}`,
      body: pct === 100
        ? `Ton CA ${annee} (${caCumule.toLocaleString('fr-FR')} €) a atteint le plafond de ${s.plafond.toLocaleString('fr-FR')} €. Tu vas devoir changer de régime fiscal ou te faire classer (selon ton cas).`
        : `Ton CA ${annee} cumulé (${caCumule.toLocaleString('fr-FR')} €) atteint ${Math.round(caCumule / s.plafond * 100)} % du plafond de ${s.plafond.toLocaleString('fr-FR')} €. Anticipe ton changement de régime.`,
      ctaLabel: 'Voir les simulateurs',
      ctaHref: '/dashboard/simulateurs#fiscal',
      severity: pct === 100 ? 'error' : 'warning',
      metadata: { ca_cumule: caCumule, plafond: s.plafond, annee, autres_revenus_pro: profile?.autres_revenus_pro ?? null },
      dedupKey: dedup,
      // Expire au 31 décembre de l'année courante
      expiresAt: new Date(`${annee}-12-31T23:59:59`),
    })
    if (ok) created++
  }
  return created
}

// ─── Règle 3 : Stripe Connect non terminé alors qu'il y a des contrats ───
async function ruleStripeIncomplete(userId: string): Promise<number> {
  const supabase = svc()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return 0
  if (profile.stripe_onboarding_complete) return 0

  // On notifie seulement si l'utilisateur a au moins un contrat avec Stripe activé
  const { count } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('stripe_payment_enabled', true)

  if (!count || count === 0) return 0

  const annee = new Date().getFullYear()
  const ok = await createNotification({
    recipientId: userId,
    category: 'sync',
    type: 'stripe_onboarding_incomplete',
    title: 'Finalise ton onboarding Stripe',
    body: `Tu as ${count} contrat${count > 1 ? 's' : ''} avec paiement Stripe activé, mais ton compte n'est pas finalisé. Tu ne peux pas encore recevoir tes virements.`,
    ctaLabel: 'Finaliser maintenant',
    ctaHref: '/dashboard/encaissements',
    severity: 'warning',
    metadata: { contracts_count: count },
    // Re-notifié 1× par mois si toujours pas fait
    dedupKey: `stripe_onboarding_incomplete:${annee}_${new Date().getMonth() + 1}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  })
  return ok ? 1 : 0
}

// ─── Règle 4 : Synchro iCal — désactivée tant que le tracking last_sync_status
// n'est pas en base. Les colonnes existantes (ical_airbnb / ical_booking / etc.)
// sont juste des URLs, pas un statut. Sera activée quand on ajoutera
// `ical_last_sync_status` + `ical_last_sync_at` aux logements.
async function ruleSyncFailed(_userId: string): Promise<number> {
  return 0
}

// ─── Règle 5 : Nouveau guide publié (à voir) ──────────────────────────
// Notifie si un guide a été publié depuis la dernière fois que l'utilisateur
// a visité /dashboard/guide (champ last_seen_guides_at sur profile).
// Désactivé pour l'instant : nécessite la table `guides` (futur).
async function ruleNouveauGuide(_userId: string): Promise<number> {
  return 0
}

// ─── Orchestrateur ────────────────────────────────────────────────────
export interface RulesRunResult {
  arriveeDemain: number
  departAujourdhui: number
  plafondMicro: number
  stripeIncomplete: number
  syncFailed: number
  nouveauGuide: number
  total: number
  durationMs: number
}

/**
 * Exécute toutes les règles pour un utilisateur. Renvoie le nombre de
 * nouvelles notifications créées par règle (hors dédup). Ne throw jamais :
 * une règle cassée est loggée et ignorée.
 */
export async function runNotificationRules(userId: string): Promise<RulesRunResult> {
  const t0 = Date.now()
  const safe = async (fn: () => Promise<number>, name: string): Promise<number> => {
    try { return await fn() } catch (e) { console.error(`[rules:${name}]`, e); return 0 }
  }
  const [arriveeDemain, departAujourdhui, plafondMicro, stripeIncomplete, syncFailed, nouveauGuide] = await Promise.all([
    safe(() => ruleArriveeDemain(userId), 'arrivee_demain'),
    safe(() => ruleDepartAujourdhui(userId), 'depart_aujourdhui'),
    safe(() => rulePlafondMicro(userId), 'plafond_micro'),
    safe(() => ruleStripeIncomplete(userId), 'stripe_incomplete'),
    safe(() => ruleSyncFailed(userId), 'sync_failed'),
    safe(() => ruleNouveauGuide(userId), 'nouveau_guide'),
  ])
  return {
    arriveeDemain, departAujourdhui, plafondMicro, stripeIncomplete, syncFailed, nouveauGuide,
    total: arriveeDemain + departAujourdhui + plafondMicro + stripeIncomplete + syncFailed + nouveauGuide,
    durationMs: Date.now() - t0,
  }
}

// ─── Auto-purge des notifications expirées ────────────────────────────
export async function purgeExpiredNotifications(): Promise<number> {
  const supabase = svc()
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id')
  if (error) {
    console.error('[purgeExpired]', error)
    return 0
  }
  return data?.length ?? 0
}
