/**
 * Gabarit unique de TOUS les e-mails de l'app (20/11/2026, Jason : « que tout
 * soit sur la même DA, avec la touche humaine, ma tête et un petit texte »).
 *
 * Une seule maquette, celle des e-mails « Trouver un pro » qu'il avait validée
 * (20/10/2026 : « sobre, minimaliste, professionnel et beau ») : fond vert très
 * pâle, carte blanche arrondie, étiquette en pastille, titre Georgia, filet
 * jaune, un bouton principal. Signature facultative avec la photo de Jason.
 *
 * Historique : thème sombre jusqu'au 29/09/2026, puis une première version
 * claire (titre au-dessus du filet, sans étiquette) jusqu'au 20/11/2026.
 * `lightify()` convertit encore les couleurs de l'ancien thème sombre si un
 * corps d'e-mail en contient (garde-fou, plus aucun e-mail n'en écrit).
 *
 * Les e-mails du site statique (bouton Contacter des fiches,
 * scripts/lib/pro-contact-email.cjs) reprennent la même maquette : garder
 * les deux alignés.
 */

export const EMAIL_COLORS = {
  bg: '#F3F6F4',
  card: '#FFFFFF',
  line: '#E3EBE6',
  ink: '#0F1F17',
  text: '#2B3A32',
  soft: '#5B6B62',
  green: '#004C3F',
  tint: '#EEF5F1',
  yellow: '#FFD56B',
  up: '#1F7A4D',
  down: '#9A4A2B',
  warnBg: '#FBF6E8',
  warnLine: '#F1E3BC',
  warnInk: '#8A5A12',
} as const

const C = EMAIL_COLORS
export const EMAIL_SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
export const EMAIL_SERIF = "Georgia,'Times New Roman',serif"
const SANS = EMAIL_SANS
const SERIF = EMAIL_SERIF

/** Expéditeur commun : toujours un nom affiché (jamais « notifications » seul dans la boîte de réception) */
export const EMAIL_FROM = 'Jason Marinho <notifications@jasonmarinho.com>'
/** Les réponses arrivent dans la boîte que Jason lit vraiment */
export const EMAIL_REPLY_TO = 'contact@jasonmarinho.com'
/** Photo de Jason (JPEG 192 px, sur notre domaine : beaucoup de messageries ignorent le WebP) */
export const JASON_PHOTO_URL = 'https://jasonmarinho.com/signature-jason.jpg'

/** Petit mot par défaut sous la signature */
export const DEFAULT_SIGNATURE_NOTE = 'Une question, une idée ? Réponds simplement à cet e-mail, c’est moi qui le lis.'

export interface EmailOptions {
  title: string
  /** HTML de la carte (déjà formaté avec les briques ci-dessous) */
  body: string
  /** Texte d'aperçu (caché, affiché par la messagerie) */
  preview?: string
  /** Pastille au-dessus du titre (« Ta fiche · Photo & vidéo », « Contrat »…) */
  etiquette?: string
  /** Langue du document (e-mails voyageurs en portugais) */
  lang?: string
  /**
   * Signature de Jason avec sa photo. `true` : petit mot par défaut ; une
   * chaîne : ce petit mot-là (HTML). Jamais dans un e-mail voyageur (le
   * voyageur traite avec l'hôte, pas avec Jason).
   */
  signature?: boolean | string
  /** Pied de page (HTML), sinon celui de la marque */
  footer?: string
}

/** Couleurs de l'ancien thème sombre → équivalents lisibles sur fond clair */
const LEGACY_HINT = /#e8ede8|#f0ebe1|#7a9e8a|#a5c4b0|#6b9a7e|#0d1f1a|#132b22/i
const LEGACY_COLORS: Array<[RegExp, string]> = [
  [/#e8ede8|#f0ebe1|#f0f4ff/gi, C.ink],
  [/#7a9e8a|#a5c4b0|#6b9a7e/gi, C.soft],
  [/#FFD56B/gi, C.green],
  [/#0d1f1a/gi, C.bg],
  [/#132b22/gi, C.card],
  [/#0a1a13|#0d1a15|#0e1f18|#060d0b|#0a2018/gi, C.tint],
  [/#1a3328|#1e3d2f/gi, C.line],
  [/#0a0f0d|#061208/gi, '#FFFFFF'],
  [/#63D683|#34D399/gi, C.up],
  [/#F97583/gi, '#C2344A'],
  [/#f59e0b/gi, C.warnInk],
  [/#a29bfe|#8b84e8/gi, C.green],
  [/rgba\(99,\s*91,\s*255,/gi, 'rgba(0,76,63,'],
  [/rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/gi, C.tint],
  [/rgba\(255,\s*255,\s*255,\s*0\.1\d?\)/gi, C.line],
]

/** Ne touche qu'aux corps qui portent encore une couleur de l'ancien thème sombre */
export function lightify(html: string): string {
  if (!LEGACY_HINT.test(html)) return html
  return LEGACY_COLORS.reduce((acc, [re, to]) => acc.replace(re, to), html)
}

const DEFAULT_FOOTER = `Jason Marinho &middot; Location courte durée<br><a href="https://app.jasonmarinho.com" style="color:${C.green};text-decoration:none;font-weight:600;">app.jasonmarinho.com</a> &nbsp;&middot;&nbsp; <a href="https://jasonmarinho.com" style="color:${C.green};text-decoration:none;font-weight:600;">jasonmarinho.com</a>`

export function buildEmail({ title, body, preview = '', etiquette, lang = 'fr', signature, footer }: EmailOptions): string {
  const sig = signature ? emailSignature(typeof signature === 'string' ? signature : DEFAULT_SIGNATURE_NOTE) : ''
  return `<!DOCTYPE html>
<html lang="${escHtml(lang)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escHtml(stripTags(title))}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(preview)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:36px 14px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 6px 18px;font-family:${SERIF};font-size:17px;color:${C.ink};letter-spacing:-0.2px;">Jason <em style="color:${C.green};">Marinho</em></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:34px 30px 30px;">
${etiquette ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.tint};border-radius:999px;padding:5px 11px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${C.green};">${escHtml(etiquette)}</td></tr></table>` : ''}
<h1 style="margin:${etiquette ? 16 : 0}px 0 0;font-family:${SERIF};font-size:26px;line-height:1.25;font-weight:400;color:${C.ink};letter-spacing:-0.4px;">${title}</h1>
<div style="width:36px;height:3px;border-radius:3px;background:${C.yellow};margin:18px 0 22px;font-size:0;line-height:0;">&nbsp;</div>
${lightify(body)}
${sig}
</td></tr>
<tr><td style="padding:22px 8px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.soft};text-align:center;">${footer ?? DEFAULT_FOOTER}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

/** Signature de Jason : photo ronde, prénom, rôle, petit mot */
export function emailSignature(note: string = DEFAULT_SIGNATURE_NOTE): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;border-top:1px solid ${C.line};"><tr><td style="padding:22px 0 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="padding:0 14px 0 0;"><img src="${JASON_PHOTO_URL}" width="52" height="52" alt="Jason Marinho" style="display:block;width:52px;height:52px;border-radius:50%;border:0;"></td>
<td valign="top" style="font-family:${SANS};">
<div style="font-family:${SERIF};font-size:19px;font-style:italic;line-height:1.2;color:${C.green};">Jason</div>
<div style="margin-top:2px;font-size:12.5px;color:${C.soft};">Fondateur de jasonmarinho.com</div>
${note ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:${C.text};">${note}</div>` : ''}
</td></tr></table>
</td></tr></table>`
}

/** Bouton d'action (« bulletproof » : cellule colorée, lisible sous Outlook) */
export function emailBtn(href: string, label: string, variant: 'primary' | 'secondary' | 'green' = 'primary'): string {
  const outline = variant === 'secondary'
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;"><tr><td align="center" style="${outline ? `border:1px solid ${C.green};` : `background:${C.green};`}border-radius:12px;">
<a href="${href}" style="display:block;padding:${outline ? 14 : 15}px 22px;font-family:${SANS};font-size:15px;font-weight:600;color:${outline ? C.green : '#FFFFFF'};text-decoration:none;text-align:center;">${label}</a>
</td></tr></table>`
}

/** Bloc d'informations (libellé / valeur), valeurs déjà échappées par l'appelant */
export function emailInfoBlock(rows: { label: string; value: string }[], accentColor: string = C.green): string {
  const rowsHtml = rows.map(r => `
<tr>
<td style="padding:7px 16px 7px 0;font-size:12.5px;color:${C.soft};font-family:${SANS};white-space:nowrap;vertical-align:top;">${escHtml(r.label)}</td>
<td style="padding:7px 0;font-size:14px;color:${C.ink};font-weight:600;font-family:${SANS};">${r.value}</td>
</tr>`).join('')
  return `<div style="background:${C.tint};border-left:3px solid ${accentColor};border-radius:12px;padding:14px 18px;margin:0 0 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
</div>`
}

/** Le besoin ou le dossier en fiche : libellé discret au-dessus, valeur en dessous, deux par ligne (valeurs en texte brut) */
export function emailFiche(rows: Array<[string, string]>): string {
  if (!rows.length) return ''
  const cell = ([l, v]: [string, string], sep: string) => `<td width="50%" valign="top" style="padding:12px 14px;${sep}">
<div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${C.soft};">${escHtml(l)}</div>
<div style="margin-top:4px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.4;color:${C.ink};">${escHtml(v)}</div></td>`
  const lines: string[] = []
  for (let i = 0; i < rows.length; i += 2) {
    const sep = i ? `border-top:1px solid ${C.line};` : ''
    lines.push(`<tr>${cell(rows[i], sep)}${rows[i + 1] ? cell(rows[i + 1], sep) : `<td width="50%" style="${sep}"></td>`}</tr>`)
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px;border-collapse:separate;margin:0 0 20px;">${lines.join('')}</table>`
}

export interface EmailStat {
  label: string
  /** Valeur déjà formatée (« 1 240 ») */
  value: string
  /** Évolution en % par rapport à la période précédente ; null = pas de comparaison juste */
  pct?: number | null
  /** Petite ligne sous le chiffre (« contre 12 en septembre ») */
  hint?: string
}

/** Variation affichée : « +12 % » vert, « -8 % » brique, « = » gris */
export function formatPct(pct: number): { text: string; color: string } {
  const r = Math.round(pct)
  if (r === 0) return { text: '=', color: C.soft }
  return { text: `${r > 0 ? '+' : '-'}${Math.abs(r)} %`, color: r > 0 ? C.up : C.down }
}

/** Tuiles de chiffres, deux par ligne : grand chiffre, libellé, évolution */
export function emailStats(stats: EmailStat[]): string {
  if (!stats.length) return ''
  const tile = (s: EmailStat, left: boolean) => {
    const evo = s.pct === null || s.pct === undefined ? '' : (() => {
      const f = formatPct(s.pct)
      return `<span style="display:inline-block;margin-left:8px;font-family:${SANS};font-size:12px;font-weight:700;color:${f.color};vertical-align:middle;">${f.text}</span>`
    })()
    return `<td width="50%" valign="top" style="padding:${left ? '0 5px 10px 0' : '0 0 10px 5px'};">
<div style="background:${C.tint};border-radius:14px;padding:16px 16px 14px;">
<div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${C.soft};">${escHtml(s.label)}</div>
<div style="margin-top:6px;"><span style="font-family:${SERIF};font-size:30px;line-height:1.1;color:${C.ink};vertical-align:middle;">${escHtml(s.value)}</span>${evo}</div>
${s.hint ? `<div style="margin-top:4px;font-family:${SANS};font-size:12px;line-height:1.5;color:${C.soft};">${escHtml(s.hint)}</div>` : ''}
</div></td>`
  }
  const rows: string[] = []
  for (let i = 0; i < stats.length; i += 2) {
    rows.push(`<tr>${tile(stats[i], true)}${stats[i + 1] ? tile(stats[i + 1], false) : '<td width="50%"></td>'}</tr>`)
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">${rows.join('')}</table>`
}

/** Étapes numérotées (« ce qui se passe ensuite ») ; textes en HTML */
export function emailEtapes(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">${items.map((t, i) => `<tr>
<td width="30" valign="top" style="padding:6px 0;"><div style="width:22px;height:22px;border-radius:22px;border:1px solid ${C.line};font-family:${SANS};font-size:12px;font-weight:600;line-height:22px;text-align:center;color:${C.green};">${i + 1}</div></td>
<td valign="top" style="padding:7px 0 6px 6px;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.text};">${t}</td></tr>`).join('')}</table>`
}

/** Citation (message d'un membre), texte brut */
export function emailCitation(message: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
<td width="3" style="background:${C.yellow};border-radius:3px;font-size:0;">&nbsp;</td>
<td style="padding:2px 0 2px 16px;font-family:${SERIF};font-size:16px;font-style:italic;line-height:1.6;color:${C.ink};">${escHtml(message).replace(/\n/g, '<br>')}</td>
</tr></table>`
}

/** Encadré d'alerte douce (délai, déclaration obligatoire…) ; HTML */
export function emailAlert(title: string, text: string): string {
  return `<div style="background:${C.warnBg};border:1px solid ${C.warnLine};border-radius:14px;padding:14px 18px;margin:0 0 20px;">
<div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${C.warnInk};">${title}</div>
<div style="margin-top:6px;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.text};">${text}</div>
</div>`
}

/** Note (sécurité, mention légale…) */
export function emailNote(text: string): string {
  return `<p style="margin:20px 0 0;font-family:${SANS};font-size:12.5px;line-height:1.7;color:${C.soft};">${text}</p>`
}

/** Paragraphe */
export function emailP(text: string, marginBottom = 16): string {
  return `<p style="margin:0 0 ${marginBottom}px;font-size:15px;line-height:1.65;color:${C.text};font-family:${SANS};">${text}</p>`
}

/** Petit texte gris */
export function emailSmall(text: string): string {
  return `<p style="margin:0 0 12px;font-family:${SANS};font-size:13px;line-height:1.65;color:${C.soft};">${text}</p>`
}

/** Lien de la marque */
export function emailLink(href: string, label: string): string {
  return `<a href="${escHtml(href)}" style="color:${C.green};font-weight:600;text-decoration:none;">${label}</a>`
}

/** Échappement HTML simple */
export function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
}

/** Version texte d'un e-mail HTML (envoyée avec le HTML : aide Gmail à bien le classer) */
export function htmlToText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, '')
    .replace(/<a [^>]*href="(https?:[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const l = label.replace(/<[^>]*>/g, '').trim()
      return l && l !== href ? `${l} (${href})` : href
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|tr|table)>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&rsquo;/g, '’').replace(/&zwnj;/g, '')
    .replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).filter((l, i, a) => l || (a[i - 1] ?? '') !== '')
    .join('\n').trim()
}

/**
 * Encart annuaires (photographes + ménage + dépannage) à glisser dans les
 * e-mails destinés aux HÔTES, jamais dans les e-mails voyageurs.
 */
export function emailAnnuairesPromo(): string {
  const link = (href: string, label: string) => emailLink(href, label)
  return `<div style="background:${C.tint};border-radius:14px;padding:16px 18px;margin:24px 0 0;">
<p style="margin:0 0 8px;font-size:13.5px;font-weight:600;color:${C.ink};font-family:${SANS};">Besoin d’un coup de main pour ton logement&nbsp;?</p>
<p style="margin:0;font-size:13px;color:${C.soft};line-height:1.7;font-family:${SANS};">
${link('https://jasonmarinho.com/annuaires/photographes', 'Photographes LCD')} : des photos pro pour ton annonce<br>
${link('https://jasonmarinho.com/annuaires/menage', 'Équipes de ménage LCD')} : un ménage fiable entre deux voyageurs<br>
Contact direct, sans commission.
</p>
</div>`
}
