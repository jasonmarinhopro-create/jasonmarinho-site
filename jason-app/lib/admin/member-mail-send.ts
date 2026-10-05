// E-mail unique aux membres gratuits (05/10/2026, point 3 validé par Jason).
// Envoyé depuis la boîte de Jason (même SMTP que la prospection) : les
// réponses arrivent chez lui. Jamais aux comptes Driing (accès offert),
// jamais deux fois (drapeau MEMBER_MAIL_FLAG), jamais à un désinscrit.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { outreachConfig, sendOutreachMail, isPermanentAddressError } from '@/lib/outreach/mailer'
import { loadSettings, suppress } from '@/lib/outreach/service'
import { DEFAULT_SIGNATURE, SIGNATURE_PHOTO_URL, textToHtml } from '@/lib/outreach/engine'
import { logger } from '@/lib/logger'
import { loadMembers } from './sales-load'
import { MEMBER_MAIL_FLAG, memberMailFooter, wakeUpMessage } from './sales'
import { memberUnsubToken } from './member-unsub'
import { memberMailSecret } from './member-mail-secret'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.jasonmarinho.com').replace(/\/$/, '')
/** Même rythme que la prospection (Hostinger : 10 e-mails par minute au plus) */
const GAP_MS = 6_500
const GAP_JITTER_MS = 2_000

const log = logger('admin/membres-e-mail')
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function setFlag(userId: string, on: boolean): Promise<boolean> {
  const db = getServiceClient()
  const { data } = await db.from('profiles').select('onboarding_completed_steps').eq('id', userId).maybeSingle()
  const current = (data?.onboarding_completed_steps as string[] | null) ?? []
  if (on && current.includes(MEMBER_MAIL_FLAG)) return false
  const next = on ? [...current, MEMBER_MAIL_FLAG] : current.filter(k => k !== MEMBER_MAIL_FLAG)
  await db.from('profiles').update({ onboarding_completed_steps: next }).eq('id', userId)
  return true
}

/**
 * Envoie la suite des e-mails dans le temps donné (une server action dure au
 * plus ~60 s). Le bouton de l'admin rappelle tant qu'il en reste.
 */
export async function sendMemberMailBatch(budgetMs = 45_000): Promise<{ sent: number; remaining: number; failed: number; error?: string }> {
  const cfg = outreachConfig()
  const secret = memberMailSecret()
  if (!cfg) return { sent: 0, remaining: 0, failed: 0, error: 'Boîte d\'envoi non configurée (variables OUTREACH_SMTP_*).' }
  if (!secret) return { sent: 0, remaining: 0, failed: 0, error: 'Secret CRON_SECRET absent : impossible de signer les liens de désinscription.' }

  const started = Date.now()
  const db = getServiceClient()
  const [{ mailTargets }, settings] = await Promise.all([loadMembers(), loadSettings(db)])
  const queue = mailTargets.filter(t => 'kind' in t.target)
  const signature = settings.signature?.trim() || DEFAULT_SIGNATURE

  let sent = 0, failed = 0, done = 0
  for (const { member, target } of queue) {
    if (!('kind' in target) || !member.email) { done++; continue }
    if (sent + failed > 0 && Date.now() - started + GAP_MS + GAP_JITTER_MS + 8_000 > budgetMs) break
    if (sent + failed > 0) await sleep(GAP_MS + Math.floor(Math.random() * GAP_JITTER_MS))

    // Réservé avant l'envoi : deux clics ou deux onglets n'envoient jamais deux fois
    if (!(await setFlag(member.id, true))) { done++; continue }
    const token = memberUnsubToken(member.id, secret)
    const page = `${APP_URL}/desinscription/membre/${token}`
    const oneClick = `${APP_URL}/api/outreach/unsubscribe?m=${encodeURIComponent(token)}`
    const { subject, body } = wakeUpMessage(member, target.kind)
    const footer = memberMailFooter(page)
    try {
      await sendOutreachMail(cfg, {
        to: member.email,
        subject,
        text: `${body}\n\n${signature}\n\n--\n${footer}`,
        html: textToHtml(body, footer, signature, settings.signature_photo ? SIGNATURE_PHOTO_URL : null),
        unsubscribeUrl: page,
        oneClickUrl: oneClick,
      })
      sent++
    } catch (err) {
      failed++
      if (isPermanentAddressError(err)) {
        await suppress(db, member.email, 'rebond')
      } else {
        // Erreur passagère : le compte redevient à envoyer, et on s'arrête là
        await setFlag(member.id, false)
        log.warn('envoi refusé', { message: err instanceof Error ? err.message.slice(0, 200) : 'erreur' })
        return { sent, failed, remaining: queue.length - done, error: 'La boîte d\'envoi a refusé un message. Réessaie dans quelques minutes.' }
      }
    }
    done++
  }
  return { sent, failed, remaining: Math.max(0, queue.length - done) }
}
