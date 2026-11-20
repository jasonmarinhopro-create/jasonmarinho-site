// Bilan mensuel « Ton mois sur Jason Marinho » des pros (05/10/2026).
// Contenu pur (testé, pro-monthly.test.ts) : quel mois, à qui, et le texte de
// l'e-mail. L'envoi est dans lib/email/pro-monthly.ts (cron quotidien,
// seulement le 1er du mois, heure de Paris). Rien d'inventé : seulement les
// chiffres de « Mes statistiques » sur le mois civil écoulé.
import { buildEmail, emailBtn, emailNote, emailP, emailStats, escHtml, type EmailStat } from '@/lib/email/template'
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

/**
 * Le bilan part le 1er du mois (date de Paris), avec un rattrapage jusqu'au 7
 * (20/11/2026) : le 01/11/2026, aucun bilan n'était parti et rien ne
 * permettait de rattraper. Chaque fiche ne le reçoit qu'une fois (drapeau).
 */
export const MONTHLY_CATCHUP_DAYS = 7
export const isMonthlySendDay = (today: string) => Number(today.slice(8, 10)) <= MONTHLY_CATCHUP_DAYS
/** Dernier jour du rattrapage : ce qui n'est pas parti est signalé à Jason */
export const isLastCatchupDay = (today: string) => Number(today.slice(8, 10)) === MONTHLY_CATCHUP_DAYS

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
  /** Évolution par rapport au mois d'avant (null : pas de comparaison juste) */
  pct?: { visitors: number | null; views: number | null; demandes: number | null; google: number | null }
  /** Clics vers le portfolio, le site ou Instagram sur le mois */
  clicks?: number | null
  /** Page de la ville du pro : visiteurs du mois et passages vers sa fiche */
  city?: { label: string; visitors: number; toFiche: number } | null
}

const nf = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')
const plural = (n: number, one: string, many: string) => `${nf(n)} ${n > 1 ? many : one}`
const metierLabel = (m: ProMetier) => m === 'photographe' ? 'photographe' : m === 'depannage' ? 'dépannage' : 'équipe de ménage'
const etiquette = (m: ProMetier) => `Ton bilan · ${m === 'photographe' ? 'Photo & vidéo' : m === 'depannage' ? 'Dépannage' : 'Ménage'}`

/** Le petit mot de Jason, selon le mois du pro */
export function monthlyNote(i: Pick<MonthlyInput, 'visitors' | 'demandes' | 'pct'>): string {
  if (i.demandes > 0) return 'Des demandes ce mois-ci, bravo. Pense à répondre vite : les hôtes choisissent souvent le premier pro qui leur écrit. Une question ? Réponds à cet e-mail.'
  if ((i.pct?.visitors ?? 0) > 0) return 'Ta fiche est de plus en plus vue, c’est bon signe. Si tu veux que je jette un œil à ta fiche pour la rendre plus convaincante, réponds simplement à cet e-mail.'
  return 'Je regarde chaque mois ce qui fait venir les hôtes sur les fiches. Si tu veux un avis sur la tienne, réponds simplement à cet e-mail : c’est moi qui lis.'
}

export function buildProMonthlyEmail(i: MonthlyInput): { subject: string; preview: string; html: string } {
  const de = deMonth(i.month.label)
  const subject = `Ton mois ${de} sur Jason Marinho`
  const hello = i.firstName ? `Bonjour ${escHtml(i.firstName)},` : 'Bonjour,'
  const optOut = 'Tu reçois ce bilan parce que ta fiche est dans l’annuaire. Pour ne plus le recevoir, décoche « Recevoir mon bilan chaque mois par e-mail » en bas de ta page Mes statistiques.'
  const btn = emailBtn(i.statsUrl, 'Voir mes statistiques')
  const link = (url: string) => `<a href="${escHtml(url)}" style="color:#004C3F;font-weight:600;">${escHtml(url.replace(/^https:\/\//, ''))}</a>`

  if (i.visitors === 0 && i.views === 0) {
    const share = i.publicUrl
      ? `Partage le lien de ta fiche à tes clients, dans ta signature d’e-mail et dans les groupes Facebook d’hôtes de ta région : ${link(i.publicUrl)}`
      : 'Dès que ta fiche est en ligne, partage son lien à tes clients et dans les groupes Facebook d’hôtes de ta région.'
    const preview = 'Ta fiche démarre : comment lui amener ses premiers visiteurs.'
    const body = [
      emailP(hello, 10),
      emailP(`Ta fiche n’a pas encore reçu de visite en ${escHtml(i.month.label)}. C’est fréquent au début : Google met souvent 2 à 4 semaines à montrer une nouvelle page.`),
      emailP(`En attendant, chaque partage compte. ${share}`),
      i.demandes > 0 ? emailP(`Bonne nouvelle quand même : ${plural(i.demandes, 'demande reçue', 'demandes reçues')} sur le mois.`) : '',
      btn,
      emailNote(optOut),
    ].join('')
    return { subject, preview, html: buildEmail({ etiquette: etiquette(i.metier), title: `Ton mois ${de}`, body, preview, signature: 'Les premières semaines sont les plus calmes. Si tu veux un coup de main pour faire connaître ta fiche, réponds simplement à cet e-mail.' }) }
  }

  const prevLabel = previousMonth(i.month.start).label.split(' ')[0]
  const stats: EmailStat[] = [
    { label: 'Visiteurs', value: nf(i.visitors), pct: i.pct?.visitors ?? null, hint: 'personnes sur ta fiche' },
    { label: 'Demandes reçues', value: nf(i.demandes), pct: i.pct?.demandes ?? null, hint: i.demandes ? 'hôtes qui t’ont écrit' : 'pas encore ce mois-ci' },
    { label: 'Vues de ta fiche', value: nf(i.views), pct: i.pct?.views ?? null, hint: 'visites répétées comprises' },
    ...(i.googleImpressions !== null ? [{ label: 'Vu sur Google', value: `${nf(i.googleImpressions)} fois`, pct: i.pct?.google ?? null, hint: 'dans les résultats de recherche' }] : []),
    ...(i.clicks ? [{ label: 'Clics vers tes liens', value: nf(i.clicks), hint: 'portfolio, site, Instagram' }] : []),
  ]
  const preview = `${plural(i.visitors, 'visiteur', 'visiteurs')}, ${plural(i.demandes, 'demande', 'demandes')} en ${i.month.label}.`
  const hasPct = !!i.pct && Object.values(i.pct).some(v => v !== null)
  const body = [
    emailP(hello, 10),
    emailP(`Voici le bilan ${de} de ta fiche ${metierLabel(i.metier)} dans l’annuaire de Jason Marinho.`),
    emailStats(stats),
    hasPct ? `<p style="margin:0 0 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#5B6B62;">Les pourcentages comparent avec le mois ${escHtml(deMonth(prevLabel).replace("'", '’'))}.</p>` : '',
    i.best ? emailP(`Ta meilleure recherche sur Google : <strong>« ${escHtml(i.best.query)} »</strong>, où ta fiche est en moyenne ${i.best.place === 1 ? '1re' : `${i.best.place}e`}.`) : '',
    i.city && i.city.visitors > 0 ? emailP(`La page ${escHtml(i.city.label)} de l’annuaire a reçu ${plural(i.city.visitors, 'visiteur', 'visiteurs')}${i.city.toFiche ? `, dont ${plural(i.city.toFiche, 'qui est passé', 'qui sont passés')} sur ta fiche` : ''}.`) : '',
    i.advice ? emailP(`<strong>Le conseil du mois : ${escHtml(i.advice.title)}.</strong> ${escHtml(i.advice.text)}`) : '',
    btn,
    emailNote(`Google publie ses chiffres avec 2 jours de retard : les derniers jours du mois s’ajoutent dans Mes statistiques. ${optOut}`),
  ].join('')
  return { subject, preview, html: buildEmail({ etiquette: etiquette(i.metier), title: `Ton mois ${de}`, body, preview, signature: monthlyNote(i) }) }
}

// ─── Récapitulatif pour Jason ─────────────────────────────────────────

export interface MonthlyRecapLine { nom: string; metier: ProMetier; visitors: number; demandes: number; sent: boolean }

/** Récap envoyé à Jason après l'envoi des bilans : combien sont partis, les chiffres de l'annuaire, les fiches qui marchent */
export function buildMonthlyRecapEmail(o: {
  month: MonthInfo
  lines: MonthlyRecapLine[]
  /** Fiches servies depuis le 1er / fiches à servir ce mois-ci */
  served: number
  total: number
  failed: number
  lastDay: boolean
  adminUrl: string
}): { subject: string; html: string } {
  const de = deMonth(o.month.label)
  const sent = o.lines.filter(l => l.sent)
  const visitors = o.lines.reduce((t, l) => t + l.visitors, 0)
  const demandes = o.lines.reduce((t, l) => t + l.demandes, 0)
  const top = [...o.lines].sort((a, b) => b.demandes - a.demandes || b.visitors - a.visitors).slice(0, 5)
  const sansVisite = o.lines.filter(l => l.visitors === 0).length
  const reste = o.total - o.served
  const rows = top.map((l, idx) => `<tr>
<td style="padding:9px 0;border-top:${idx ? '1px solid #E3EBE6' : '0'};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#0F1F17;"><strong>${escHtml(l.nom)}</strong><br><span style="font-size:12px;color:#5B6B62;">${escHtml(metierLabel(l.metier))}</span></td>
<td align="right" style="padding:9px 0;border-top:${idx ? '1px solid #E3EBE6' : '0'};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#2B3A32;white-space:nowrap;">${plural(l.visitors, 'visiteur', 'visiteurs')}<br>${plural(l.demandes, 'demande', 'demandes')}</td></tr>`).join('')
  const body = [
    emailP(`Les bilans ${de} sont partis${reste > 0 ? ' en partie' : ''}. Voici ce que ça donne pour l’annuaire.`),
    emailStats([
      { label: 'Bilans envoyés', value: `${o.served} / ${o.total}`, hint: reste > 0 ? `${reste} encore à envoyer` : 'toutes les fiches payées' },
      { label: 'Visiteurs des fiches', value: nf(visitors), hint: `${o.lines.length} fiche${o.lines.length > 1 ? 's' : ''} de cet envoi` },
      { label: 'Demandes reçues', value: nf(demandes), hint: 'sur l’ensemble des fiches' },
      { label: 'Fiches sans visite', value: nf(sansVisite), hint: sansVisite ? 'à aider à se faire connaître' : 'aucune, bravo' },
    ]),
    top.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rows}</table>` : '',
    o.failed ? emailP(`<strong>${o.failed} envoi${o.failed > 1 ? 's ont' : ' a'} échoué</strong> : nouvel essai demain, jusqu’au ${MONTHLY_CATCHUP_DAYS} du mois.`) : '',
    o.lastDay && reste > 0 ? emailP(`<strong>Dernier jour du rattrapage :</strong> ${reste} fiche${reste > 1 ? 's n’ont' : ' n’a'} pas reçu son bilan. Regarde l’état de santé de l’app.`) : '',
    emailBtn(o.adminUrl, 'Voir les pros dans l’admin'),
  ].join('')
  return {
    subject: `Bilans des pros ${de} : ${o.served}/${o.total} envoyés, ${plural(demandes, 'demande', 'demandes')}`,
    html: buildEmail({ etiquette: 'Pour toi · Annuaire', title: `Les pros en ${escHtml(o.month.label)}`, body, preview: `${sent.length} bilans envoyés, ${nf(visitors)} visiteurs, ${nf(demandes)} demandes` }),
  }
}
