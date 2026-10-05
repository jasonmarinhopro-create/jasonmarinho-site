// Envoi du bilan mensuel des pros (05/10/2026), appelé par le cron quotidien
// notifications-engine. Ne fait rien hors du 1er du mois (date de Paris).
// Fiches actives et payées seulement, sur le mois civil écoulé. Jamais deux
// fois : drapeau « mail:bilan-AAAA-MM » posé dans
// profiles.onboarding_completed_steps AVANT l'envoi (lecture fraîche), retiré
// seulement si Resend refuse le message (rien n'est parti). « mail:bilan-off »
// = le pro a décoché la case de Mes statistiques.
import 'server-only'
import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { parisToday } from '@/lib/stripe/deposit-window'
import { loadProStats, PRO_TABLE, proStatsPath, type ProFicheRow } from '@/lib/visibility/pro-load'
import { mainSearch, monthlySentFlag, type ProMetier } from '@/lib/visibility/pro-stats'
import { placeOf } from '@/lib/visibility/rules'
import { buildProMonthlyEmail, isMonthlySendDay, isPaidActive, monthPeriod, previousMonth, shouldSendMonthly } from '@/lib/visibility/pro-monthly'

const log = logger('email/pro-monthly')
const FROM = 'Jason Marinho <notifications@jasonmarinho.com>'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.jasonmarinho.com').replace(/\/$/, '')
const COLUMNS = 'id, user_id, email, full_name, pseudo, ville, slug, status, is_public, created_at, validated_at, stripe_subscription_status, tier, views_count, contacts_count, instagram_clicks_count'
const EXTRA: Record<ProMetier, string> = { photographe: 'portfolio_clicks_count', menage: 'site_clicks_count' }

type Row = ProFicheRow & { email: string | null }

/** Ajoute (ou retire) un drapeau en relisant le tableau juste avant : false si déjà là */
async function setFlag(db: SupabaseClient, userId: string, flag: string, on: boolean): Promise<boolean> {
  const { data, error } = await db.from('profiles').select('onboarding_completed_steps').eq('id', userId).maybeSingle()
  if (error) return false
  const current = (data?.onboarding_completed_steps as string[] | null) ?? []
  if (on && current.includes(flag)) return false
  const next = on ? [...current, flag] : current.filter(k => k !== flag)
  const { error: upErr } = await db.from('profiles').update({ onboarding_completed_steps: next }).eq('id', userId)
  return !upErr
}

export async function sendProMonthlyReports(db: SupabaseClient, opts: { budgetMs: number; today?: string }): Promise<{ sent: number; skipped: number; failed: number }> {
  const out = { sent: 0, skipped: 0, failed: 0 }
  const today = opts.today ?? parisToday()
  const key = process.env.RESEND_API_KEY
  if (!isMonthlySendDay(today) || !key) return out
  const started = Date.now()
  const month = previousMonth(today)
  const period = monthPeriod(month)
  const resend = new Resend(key)

  const lists = await Promise.all((['photographe', 'menage'] as ProMetier[]).map(async metier => {
    const { data } = await db.from(PRO_TABLE[metier]).select(`${COLUMNS}, ${EXTRA[metier]}`).eq('status', 'active')
    return ((data ?? []) as unknown as Row[]).filter(isPaidActive).map(f => ({ metier, f }))
  }))
  const queue = lists.flat().filter(x => x.f.user_id && x.f.email)

  // Préférences lues en une fois pour écarter vite les désabonnés et les déjà servis
  const ids = [...new Set(queue.map(x => x.f.user_id as string))]
  const { data: profiles } = ids.length
    ? await db.from('profiles').select('id, full_name, onboarding_completed_steps').in('id', ids)
    : { data: [] as Array<{ id: string; full_name: string | null; onboarding_completed_steps: string[] | null }> }
  const byId = new Map((profiles ?? []).map(p => [p.id as string, p as { id: string; full_name: string | null; onboarding_completed_steps: string[] | null }]))

  for (const { metier, f } of queue) {
    if (Date.now() - started > opts.budgetMs) break
    const prof = byId.get(f.user_id as string)
    if (!shouldSendMonthly(prof?.onboarding_completed_steps, month.key)) { out.skipped++; continue }
    try {
      const data = await loadProStats({
        metier, fiche: f, db, periodKey: '28j', today, period, googlePeriod: period,
        isAdminPreview: false, isAdmin: false, googleTimeoutMs: 6_000, skipReport: true,
      })
      const main = data.google.status === 'ok' ? mainSearch(data.google.queries) : null
      const email = buildProMonthlyEmail({
        metier,
        firstName: (prof?.full_name ?? f.full_name ?? '').trim().split(/\s+/)[0] || null,
        month,
        visitors: data.metrics.visitors.value ?? 0,
        views: data.metrics.views.value ?? 0,
        demandes: data.metrics.demandes.value ?? 0,
        googleImpressions: data.google.status === 'error' ? null : data.google.impressions,
        best: main ? { query: main.query, place: placeOf(main.position) } : null,
        advice: data.takeaways[0] ?? null,
        statsUrl: `${APP_URL}${proStatsPath(metier)}`,
        publicUrl: data.fiche.publicUrl,
      })
      // Réservé avant l'envoi : deux passages du cron n'envoient jamais deux fois
      if (!(await setFlag(db, f.user_id as string, monthlySentFlag(month.key), true))) { out.skipped++; continue }
      const { error } = await resend.emails.send({ from: FROM, to: f.email as string, subject: email.subject, html: email.html })
      if (error) {
        await setFlag(db, f.user_id as string, monthlySentFlag(month.key), false)
        out.failed++
        log.error('envoi', { err: error.message })
      } else {
        out.sent++
      }
    } catch (e) {
      out.failed++
      log.error('bilan', { err: (e as Error)?.message?.slice(0, 200) })
    }
  }
  return out
}
