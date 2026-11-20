// Envoi automatique du lien de caution 2 jours avant l'arrivée (sept. 2026).
// Appelé chaque matin par le cron /api/cron/notifications-engine.
//
// Pourquoi J-2 : une carte ne reste bloquée qu'environ 7 jours chez Stripe
// (lib/stripe/deposit-window.ts). Envoyé à la signature, le blocage tombait
// souvent avant même l'arrivée du voyageur.
//
// Pas de colonne « déjà envoyé » : le cron ne cible que les arrivées à
// exactement J+2, un contrat ne reçoit donc l'email qu'une fois. Si le cron
// saute un jour, le voyageur peut toujours payer depuis la page du contrat
// et l'hôte renvoyer le lien depuis la fiche voyageur.

import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { toEmailLang } from '@/lib/email/contract-i18n'
import { addDaysIso, parisToday, DEPOSIT_OPEN_DAYS_BEFORE } from '@/lib/stripe/deposit-window'
import { htmlToText } from '@/lib/email/template'
import { contractFrom, depositOpenEmailContent } from '@/lib/email/contract-emails'
import { emailTags } from '@/lib/email/tracking'

export type DepositReminderRow = {
  id: string
  user_id: string | null
  token: string
  langue: string | null
  locataire_prenom: string | null
  locataire_nom: string | null
  locataire_email: string | null
  bailleur_prenom?: string | null
  bailleur_nom?: string | null
  bailleur_email?: string | null
  logement_nom?: string | null
  logement_adresse: string
  montant_caution: number | null
  date_arrivee: string
  stripe_deposit_status: string | null
}

/** Statuts pour lesquels la caution n'est plus à demander */
const DONE_STATUSES = new Set(['held', 'capturing', 'captured', 'releasing', 'released'])

/** Contrats à qui envoyer le lien aujourd'hui (fonction pure, testée) */
export function dueDepositReminders(
  rows: DepositReminderRow[],
  stripeReadyHostIds: Set<string>,
  now: Date = new Date(),
): DepositReminderRow[] {
  const target = addDaysIso(parisToday(now), DEPOSIT_OPEN_DAYS_BEFORE)
  return rows.filter(r =>
    r.date_arrivee.slice(0, 10) === target
    && Number(r.montant_caution) > 0
    && !!r.locataire_email
    && !!r.user_id && stripeReadyHostIds.has(r.user_id)
    && !DONE_STATUSES.has(r.stripe_deposit_status ?? ''),
  )
}

export function depositOpenEmail(row: DepositReminderRow, appUrl: string): { subject: string; html: string } {
  const lang = toEmailLang(row.langue)
  return depositOpenEmailContent({
    lang,
    hostName: `${row.bailleur_prenom ?? ''} ${row.bailleur_nom ?? ''}`.trim(),
    guestName: `${row.locataire_prenom ?? ''} ${row.locataire_nom ?? ''}`.trim(),
    property: row.logement_nom ?? row.logement_adresse,
    arrival: new Date(`${row.date_arrivee.slice(0, 10)}T12:00:00Z`)
      .toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }),
    caution: Number(row.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
    depositUrl: `${appUrl}/api/stripe/deposit/redirect?token=${row.token}`,
    contractUrl: `${appUrl}/sign/${row.token}`,
  })
}

/** Cherche les contrats du jour et envoie les emails. Retourne le nombre envoyé. */
export async function sendDepositOpenEmails(db: SupabaseClient, appUrl: string, now: Date = new Date()): Promise<number> {
  const target = addDaysIso(parisToday(now), DEPOSIT_OPEN_DAYS_BEFORE)
  const { data: rows, error } = await db
    .from('contracts')
    .select('id, user_id, token, langue, bailleur_prenom, bailleur_nom, bailleur_email, locataire_prenom, locataire_nom, locataire_email, logement_nom, logement_adresse, montant_caution, date_arrivee, stripe_deposit_status')
    .eq('statut', 'signe')
    .eq('date_arrivee', target)
    .gt('montant_caution', 0)
  if (error || !rows?.length) return 0

  const hostIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[]
  const { data: hosts } = await db
    .from('profiles')
    .select('id')
    .in('id', hostIds)
    .not('stripe_account_id', 'is', null)
    .eq('stripe_onboarding_complete', true)
  const ready = new Set((hosts ?? []).map(h => h.id as string))

  const due = dueDepositReminders(rows as DepositReminderRow[], ready, now)
  if (!due.length || !process.env.RESEND_API_KEY) return 0

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  for (const row of due) {
    const { subject, html } = depositOpenEmail(row, appUrl)
    const { error: sendErr } = await resend.emails.send({ tags: emailTags('voyageur'),
      from: contractFrom(`${row.bailleur_prenom ?? ''} ${row.bailleur_nom ?? ''}`),
      ...(row.bailleur_email ? { replyTo: row.bailleur_email } : {}),
      to: row.locataire_email!,
      subject,
      html,
      text: htmlToText(html),
    })
    if (!sendErr) sent++
    else console.warn('[deposit-reminders] envoi échoué', row.id, String(sendErr))
  }
  return sent
}
