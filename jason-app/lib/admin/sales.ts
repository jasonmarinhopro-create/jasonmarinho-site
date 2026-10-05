// Page « Ventes » de l'admin (05/10/2026, idée validée par Jason : suivre
// chaque semaine ce qui rapporte, et savoir à qui écrire). Règles pures,
// testées ; le chargement est dans sales-load.ts.

import { PRICES } from './revenue'

/**
 * Objectifs : ce que coûtent les offres payantes des hébergeurs, TVA de 20 %
 * comprise (Jason est en franchise, il ne la récupère pas). Supabase Pro
 * 25 $ / mois, Vercel Pro 20 $ / mois, au cours d'octobre 2026 (≈ 0,93 €).
 */
export const SALES_GOALS = [
  { key: 'supabase', label: 'Supabase Pro', detail: 'fin des lenteurs, sauvegardes quotidiennes', annual: 310 },
  { key: 'supabase_vercel', label: 'Supabase Pro + Vercel Pro', detail: 'et usage commercial autorisé chez Vercel', annual: 560 },
] as const

/** Cotisations sociales estimées sur le chiffre d'affaires (micro-entreprise, à vérifier sur l'espace Urssaf). */
export const COTISATIONS_ESTIMATE = 0.22
/** Frais Stripe d'un paiement par carte européenne standard. */
export const STRIPE_PCT = 0.015
export const STRIPE_FIXED = 0.25

/** Ce qu'il reste d'un abonnement annuel après Stripe et cotisations. */
export function netOfSubscription(price: number): number {
  const afterStripe = price - (price * STRIPE_PCT + STRIPE_FIXED)
  return Math.round(afterStripe * (1 - COTISATIONS_ESTIMATE) * 100) / 100
}

export function netAnnual(lines: Array<{ price: number; count: number }>): number {
  return Math.round(lines.reduce((s, l) => s + netOfSubscription(l.price) * l.count, 0) * 100) / 100
}

/** Combien d'abonnements de chaque sorte manquent pour atteindre un objectif. */
export function missingFor(goal: number, net: number) {
  const left = Math.max(0, goal - net)
  return {
    left,
    pct: goal > 0 ? Math.min(100, Math.round((net / goal) * 100)) : 100,
    standard: Math.ceil(left / netOfSubscription(PRICES.standard)),
    proFondateur: Math.ceil(left / netOfSubscription(PRICES.proFondateur)),
    proStandard: Math.ceil(left / netOfSubscription(PRICES.proStandard)),
  }
}

// ── Membres ──────────────────────────────────────────────────────────────

export interface MemberActivity {
  id: string
  fullName: string | null
  email: string | null
  plan: string | null
  role: string | null
  driingStatus: string | null
  createdAt: string
  lastSignInAt: string | null
  logements: number
  sejours: number
  contracts: number
  /** A une fiche photographe ou ménage (compte pro) */
  isPro: boolean
}

export type MemberGroup = 'admin' | 'payant' | 'driing' | 'driing_attente' | 'actif' | 'inactif' | 'pro'

export function memberGroup(m: MemberActivity): MemberGroup {
  if (m.role === 'admin') return 'admin'
  if (m.plan === 'standard') return 'payant'
  if (m.plan === 'driing' || m.driingStatus === 'confirmed') return 'driing'
  // Inscrit par Driing, pas encore confirmé : l'accès lui a été promis, ne rien lui vendre
  if (m.driingStatus === 'pending') return 'driing_attente'
  if (m.logements > 0 || m.sejours > 0 || m.contracts > 0) return 'actif'
  if (m.isPro) return 'pro'
  return 'inactif'
}

export function firstName(fullName: string | null | undefined): string {
  const f = (fullName ?? '').trim().split(/\s+/)[0] ?? ''
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : ''
}

/** Texte de relance d'un membre (même texte pour le lien mailto et l'e-mail envoyé par l'app). */
export function wakeUpMessage(m: Pick<MemberActivity, 'fullName'>, kind: 'actif' | 'inactif'): { subject: string; body: string } {
  const hello = firstName(m.fullName) ? `Bonjour ${firstName(m.fullName)},` : 'Bonjour,'
  const subject = kind === 'inactif' ? 'Ton espace Jason Marinho' : 'Tes réservations en direct'
  const body = kind === 'inactif'
    ? `${hello}\n\nJe suis Jason, le créateur de l'app. Tu as créé ton compte il y a quelque temps et je voulais savoir si je peux t'aider à démarrer.\n\nEn 10 minutes, on ajoute ton logement et on connecte ton calendrier Airbnb ou Booking : ensuite ton planning ménage et tes déclarations voyageurs se préparent tout seuls.\n\nDis-moi ce qui t'a manqué, je lis toutes les réponses.\n\nJason`
    : `${hello}\n\nJe vois que tu utilises l'app pour ton logement, merci ! Est-ce qu'elle te sert au quotidien ?\n\nSi tu fais des réservations en direct, le Standard te permet d'envoyer un contrat signé en ligne, d'encaisser le loyer par carte sans commission et de bloquer une caution par empreinte bancaire. C'est 19,98 € par an au tarif Fondateur, tant qu'il reste des places.\n\nUne question ? Réponds simplement à ce message.\n\nJason`
  return { subject, body }
}

/** Lien mailto prêt à envoyer, depuis la boîte de Jason. */
export function wakeUpMailto(m: Pick<MemberActivity, 'email' | 'fullName'>, kind: 'actif' | 'inactif'): string | null {
  if (!m.email) return null
  const { subject, body } = wakeUpMessage(m, kind)
  return `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// ── E-mail unique aux membres gratuits (05/10/2026) ──────────────────────

/**
 * Drapeau posé dans profiles.onboarding_completed_steps quand l'e-mail est
 * parti (même endroit que les « tour:… » : pas de migration à appliquer).
 * Changer la valeur pour une future campagne.
 */
export const MEMBER_MAIL_FLAG = 'mail:membres-2026-10'

export type MemberMailExclusion =
  | 'admin' | 'payant' | 'driing' | 'driing_attente' | 'pro' | 'sans_email' | 'deja_envoye' | 'desinscrit'

export const EXCLUSION_LABEL: Record<MemberMailExclusion, string> = {
  admin: 'compte admin (le tien)',
  payant: 'déjà en Standard',
  driing: 'membres Driing (accès offert)',
  driing_attente: 'Driing en attente de confirmation',
  pro: 'comptes pros seulement',
  sans_email: 'sans e-mail',
  deja_envoye: 'déjà reçu',
  desinscrit: 'désinscrits',
}

/**
 * Qui reçoit l'e-mail. Les comptes Driing, confirmés ou en attente, ne le
 * reçoivent jamais : l'accès leur a été offert, on ne leur vend pas le Standard.
 */
export function memberMailTarget(
  m: MemberActivity,
  opts: { alreadySent: boolean; suppressed: boolean },
): { kind: 'actif' | 'inactif' } | { excluded: MemberMailExclusion } {
  const g = memberGroup(m)
  if (g !== 'actif' && g !== 'inactif') return { excluded: g }
  if (!m.email) return { excluded: 'sans_email' }
  if (opts.suppressed) return { excluded: 'desinscrit' }
  if (opts.alreadySent) return { excluded: 'deja_envoye' }
  return { kind: g }
}

/** Pied de l'e-mail : pourquoi la personne le reçoit, et comment ne plus en recevoir. */
export function memberMailFooter(unsubscribeUrl: string): string {
  return `Tu reçois ce message parce que tu as un compte sur l'app Jason Marinho (app.jasonmarinho.com). Les e-mails liés à ton activité (contrats, paiements) ne changent pas.\nPour ne plus recevoir ce type de message : ${unsubscribeUrl}`
}

/** Tri des membres à réveiller : les plus récents d'abord (souvenir encore frais). */
export function sortForOutreach<T extends Pick<MemberActivity, 'createdAt' | 'lastSignInAt'>>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.lastSignInAt ?? b.createdAt).localeCompare(a.lastSignInAt ?? a.createdAt))
}

// ── Inscriptions par semaine ─────────────────────────────────────────────

/** Lundi (AAAA-MM-JJ) de la semaine d'une date. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}

export function weeklyCounts(dates: string[], today: string, weeks = 8): Array<{ week: string; count: number }> {
  const start = weekStart(today)
  const out: Array<{ week: string; count: number }> = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${start}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 7 * i)
    out.push({ week: d.toISOString().slice(0, 10), count: 0 })
  }
  const idx = new Map(out.map((w, i) => [w.week, i]))
  for (const iso of dates) {
    const i = idx.get(weekStart(iso))
    if (i !== undefined) out[i].count++
  }
  return out
}

// ── Prospection ──────────────────────────────────────────────────────────

export const PIPELINE_STEPS = [
  { key: 'a_contacter', label: 'À contacter' },
  { key: 'contacte', label: 'Contactés' },
  { key: 'a_repondu', label: 'Ont répondu' },
  { key: 'interesse', label: 'Intéressés' },
  { key: 'inscrit', label: 'Inscrits' },
  { key: 'client', label: 'Clients' },
] as const

export function pipelineCounts(rows: Array<{ stage: string | null; audience: string | null }>, audience: string) {
  const mine = rows.filter(r => r.audience === audience)
  return PIPELINE_STEPS.map(s => ({ ...s, count: mine.filter(r => r.stage === s.key).length }))
}
