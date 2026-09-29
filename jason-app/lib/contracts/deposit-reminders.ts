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
import { CONTRACT_EMAIL_I18N, toEmailLang } from '@/lib/email/contract-i18n'
import { addDaysIso, parisToday, DEPOSIT_OPEN_DAYS_BEFORE } from '@/lib/stripe/deposit-window'
import { escHtml, lightify } from '@/lib/email/template'

export type DepositReminderRow = {
  id: string
  user_id: string | null
  token: string
  langue: string | null
  locataire_prenom: string | null
  locataire_nom: string | null
  locataire_email: string | null
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
  const et = CONTRACT_EMAIL_I18N[lang]
  const property = escHtml(row.logement_nom ?? row.logement_adresse)
  const guest = escHtml(`${row.locataire_prenom ?? ''} ${row.locataire_nom ?? ''}`.trim())
  const amount = Number(row.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })
  const arrival = new Date(`${row.date_arrivee.slice(0, 10)}T12:00:00Z`)
    .toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const depositUrl = `${appUrl}/api/stripe/deposit/redirect?token=${row.token}`
  const contractUrl = `${appUrl}/sign/${row.token}`

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#132b22;border:1px solid #1e3d2f;border-radius:20px;overflow:hidden;">
      <div style="padding:32px 32px 24px;border-bottom:1px solid #1e3d2f;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#FFD56B;font-weight:600;">${et.depositOpenPreheader}</p>
        <h1 style="margin:0;font-size:24px;font-weight:400;color:#f0ebe1;font-family:Georgia,serif;">${et.depositOpenTitle}</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 20px;">${et.reminderGreeting(guest)}</p>
        <p style="color:#a5c4b0;font-size:15px;line-height:1.7;margin:0 0 24px;">${et.depositOpenBody(property, arrival)}</p>
        <a href="${depositUrl}" style="display:block;text-align:center;background:#FFD56B;color:#0a0f0d;padding:14px 24px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;margin:0 0 12px;">
          ${et.payDepositBtn(amount)} →
        </a>
        <p style="margin:0 0 24px;font-size:12px;color:#6b9a7e;line-height:1.5;">${et.depositNote}</p>
        <a href="${contractUrl}" style="display:block;text-align:center;border:1px solid #1e3d2f;color:#e8ede8;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;margin:0 0 20px;">
          ${et.viewContractBtn}
        </a>
        <p style="color:#6b9a7e;font-size:12px;line-height:1.6;margin:0;">${et.reminderTroubleNote}</p>
      </div>
    </div>
  </div>
</body>
</html>`

  return { subject: et.depositOpenSubject(row.logement_nom ?? row.logement_adresse), html: lightify(html) }
}

/** Cherche les contrats du jour et envoie les emails. Retourne le nombre envoyé. */
export async function sendDepositOpenEmails(db: SupabaseClient, appUrl: string, now: Date = new Date()): Promise<number> {
  const target = addDaysIso(parisToday(now), DEPOSIT_OPEN_DAYS_BEFORE)
  const { data: rows, error } = await db
    .from('contracts')
    .select('id, user_id, token, langue, locataire_prenom, locataire_nom, locataire_email, logement_nom, logement_adresse, montant_caution, date_arrivee, stripe_deposit_status')
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
    const { error: sendErr } = await resend.emails.send({
      from: 'contrats@jasonmarinho.com',
      to: row.locataire_email!,
      subject,
      html,
    })
    if (!sendErr) sent++
    else console.warn('[deposit-reminders] envoi échoué', row.id, String(sendErr))
  }
  return sent
}
