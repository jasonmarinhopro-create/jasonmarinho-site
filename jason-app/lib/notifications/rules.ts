// Règles de rappel (SERVER ONLY) : génèrent les notifications d'un hôte à
// partir de ses données. Idempotentes grâce à dedup_key.
//
// Appelées par le cron quotidien (/api/cron/notifications-engine, 7 h UTC),
// à l'ouverture de la cloche (au plus toutes les 15 min) et par la page
// Notifications. Chaque règle est défensive : une règle cassée est journalisée
// et n'empêche pas les autres de tourner.
//
// Refonte 29/09/2026 : dates à l'heure de Paris (avant : UTC du serveur),
// réservations Airbnb / Booking comprises, départ signalé seulement quand une
// caution attend une décision (le ménage est dans le planning), contrat pas
// encore signé à 7 jours de l'arrivée, plafonds fiscaux calculés sur les mêmes
// recettes que Mes finances (avant : seulement les saisies manuelles), plus
// d'emoji ni de tiret cadratin, liens vers les bonnes pages.
import 'server-only'
import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday, addDaysIso } from '@/lib/stripe/deposit-window'
import { icalReservationsForDisplay } from '@/lib/ical/display'
import { buildRevenueLines, totaux, normName } from '@/lib/finances/engine'
import { fiscalCategory } from '@/lib/finances/fiscal'
import { createNotification } from './create'
import { shortDate, stayLabel } from './present'

const svc = getServiceClient

type VoyageurJoin = { prenom: string | null; nom: string | null } | Array<{ prenom: string | null; nom: string | null }> | null
function guestName(v: VoyageurJoin): string {
  const one = Array.isArray(v) ? v[0] ?? null : v
  return one ? `${one.prenom ?? ''} ${one.nom ?? ''}`.trim() : ''
}
const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`
const endOfDay = (iso: string) => new Date(`${iso}T23:59:59+02:00`)

// ─── Arrivée demain (séjours saisis + réservations Airbnb / Booking) ─────
async function ruleArriveeDemain(userId: string, today: string): Promise<number> {
  const db = svc()
  const tomorrow = addDaysIso(today, 1)
  const [{ data: sejours }, { data: logements }, { data: feeds }, { data: events }] = await Promise.all([
    db.from('sejours')
      .select('id, logement, date_arrivee, date_depart, voyageur_id, voyageurs(prenom, nom)')
      .eq('user_id', userId).is('annule_at', null).eq('date_arrivee', tomorrow),
    db.from('logements').select('nom, ical_airbnb, ical_booking, ical_vrbo, ical_autre').eq('user_id', userId),
    db.from('ical_feeds').select('id, url, name').eq('user_id', userId),
    db.from('ical_events').select('id, feed_id, title, description, start_date, end_date').eq('user_id', userId).eq('start_date', tomorrow),
  ])

  let created = 0
  const covered = new Set<string>()
  for (const s of (sejours ?? []) as Array<{ id: string; logement: string | null; date_arrivee: string; date_depart: string | null; voyageur_id: string | null; voyageurs: VoyageurJoin }>) {
    covered.add(normName(s.logement))
    const nom = guestName(s.voyageurs) || 'Ton voyageur'
    if (await createNotification({
      recipientId: userId, category: 'sejour', type: 'arrivee_demain',
      title: `Arrivée demain : ${nom}`,
      body: `${s.logement ?? 'Ton logement'}${s.date_depart ? `, ${stayLabel(s.date_arrivee, s.date_depart)}` : ''}. Pense à envoyer les infos d'accès et le lien de check-in.`,
      ctaLabel: 'Voir la fiche voyageur',
      ctaHref: s.voyageur_id ? `/dashboard/voyageurs/${s.voyageur_id}` : '/dashboard/reservations',
      severity: 'info',
      metadata: { sejour_id: s.id },
      dedupKey: `arrivee_demain:sejour_${s.id}`,
      expiresAt: endOfDay(addDaysIso(today, 2)),
    })) created++
  }

  // Réservations importées sans voyageur saisi : rappeler de le compléter
  const icalResas = icalReservationsForDisplay(logements ?? [], feeds ?? [], events ?? [])
  for (const r of icalResas) {
    if (r.dateArrivee !== tomorrow || covered.has(normName(r.logementName))) continue
    const src = r.platform === 'airbnb' ? 'Airbnb' : r.platform === 'booking' ? 'Booking' : r.platform === 'vrbo' ? 'Vrbo' : 'synchronisée'
    if (await createNotification({
      recipientId: userId, category: 'sejour', type: 'arrivee_demain_ical',
      title: `Arrivée demain : réservation ${src}`,
      body: `${r.logementName ?? 'Ton logement'}, ${stayLabel(r.dateArrivee, r.dateDepart)}. Le voyageur n'est pas encore saisi : ajoute-le pour sa déclaration et le suivi.`,
      ctaLabel: 'Compléter la réservation',
      ctaHref: '/dashboard/reservations',
      severity: 'warning',
      dedupKey: `arrivee_demain:ical_${r.id}`,
      expiresAt: endOfDay(addDaysIso(today, 2)),
    })) created++
  }
  return created
}

// ─── Départ aujourd'hui avec une caution à libérer ────────────────────────
async function ruleCautionDepart(userId: string, today: string): Promise<number> {
  const { data } = await svc().from('contracts')
    .select('id, sejour_id, locataire_prenom, locataire_nom, logement_nom, montant_caution')
    .eq('user_id', userId).neq('statut', 'annule').eq('date_depart', today).eq('stripe_deposit_status', 'held')
  let created = 0
  for (const c of (data ?? []) as Array<{ id: string; sejour_id: string | null; locataire_prenom: string | null; locataire_nom: string | null; logement_nom: string | null; montant_caution: number | null }>) {
    const nom = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Ton voyageur'
    if (await createNotification({
      recipientId: userId, category: 'sejour', type: 'caution_a_liberer',
      title: `Départ aujourd'hui : caution de ${nom} à libérer`,
      body: `${c.logement_nom ?? 'Ton logement'}. Fais l'état des lieux puis libère la caution${c.montant_caution ? ` de ${eur(Number(c.montant_caution))}` : ''}, ou encaisse-la en cas de dégâts, avant que la carte ne soit débloquée (environ 7 jours après le blocage).`,
      ctaLabel: 'Gérer la caution',
      ctaHref: '/dashboard/contrats',
      severity: 'warning',
      dedupKey: `caution_a_liberer:${c.id}`,
      expiresAt: endOfDay(addDaysIso(today, 5)),
    })) created++
  }
  return created
}

// ─── Contrat pas encore signé à 7 jours de l'arrivée ──────────────────────
async function ruleContratNonSigne(userId: string, today: string): Promise<number> {
  const { data } = await svc().from('contracts')
    .select('id, locataire_prenom, locataire_nom, logement_nom, date_arrivee, date_depart')
    .eq('user_id', userId).eq('statut', 'en_attente')
    .gte('date_arrivee', today).lte('date_arrivee', addDaysIso(today, 7))
  let created = 0
  for (const c of (data ?? []) as Array<{ id: string; locataire_prenom: string | null; locataire_nom: string | null; logement_nom: string | null; date_arrivee: string; date_depart: string | null }>) {
    const nom = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Ton voyageur'
    if (await createNotification({
      recipientId: userId, category: 'sejour', type: 'contrat_non_signe',
      title: `${nom} n'a pas encore signé son contrat`,
      body: `Arrivée le ${shortDate(c.date_arrivee)}${c.logement_nom ? ` à ${c.logement_nom}` : ''}. Renvoie-lui le lien de signature.`,
      ctaLabel: 'Copier le lien',
      ctaHref: '/dashboard/contrats',
      severity: 'warning',
      dedupKey: `contrat_non_signe:${c.id}`,
      expiresAt: endOfDay(c.date_arrivee),
    })) created++
  }
  return created
}

// ─── Plafonds fiscaux (France), sur les recettes de Mes finances ─────────
async function rulePlafondsFiscaux(userId: string, today: string): Promise<number> {
  const db = svc()
  const annee = today.slice(0, 4)
  const debut = `${annee}-01-01`
  const fin = `${annee}-12-31`
  const [{ data: logements }, { data: sejours }, { data: contracts }, { data: entries }] = await Promise.all([
    db.from('logements').select('pays, type_logement, classement_etoiles').eq('user_id', userId),
    db.from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, commission_montant, contrat_plateforme, a_declarer, created_at')
      .eq('user_id', userId).is('annule_at', null).gte('date_arrivee', debut).lte('date_arrivee', fin).limit(3000),
    db.from('contracts')
      .select('id, sejour_id, statut, montant_loyer, date_arrivee, date_depart, logement_nom, logement_id, locataire_prenom, locataire_nom, stripe_payment_enabled, stripe_payment_status, created_at')
      .eq('user_id', userId).neq('statut', 'annule').gte('date_arrivee', debut).lte('date_arrivee', fin).limit(3000),
    db.from('revenus_entries')
      .select('id, logement_nom, montant, date_paiement, mode_paiement, type_paiement, description, a_declarer')
      .eq('user_id', userId).gte('date_paiement', debut).lte('date_paiement', fin).limit(3000),
  ])
  const fr = (logements ?? []).filter(l => (l.pays ?? 'FR') === 'FR')
  if (fr.length === 0) return 0

  const lines = buildRevenueLines({ sejours: (sejours ?? []) as never, contracts: (contracts ?? []) as never, entries: (entries ?? []) as never, today })
  const t = totaux(lines, [], [], debut, fin, today)
  const recettes = t.revenus + t.aVenir
  if (recettes <= 0) return 0

  const tousClasses = fr.every(l => fiscalCategory({ typeLogement: l.type_logement, classementEtoiles: l.classement_etoiles }) !== 'nonClasse')
  const mb = FISCAL_PARAMS_2026.microBic
  const seuils = [
    tousClasses
      ? { code: 'micro_classe', plafond: mb.classe.plafond, label: `plafond du micro-BIC (${eur(mb.classe.plafond)}, meublé classé)`, apres: 'Au-delà deux années de suite, tu passes au régime réel.' }
      : { code: 'micro_non_classe', plafond: mb.nonClasse.plafond, label: `plafond du micro-BIC (${eur(mb.nonClasse.plafond)}, meublé non classé)`, apres: 'Au-delà deux années de suite, tu passes au régime réel. Le classement du logement relève ce plafond.' },
    { code: 'cotisations_23k', plafond: FISCAL_PARAMS_2026.ei.seuilLmp, label: `seuil de ${eur(FISCAL_PARAMS_2026.ei.seuilLmp)} de recettes`, apres: 'Au-delà, des cotisations sociales Urssaf sont dues, même en LMNP, à la place des prélèvements sociaux.' },
  ]

  let created = 0
  for (const s of seuils) {
    if (recettes < s.plafond * 0.8) continue
    const atteint = recettes >= s.plafond
    const detail = t.aVenir > 0 ? ` (dont ${eur(t.aVenir)} de réservations à venir)` : ''
    if (await createNotification({
      recipientId: userId, category: 'fiscal',
      type: atteint ? `plafond_${s.code}_atteint` : `plafond_${s.code}_proche`,
      title: atteint ? `Tu dépasses le ${s.label}` : `Tu approches du ${s.label}`,
      body: `Tes recettes ${annee} atteignent ${eur(recettes)}${detail}, soit ${Math.round(recettes / s.plafond * 100)} % du seuil. ${s.apres}`,
      ctaLabel: 'Voir ma fiscalité',
      ctaHref: '/dashboard/finances/fiscalite',
      severity: atteint ? 'error' : 'warning',
      metadata: { recettes, plafond: s.plafond, annee },
      dedupKey: `plafond_${s.code}_${atteint ? 100 : 80}:${annee}`,
      expiresAt: new Date(`${annee}-12-31T23:59:59+01:00`),
    })) created++
  }
  return created
}

// ─── Stripe commencé mais pas terminé ────────────────────────────────────
async function ruleStripeIncomplete(userId: string, today: string): Promise<number> {
  const db = svc()
  const { data: profile } = await db.from('profiles').select('stripe_account_id, stripe_onboarding_complete').eq('id', userId).maybeSingle()
  if (!profile || profile.stripe_onboarding_complete) return 0
  const { count } = await db.from('contracts').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('stripe_payment_enabled', true).neq('statut', 'annule')
  if (!profile.stripe_account_id && !count) return 0
  const ok = await createNotification({
    recipientId: userId, category: 'sync', type: 'stripe_incomplet',
    title: 'Termine ton inscription Stripe',
    body: count
      ? `${count} contrat${count > 1 ? 's proposent' : ' propose'} le paiement en ligne, mais ton compte Stripe n'est pas terminé : les loyers et cautions ne peuvent pas encore être encaissés.`
      : 'Ton compte Stripe est ouvert mais pas terminé : le paiement en ligne et la caution par empreinte ne sont pas encore disponibles.',
    ctaLabel: 'Terminer maintenant',
    ctaHref: '/dashboard/profil#stripe',
    severity: 'warning',
    dedupKey: `stripe_incomplet:${today.slice(0, 7)}`,
    expiresAt: endOfDay(addDaysIso(today, 30)),
  })
  return ok ? 1 : 0
}

// ─── Synchro iCal en échec ────────────────────────────────────────────────
// 3 échecs de suite (URL régénérée côté plateforme, annonce supprimée…).
// Une alerte par flux et par dernière synchro réussie. Colonnes de la
// migration 20260927_107 : si elle manque, la requête échoue et on renvoie 0.
async function ruleSyncFailed(userId: string): Promise<number> {
  const { data: feeds, error } = await svc().from('ical_feeds')
    .select('id, name, last_synced, consecutive_failures, last_sync_error')
    .eq('user_id', userId).gte('consecutive_failures', 3)
  if (error || !feeds) return 0
  let created = 0
  for (const f of feeds as Array<{ id: string; name: string | null; last_synced: string | null; consecutive_failures: number; last_sync_error: string | null }>) {
    if (await createNotification({
      recipientId: userId, category: 'sync', type: 'sync_failed',
      title: `Calendrier plus synchronisé : ${f.name ?? 'flux iCal'}`,
      body: `Les ${f.consecutive_failures} dernières synchronisations ont échoué${f.last_sync_error ? ` (${f.last_sync_error})` : ''}. Les nouvelles réservations n'arrivent plus dans le calendrier ni dans le planning ménage : recopie le lien iCal de la plateforme sur la fiche du logement.`,
      ctaLabel: 'Voir mes logements',
      ctaHref: '/dashboard/logements',
      severity: 'error',
      dedupKey: `sync_failed:${f.id}:${f.last_synced ?? 'jamais'}`,
    })) created++
  }
  return created
}

// ─── Orchestrateur ────────────────────────────────────────────────────────
export interface RulesRunResult {
  arriveeDemain: number
  cautionDepart: number
  contratNonSigne: number
  plafonds: number
  stripeIncomplete: number
  syncFailed: number
  total: number
  durationMs: number
}

/** Exécute toutes les règles d'un hôte. Ne lève jamais. */
export async function runNotificationRules(userId: string): Promise<RulesRunResult> {
  const t0 = Date.now()
  const today = parisToday()
  const safe = async (fn: () => Promise<number>, name: string): Promise<number> => {
    try { return await fn() } catch (e) { console.error(`[rules:${name}]`, e); return 0 }
  }
  const [arriveeDemain, cautionDepart, contratNonSigne, plafonds, stripeIncomplete, syncFailed] = await Promise.all([
    safe(() => ruleArriveeDemain(userId, today), 'arrivee_demain'),
    safe(() => ruleCautionDepart(userId, today), 'caution_depart'),
    safe(() => ruleContratNonSigne(userId, today), 'contrat_non_signe'),
    safe(() => rulePlafondsFiscaux(userId, today), 'plafonds'),
    safe(() => ruleStripeIncomplete(userId, today), 'stripe_incomplete'),
    safe(() => ruleSyncFailed(userId), 'sync_failed'),
  ])
  return {
    arriveeDemain, cautionDepart, contratNonSigne, plafonds, stripeIncomplete, syncFailed,
    total: arriveeDemain + cautionDepart + contratNonSigne + plafonds + stripeIncomplete + syncFailed,
    durationMs: Date.now() - t0,
  }
}

// ─── Ménage de la table ───────────────────────────────────────────────────
/** Supprime les notifications expirées et celles lues depuis plus de 60 jours */
export async function purgeExpiredNotifications(): Promise<number> {
  const db = svc()
  let n = 0
  const expired = await db.from('notifications').delete().lt('expires_at', new Date().toISOString()).select('id')
  if (expired.error) console.error('[purgeExpired]', expired.error)
  else n += expired.data?.length ?? 0
  const oldRead = await db.from('notifications').delete().lt('read_at', new Date(Date.now() - 60 * 86_400_000).toISOString()).select('id')
  if (oldRead.error) console.error('[purgeOldRead]', oldRead.error)
  else n += oldRead.data?.length ?? 0
  return n
}
