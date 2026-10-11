// Newsletter mensuelle automatique (11/10/2026, demande de Jason : « l'objectif
// c'est que tout soit automatisé »). Pur et testé (build.test.ts) : calendrier,
// lecture du flux RSS du blog, composition de la lettre. Envoi : run.ts.
//
// Contenu repris de ce qui est déjà publié et vérifié : actualités du mois
// (veille quotidienne dédoublonnée), articles du blog (rss.xml), nouveautés de
// l'app (CHANGELOG). Mise en page sobre et surtout textuelle (délivrabilité),
// liens avec utm_source=newsletter, {{ unsubscribe }} et {{ mirror }} remplacés
// par Brevo.

export interface NlActu { id: string; title: string; summary: string | null; category: string | null; source_url: string | null; published_at: string | null }
export interface NlArticle { title: string; link: string; description: string; pubDate: string }
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
    items.push({ title: tag('title'), link, description: tag('description'), pubDate: tag('pubDate') })
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

export function withUtm(url: string, campaign: string): string {
  try {
    const u = new URL(url)
    if (!/(^|\.)jasonmarinho\.com$/.test(u.hostname)) return url
    u.searchParams.set('utm_source', 'newsletter')
    u.searchParams.set('utm_medium', 'email')
    u.searchParams.set('utm_campaign', campaign)
    return u.toString()
  } catch { return url }
}

const CATEGORY_LABEL: Record<string, string> = {
  reglementation: 'Réglementation', fiscalite: 'Fiscalité', juridique: 'Juridique', plateformes: 'Plateformes',
  marche: 'Marché', outils: 'Outils', gites: 'Gîtes et meublés', 'chambres-hotes': "Chambres d'hôtes",
  conciergerie: 'Conciergeries', 'reservation-directe': 'Réservation directe', communes: 'Communes', driing: 'Driing', general: 'Actualité',
}
const categoryLabel = (c: string | null) => (c ? CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1) : 'Actualité')

export interface Newsletter { subject: string; preheader: string; html: string; counts: { actus: number; articles: number; changes: number } }

/**
 * Compose la lettre. `actus`, `articles`, `changes` : déjà filtrés sur le
 * mois écoulé ; on garde 4 actualités, 3 articles, 3 nouveautés au plus.
 */
export function buildNewsletter(input: { parisDate: string; actus: NlActu[]; articles: NlArticle[]; changes: NlChange[] }): Newsletter | null {
  const actus = input.actus.filter(a => a.title && a.summary).slice(0, 4)
  const articles = input.articles.slice(0, 3)
  const changes = input.changes.slice(0, 3)
  // Pas assez de matière : on n'envoie rien plutôt qu'une lettre creuse
  if (actus.length + articles.length < 3) return null

  const campaign = `lettre-${monthKey(input.parisDate)}`
  const mois = monthLabel(input.parisDate)
  const font = "font-family:Helvetica,Arial,sans-serif;"
  const serif = "font-family:Georgia,'Times New Roman',serif;font-weight:normal;"
  const link = (href: string, label: string) => `<a href="${esc(withUtm(href, campaign))}" style="color:#004C3F;font-weight:bold;">${esc(label)}</a>`
  const section = (eyebrow: string, title: string, body: string, first = false) => `
<tr><td style="padding:${first ? '10px' : '4px'} 32px 4px;${font}font-size:15.5px;line-height:1.65;color:#1F2A24;${first ? '' : 'border-top:1px solid #E3EDE7;'}">
  <p style="margin:${first ? '0' : '18px'} 0 4px;font-size:12px;font-weight:bold;letter-spacing:.8px;text-transform:uppercase;color:#B7791F;">${esc(eyebrow)}</p>
  <h2 style="margin:0 0 10px;${serif}font-size:21px;line-height:1.3;color:#004C3F;">${esc(nb(title))}</h2>
  ${body}
</td></tr>`

  const actuBlocks = actus.map((a, i) => section(
    `${i + 1} · ${categoryLabel(a.category)}`,
    a.title,
    `<p style="margin:0 0 12px;">${esc(nb(firstSentences(a.summary ?? '', 420)))}</p>
  <p style="margin:0 0 18px;">${link(a.source_url && /^https?:\/\//.test(a.source_url) ? a.source_url : 'https://app.jasonmarinho.com/dashboard/actualites', a.source_url ? 'Lire la source' : 'Lire dans l\'app')}</p>`,
    i === 0,
  )).join('')

  const articleBlock = articles.length ? section('À lire sur le blog', articles.length > 1 ? 'Les nouveaux guides du mois' : 'Le nouveau guide du mois', articles.map(a =>
    `<p style="margin:0 0 4px;"><strong>${esc(nb(a.title))}</strong></p>
  <p style="margin:0 0 6px;color:#3C4B43;">${esc(nb(cut(a.description, 200)))}</p>
  <p style="margin:0 0 14px;">${link(a.link, 'Lire l\'article')}</p>`).join(''), !actus.length) : ''

  const changeBlock = changes.length ? `
<tr><td style="padding:4px 32px 8px;${font}font-size:15px;line-height:1.6;color:#1F2A24;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F4EA;border-radius:12px;"><tr><td style="padding:16px 18px;">
    <p style="margin:0 0 8px;${serif}font-size:18px;color:#004C3F;">Nouveau dans l'app</p>
    ${changes.map(c => `<p style="margin:0 0 6px;">• <strong>${esc(nb(c.title))}</strong> : ${esc(nb(firstSentences(c.description, 200)))}</p>`).join('\n    ')}
    <p style="margin:8px 0 0;">${link('https://app.jasonmarinho.com/dashboard', 'Ouvrir l\'app')}</p>
  </td></tr></table>
</td></tr>` : ''

  const topics = [...actus.map(a => a.title), ...articles.map(a => a.title)]
  const lead = actus[0]?.title ?? articles[0]?.title ?? ''
  const subject = lead.length <= 70 ? lead : `Ce qui change pour ta location en ${mois}`
  const preheader = cut(`Ce mois-ci : ${topics.slice(0, 3).map(t => cut(t, 60)).join(' · ')}`, 140)

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ECF5EF;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECF5EF;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:14px;border-collapse:separate;">
<tr><td style="padding:26px 32px 10px;${font}">
  <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#4E6B5E;">La lettre des hôtes · ${esc(mois.charAt(0).toUpperCase() + mois.slice(1))}</p>
  <h1 style="margin:10px 0 0;${serif}font-size:27px;line-height:1.25;color:#004C3F;">Ce qui change pour ta location ce mois-ci</h1>
  <div style="height:3px;width:56px;background:#FFD56B;margin:16px 0 0;line-height:3px;font-size:1px;">&nbsp;</div>
</td></tr>
<tr><td style="padding:14px 32px 4px;${font}font-size:15.5px;line-height:1.65;color:#1F2A24;">
  <p style="margin:0 0 14px;">Bonjour,</p>
  <p style="margin:0 0 14px;">L'essentiel du mois pour les hôtes, en quelques minutes : ce qui a changé, ce qu'il faut vérifier, et les nouveaux guides.</p>
</td></tr>
${actuBlocks}
${articleBlock}
${changeBlock}
<tr><td style="padding:14px 32px 26px;${font}font-size:15.5px;line-height:1.65;color:#1F2A24;">
  <p style="margin:0 0 12px;"><strong>Une question, un sujet à traiter ?</strong> Réponds simplement à cet e-mail : je lis toutes les réponses et je m'en sers pour choisir les sujets du mois prochain.</p>
  <p style="margin:0;">À bientôt,<br><strong>Jason</strong><br><span style="color:#4E6B5E;">jasonmarinho.com · contrats, planning ménage, finances et savoir pour les hôtes</span></p>
</td></tr>
</table>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:18px 32px;${font}font-size:12px;line-height:1.6;color:#4E6B5E;text-align:center;">
  Tu reçois cette lettre parce que tu t'es inscrit à la newsletter sur jasonmarinho.com ou dans l'app.<br>
  Jason Marinho · 75015 Paris · <a href="mailto:contact@jasonmarinho.com" style="color:#4E6B5E;">contact@jasonmarinho.com</a><br>
  <a href="{{ mirror }}" style="color:#4E6B5E;">Voir dans le navigateur</a> · <a href="{{ unsubscribe }}" style="color:#4E6B5E;">Se désinscrire en un clic</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`

  return { subject, preheader, html, counts: { actus: actus.length, articles: articles.length, changes: changes.length } }
}
