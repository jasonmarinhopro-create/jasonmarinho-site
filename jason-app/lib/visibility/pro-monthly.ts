// Bilan mensuel « Ton mois sur Jason Marinho » des pros (05/10/2026).
// Contenu pur (testé, pro-monthly.test.ts) : quel mois, à qui, et le texte de
// l'e-mail. L'envoi est dans lib/email/pro-monthly.ts (cron quotidien,
// seulement le 1er du mois, heure de Paris). Rien d'inventé : seulement les
// chiffres de « Mes statistiques » sur le mois civil écoulé.
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from '@/lib/email/template'
import { addDays } from './rules'
import { MONTHLY_OFF_FLAG, monthlySentFlag, type ProMetier, type ProPeriod } from './pro-stats'

export interface MonthInfo {
  /** AAAA-MM */
  key: string
  start: string
  end: string
  /** « septembre 2026 » */
  label: string
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Le mois civil qui précède `today` (AAAA-MM-JJ) */
export function previousMonth(today: string): MonthInfo {
  const [y, m] = today.split('-').map(Number)
  const py = m === 1 ? y - 1 : y
  const pm = m === 1 ? 12 : m - 1
  const key = `${py}-${String(pm).padStart(2, '0')}`
  const start = `${key}-01`
  const end = addDays(`${y}-${String(m).padStart(2, '0')}-01`, -1)
  return { key, start, end, label: `${MONTHS[pm - 1]} ${py}` }
}

/** Le bilan part le 1er du mois (date de Paris) */
export const isMonthlySendDay = (today: string) => today.slice(8, 10) === '01'

/** Fiche active et payée (mêmes statuts que le revenu de l'admin) */
export function isPaidActive(f: { status: string | null; stripe_subscription_status: string | null }): boolean {
  return f.status === 'active' && ['active', 'trialing', 'past_due'].includes(f.stripe_subscription_status ?? '')
}

/** Le pro veut le bilan et ne l'a pas déjà reçu ce mois-ci */
export function shouldSendMonthly(steps: string[] | null | undefined, monthKey: string): boolean {
  const s = steps ?? []
  return !s.includes(MONTHLY_OFF_FLAG) && !s.includes(monthlySentFlag(monthKey))
}

/** Le mois comme période de statistiques, comparé au mois d'avant */
export function monthPeriod(month: MonthInfo): ProPeriod {
  const days = Math.round((Date.parse(`${month.end}T12:00:00Z`) - Date.parse(`${month.start}T12:00:00Z`)) / 86_400_000) + 1
  const prev = previousMonth(month.start)
  return { key: '28j', label: month.label, days, start: month.start, end: month.end, prevStart: prev.start, prevEnd: prev.end, granularity: 'day' }
}

/** « de septembre 2026 », « d'octobre 2026 » */
export function deMonth(label: string): string {
  return /^[aeiouyéèàâ]/i.test(label) ? `d'${label}` : `de ${label}`
}

export interface MonthlyInput {
  metier: ProMetier
  firstName: string | null
  month: MonthInfo
  visitors: number
  views: number
  demandes: number
  /** null : Google indisponible ce jour-là (on n'affiche pas de chiffre) */
  googleImpressions: number | null
  best: { query: string; place: number } | null
  advice: { title: string; text: string } | null
  statsUrl: string
  publicUrl: string | null
}

const nf = (n: number) => n.toLocaleString('fr-FR').replace(/ | /g, ' ')
const plural = (n: number, one: string, many: string) => `${nf(n)} ${n > 1 ? many : one}`

export function buildProMonthlyEmail(i: MonthlyInput): { subject: string; preview: string; html: string } {
  const de = deMonth(i.month.label)
  const subject = `Ton mois ${de} sur Jason Marinho`
  const hello = i.firstName ? `Bonjour ${escHtml(i.firstName)},` : 'Bonjour,'
  const optOut = 'Tu reçois ce bilan parce que ta fiche est dans l’annuaire. Pour ne plus le recevoir, décoche « Recevoir mon bilan chaque mois par e-mail » en bas de ta page Mes statistiques.'
  const btn = emailBtn(i.statsUrl, 'Voir mes statistiques')

  if (i.visitors === 0 && i.views === 0) {
    const share = i.publicUrl
      ? `Partage le lien de ta fiche à tes clients, dans ta signature d’e-mail et dans les groupes Facebook d’hôtes de ta région : <a href="${escHtml(i.publicUrl)}" style="color:#004C3F;font-weight:600;">${escHtml(i.publicUrl.replace(/^https:\/\//, ''))}</a>`
      : 'Dès que ta fiche est en ligne, partage son lien à tes clients et dans les groupes Facebook d’hôtes de ta région.'
    const body = [
      emailP(hello),
      emailP(`Ta fiche n’a pas encore reçu de visite en ${escHtml(i.month.label)}. C’est fréquent au début : Google met souvent 2 à 4 semaines à montrer une nouvelle page.`),
      emailP(`En attendant, chaque partage compte. ${share}`),
      i.demandes > 0 ? emailP(`Bonne nouvelle quand même : ${plural(i.demandes, 'demande reçue', 'demandes reçues')} sur le mois.`) : '',
      btn,
      emailNote(optOut),
    ].join('')
    return { subject, preview: 'Ta fiche démarre : comment lui amener ses premiers visiteurs.', html: buildEmail({ title: `Ton mois ${de}`, body, preview: 'Ta fiche démarre : comment lui amener ses premiers visiteurs.' }) }
  }

  const rows = [
    { label: 'Visiteurs', value: nf(i.visitors) },
    { label: 'Vues de ta fiche', value: nf(i.views) },
    { label: 'Demandes reçues', value: nf(i.demandes) },
    ...(i.googleImpressions !== null ? [{ label: 'Vu sur Google', value: `${nf(i.googleImpressions)} fois` }] : []),
  ]
  const preview = `${plural(i.visitors, 'visiteur', 'visiteurs')}, ${plural(i.demandes, 'demande', 'demandes')} en ${i.month.label}.`
  const body = [
    emailP(hello),
    emailP(`Voici le bilan ${de} de ta fiche ${i.metier === 'photographe' ? 'photographe' : 'équipe de ménage'} dans l’annuaire de Jason Marinho.`),
    emailInfoBlock(rows),
    i.best ? emailP(`Ta meilleure recherche sur Google : <strong>« ${escHtml(i.best.query)} »</strong>, où ta fiche est en moyenne ${i.best.place === 1 ? '1re' : `${i.best.place}e`}.`) : '',
    i.advice ? emailP(`<strong>Le conseil du mois : ${escHtml(i.advice.title)}.</strong> ${escHtml(i.advice.text)}`) : '',
    btn,
    emailNote(`Google publie ses chiffres avec 2 jours de retard : les derniers jours du mois s’ajoutent dans Mes statistiques. ${optOut}`),
  ].join('')
  return { subject, preview, html: buildEmail({ title: `Ton mois ${de}`, body, preview }) }
}
