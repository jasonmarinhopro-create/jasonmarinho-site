// Newsletter mensuelle automatique (11/10/2026, demande de Jason : « l'objectif
// c'est que tout soit automatisé »). Pur et testé (build.test.ts) : calendrier,
// lecture du flux RSS du blog, composition de la lettre. Envoi : run.ts.
//
// Contenu repris de ce qui est déjà publié et vérifié : actualités du mois
// (veille quotidienne dédoublonnée), articles du blog (rss.xml), nouveautés de
// l'app (CHANGELOG), plus les rubriques fixes en rotation (outil du mois, bon
// plan partenaire, question du mois). Maquette : template.ts.
import { renderIssue, withUtm, monthIndex, NEWSLETTER_NAME, type IssueStory } from './template'
import { EDITION_CONFIG, type Edition } from './editions'
import { actusForEdition, concernsAudience } from '@/lib/actualites/audience'

export interface NlActu { id: string; title: string; summary: string | null; category: string | null; source_url: string | null; published_at: string | null; deadline_date?: string | null; audience?: string[] | null }
export interface NlArticle { title: string; link: string; description: string; pubDate: string; category?: string }
export interface NlChange { title: string; description: string; date: string }

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export const monthKey = (parisDate: string) => parisDate.slice(0, 7)
export const monthLabel = (parisDate: string) => `${MONTHS[Number(parisDate.slice(5, 7)) - 1]} ${parisDate.slice(0, 4)}`

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Jour de préparation : le premier lundi du mois (heure de Paris) */
export function isPreparationDay(parisDate: string): boolean {
  const d = new Date(`${parisDate}T12:00:00Z`)
  return d.getUTCDay() === 1 && d.getUTCDate() <= 7
}

/** Heure d'envoi : le lendemain à 9 h 30, heure de Paris, en ISO (UTC) */
export function sendAt(parisDate: string): string {
  const day = addDays(parisDate, 1)
  // Décalage de Paris ce jour-là (+01:00 l'hiver, +02:00 l'été)
  const probe = new Date(`${day}T12:00:00Z`)
  const parisHour = Number(probe.toLocaleString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }))
  const offset = parisHour - 12
  const d = new Date(`${day}T09:30:00Z`)
  d.setUTCHours(d.getUTCHours() - offset)
  return d.toISOString()
}

const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .trim()

/** Articles du flux RSS du blog */
export function parseRss(xml: string): NlArticle[] {
  const items: NlArticle[] = []
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const tag = (t: string) => decode(m[1].match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1] ?? '')
    const link = tag('link')
    if (!/^https:\/\/jasonmarinho\.com\//.test(link)) continue
    const category = tag('category')
    items.push({ title: tag('title'), link, description: tag('description'), pubDate: tag('pubDate'), ...(category ? { category } : {}) })
  }
  return items
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Espaces insécables dans les nombres et devant € et % (pas de « 10 / 000 € » coupé) */
const nb = (s: string) => s.replace(/(\d) (\d{3})/g, '$1 $2').replace(/(\d) (€|%)/g, '$1 $2')
const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, '')}…`)
const firstSentences = (s: string, n: number) => {
  const parts = s.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/)
  let out = ''
  for (const p of parts) { if ((out + ' ' + p).trim().length > n) break; out = `${out} ${p}`.trim() }
  return out || cut(s, n)
}

export { withUtm }

const CATEGORY_LABEL: Record<string, string> = {
  reglementation: 'Réglementation', fiscalite: 'Fiscalité', juridique: 'Juridique', plateformes: 'Plateformes',
  marche: 'Marché', outils: 'Outils', gites: 'Gîtes et meublés', 'chambres-hotes': "Chambres d'hôtes",
  conciergerie: 'Conciergeries', 'reservation-directe': 'Réservation directe', communes: 'Communes', driing: 'Driing', general: 'Actualité',
  'photo-video': 'Photo et vidéo', menage: 'Ménage', entreprise: 'Ton entreprise',
}
const categoryLabel = (c: string | null) => (c ? CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1) : 'Actualité')

export interface Newsletter { subject: string; preheader: string; html: string; counts: { actus: number; articles: number; changes: number } }

const hostOf = (url: string | null) => {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

/**
 * Un chiffre parlant (« 15,5 % », « 10 000 € », « 120 nuits »), jamais une année
 * seule. Cherché d'abord dans les résumés, avec la phrase qui le contient comme
 * légende (sinon le titre). Les actualités autres que la une passent d'abord,
 * pour ne pas répéter le grand titre.
 */
export function pickFigure(actus: NlActu[]): { value: string; caption: string } | null {
  const re = /(\d{1,3}(?:[ \u00a0.]\d{3})*(?:,\d+)?)\s?(%|€|euros|nuits|jours)/i
  const order = [...actus.slice(1), ...actus.slice(0, 1)]
  const make = (m: RegExpMatchArray) => `${m[1].replace(/[ .]/g, '\u00a0')}\u00a0${m[2].toLowerCase() === 'euros' ? '€' : m[2]}`
  for (const a of order) {
    const sentences = (a.summary ?? '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/)
    for (const sentence of sentences) {
      const m = sentence.match(re)
      if (m) return { value: make(m), caption: nb(sentence.trim()) }
    }
  }
  for (const a of order) {
    const m = a.title.match(re)
    if (m) return { value: make(m), caption: nb(a.title) }
  }
  return null
}

const DAY_FR = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/**
 * Compose la lettre. `actus`, `articles`, `changes` : déjà filtrés sur le
 * mois écoulé ; la une + 3 actualités, 3 articles, 3 nouveautés au plus.
 * `issueNumber` : numéro de la lettre (null : non affiché).
 */
export function buildNewsletter(input: { parisDate: string; actus: NlActu[]; articles: NlArticle[]; changes: NlChange[]; issueNumber?: number | null; edition?: Edition }): Newsletter | null {
  const edition = input.edition ?? 'hote'
  const cfg = EDITION_CONFIG[edition]
  // Actualités : celles qui parlent le plus à ce public d'abord (tri stable)
  // Public de l'actu (17/10/2026) : la lettre des hôtes n'a pas les actus des
  // pros ; celle des pros met les actus de leur métier en tête.
  const own = (a: NlActu) => (edition === 'photographe' || edition === 'menage' || edition === 'depannage') && concernsAudience(a, edition)
  const rank = (a: NlActu) => (own(a) ? 0 : 2) + (cfg.leadCategories.includes(a.category ?? '') ? 0 : 1)
  const actus = actusForEdition(input.actus, edition).filter(a => a.title && a.summary).map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i).map(x => x.a).slice(0, 4)
  // Articles et nouveautés propres à ce public, complétés par les plus récents
  const pick = <T,>(list: T[], match: RegExp | null, text: (t: T) => string, max: number, fill: number) => {
    if (!match) return list.slice(0, max)
    const own = list.filter(t => match.test(text(t)))
    return [...own, ...list.filter(t => !own.includes(t))].slice(0, Math.max(Math.min(own.length, max), Math.min(fill, list.length)))
  }
  const articles = pick(input.articles, cfg.articleMatch, a => `${a.title} ${a.description} ${a.category ?? ''}`, 3, 2)
  const changes = cfg.changeMatch ? input.changes.filter(c => cfg.changeMatch!.test(`${c.title} ${c.description}`)).slice(0, 3) : input.changes.slice(0, 3)
  // Pas assez de matière : on n'envoie rien plutôt qu'une lettre creuse
  if (actus.length + articles.length < 3) return null

  const campaign = `lettre-${monthKey(input.parisDate)}${edition === 'hote' ? '' : `-${edition}`}`
  const mois = monthLabel(input.parisDate)
  const moisCap = mois.charAt(0).toUpperCase() + mois.slice(1)
  const m = monthIndex(input.parisDate)
  const story = (a: NlActu, len: number): IssueStory => ({
    category: categoryLabel(a.category),
    title: nb(a.title),
    summary: nb(firstSentences(a.summary ?? '', len)),
    url: withUtm(a.source_url && /^https?:\/\//.test(a.source_url) ? a.source_url : 'https://app.jasonmarinho.com/dashboard/actualites', campaign),
    source: hostOf(a.source_url),
  })

  // La une : la première actualité, sinon le premier article
  const lead: IssueStory = actus[0]
    ? story(actus[0], 320)
    : { category: articles[0].category ?? 'Le guide du mois', title: nb(articles[0].title), summary: nb(cut(articles[0].description, 260)), url: withUtm(articles[0].link, campaign), source: null }
  const more = actus.slice(1).map(a => story(a, 260))
  const restArticles = actus[0] ? articles : articles.slice(1)

  const agenda = input.actus
    .filter(a => a.deadline_date && a.deadline_date.slice(0, 10) >= input.parisDate && a.deadline_date.slice(0, 10) <= addDays(input.parisDate, 90))
    .sort((a, b) => (a.deadline_date ?? '').localeCompare(b.deadline_date ?? ''))
    .slice(0, 4)
    .map(a => ({ date: DAY_FR(a.deadline_date!), title: nb(a.title) }))

  const tldr = [
    lead.title,
    ...more.slice(0, 1).map(s => s.title),
    ...(restArticles[0] ? [`À lire : ${nb(restArticles[0].title)}`] : changes[0] ? [`Nouveau dans l'app : ${nb(changes[0].title)}`] : []),
  ].slice(0, 3)

  const tool = { ...cfg.tools[m % cfg.tools.length] }
  tool.url = withUtm(tool.url, campaign)
  const partner = { ...cfg.partners[(m + 3) % cfg.partners.length] }
  partner.url = withUtm(partner.url, campaign)

  const words = [lead.summary, ...more.map(s => s.summary), ...restArticles.map(a => a.description), ...changes.map(c => c.description)].join(' ').split(/\s+/).length
  const subject = lead.title.length <= 70 ? lead.title : `${NEWSLETTER_NAME} de ${mois} : ce qui change pour ta location`
  const preheader = cut(`En 30 secondes : ${tldr.map(t => cut(t, 55)).join(' · ')}`, 140)

  const html = renderIssue({
    campaign, issueNumber: input.issueNumber ?? null, mois: moisCap, subject, preheader,
    tagline: cfg.tagline, reason: cfg.reason, appUrl: cfg.appUrl, appCta: cfg.appCta, ps: cfg.ps,
    readMinutes: Math.max(3, Math.round(words / 200) + 1),
    lead, tldr, figure: pickFigure(actus), more, agenda, tool, partner,
    articles: restArticles.map(a => ({ category: a.category ?? 'Guide', title: nb(a.title), desc: nb(cut(a.description, 190)), url: withUtm(a.link, campaign) })),
    changes: changes.map(c => ({ title: nb(c.title), desc: nb(firstSentences(c.description, 170)) })),
    question: cfg.questions[m % cfg.questions.length],
  })

  return { subject, preheader, html, counts: { actus: actus.length, articles: articles.length, changes: changes.length } }
}
