// Interrupteur « Recevoir Le Check-in » de Mon compte (11/10/2026). Brevo reste
// la référence pour les désinscriptions (lien en bas de chaque lettre) ; le
// choix est aussi gardé sur le compte (profiles.newsletter_opt_in, migration 128).
// Couper = adresse bloquée dans Brevo (plus aucune édition, celle des pros
// comprise) ; rallumer = débloquée et remise dans la liste de la lettre.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { brevo } from './run'
import { NEWSLETTER_LISTS } from './lists'
import { editionOfAccount, type Edition } from './editions'
import { newsletterState, newsletterNote, type NewsletterReason } from './account-rules'
import { isPaidPro } from '@/lib/admin/revenue'

export interface NewsletterStatus {
  subscribed: boolean
  reason: NewsletterReason
  edition: Edition
  note: string
  /** Brevo n'a pas répondu : état déduit du compte seulement */
  partial: boolean
}

type BrevoContact = { emailBlacklisted?: boolean; listIds?: number[] }

async function brevoContact(email: string): Promise<BrevoContact | null> {
  try {
    return await brevo<BrevoContact>(`/contacts/${encodeURIComponent(email)}`)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Brevo 404')) return null
    throw e
  }
}

export async function loadNewsletterStatus(db: SupabaseClient, userId: string, email: string): Promise<NewsletterStatus> {
  const [profile, photo, clean] = await Promise.all([
    db.from('profiles').select('is_investor, newsletter_opt_in').eq('id', userId).maybeSingle(),
    db.from('photographers').select('stripe_subscription_status').eq('user_id', userId).limit(5),
    db.from('cleaners').select('stripe_subscription_status').eq('user_id', userId).limit(5),
  ])
  const p = (profile.data ?? {}) as { is_investor?: boolean | null; newsletter_opt_in?: boolean | null }
  const photoRows = (photo.data ?? []) as Array<{ stripe_subscription_status: string | null }>
  const cleanRows = (clean.data ?? []) as Array<{ stripe_subscription_status: string | null }>
  const edition = editionOfAccount({ photographer: photoRows.length > 0, cleaner: cleanRows.length > 0, isInvestor: !!p.is_investor })
  const paidPro = [...photoRows, ...cleanRows].some(isPaidPro)

  let contact: BrevoContact | null = null
  let partial = false
  try { contact = await brevoContact(email) } catch { partial = true }

  const state = newsletterState({
    blacklisted: !!contact?.emailBlacklisted,
    inList: !!contact?.listIds?.some(id => NEWSLETTER_LISTS.includes(id)),
    optIn: !!p.newsletter_opt_in,
    paidPro,
  })
  return { ...state, edition, note: newsletterNote(state, edition), partial }
}

export async function saveNewsletterChoice(db: SupabaseClient, userId: string, email: string, on: boolean): Promise<void> {
  // Brevo d'abord : si Brevo refuse, rien n'est enregistré et l'interrupteur revient
  if (on) {
    await brevo('/contacts', { method: 'POST', body: { email, listIds: NEWSLETTER_LISTS, emailBlacklisted: false, updateEnabled: true } })
  } else {
    await brevo('/contacts', { method: 'POST', body: { email, emailBlacklisted: true, updateEnabled: true } })
    await brevo(`/contacts/${encodeURIComponent(email)}`, { method: 'PUT', body: { unlinkListIds: NEWSLETTER_LISTS } }).catch(() => undefined)
  }
  const { error } = await db.from('profiles')
    .update({ newsletter_opt_in: on, newsletter_opt_in_at: new Date().toISOString() })
    .eq('id', userId)
  // Sans la migration 128, Brevo suffit : le choix y est déjà enregistré
  if (error && error.code !== '42703') throw new Error(error.message)
}
