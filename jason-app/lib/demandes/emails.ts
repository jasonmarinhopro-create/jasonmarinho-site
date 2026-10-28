// E-mails de la demande inversée (« Trouver un pro ») : au pro, à l'hôte, à Jason.
// Gabarit propre à ces e-mails (20/10/2026, Jason : « sobre, minimaliste, professionnel et beau ») :
// une carte blanche, une étiquette, un titre, le besoin en fiche, un seul bouton principal.
// Fonctions pures (testées), sans envoi : send.ts les appelle.

import { escHtml } from '@/lib/email/template'
import { etablissementLabel } from '@/lib/pros/clienteles'

const BG = '#F3F6F4'
const CARD = '#FFFFFF'
const LINE = '#E3EBE6'
const INK = '#0F1F17'
const SOFT = '#5B6B62'
const GREEN = '#004C3F'
const TINT = '#EEF5F1'
const YELLOW = '#FFD56B'
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
const SERIF = "Georgia,'Times New Roman',serif"

export type DemandeMailMetier = 'photographe' | 'menage'

export interface DemandeMail {
  metier: DemandeMailMetier
  /** Type d'hébergement (hôtel, conciergerie, gîte…) ; absent = logement d'un hôte */
  etablissement?: string | null
  ville: string
  logement: string | null
  quand: string | null
  frequence: string | null
  budget: string | null
  message: string | null
  nom: string
  email: string
  telephone: string | null
}

export interface ProMail { nom: string; ville: string | null; url: string }

const METIER = {
  photographe: { etiquette: 'Photo & vidéo', un: 'un photographe', labels: 'photographes' },
  menage: { etiquette: 'Ménage', un: 'une équipe de ménage', labels: 'équipes de ménage' },
} as const

const prenom = (nom: string) => (nom.trim().split(/\s+/)[0] || '').replace(/^./, c => c.toUpperCase())
const initiales = (nom: string) => nom.split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || '?'
const telHref = (t: string) => `tel:${t.replace(/[^\d+]/g, '')}`

// ── Briques ──────────────────────────────────────────────────────────

function layout({ preview, etiquette, title, body, footer }: { preview: string; etiquette: string; title: string; body: string; footer: string }): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(preview)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
<tr><td align="center" style="padding:36px 14px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 6px 18px;font-family:${SERIF};font-size:17px;color:${INK};letter-spacing:-0.2px;">Jason <em style="color:${GREEN};">Marinho</em></td></tr>
<tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:20px;padding:34px 30px 30px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${TINT};border-radius:999px;padding:5px 11px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${GREEN};">${escHtml(etiquette)}</td></tr></table>
<h1 style="margin:16px 0 0;font-family:${SERIF};font-size:26px;line-height:1.25;font-weight:400;color:${INK};letter-spacing:-0.4px;">${escHtml(title)}</h1>
<div style="width:36px;height:3px;border-radius:3px;background:${YELLOW};margin:18px 0 22px;font-size:0;line-height:0;">&nbsp;</div>
${body}
</td></tr>
<tr><td style="padding:22px 8px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${SOFT};text-align:center;">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

const p = (html: string, mb = 18) => `<p style="margin:0 0 ${mb}px;font-family:${SANS};font-size:15px;line-height:1.65;color:#2B3A32;">${html}</p>`
const small = (html: string) => `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.65;color:${SOFT};">${html}</p>`
const link = (href: string, label: string) => `<a href="${escHtml(href)}" style="color:${GREEN};font-weight:600;text-decoration:none;">${label}</a>`

/** Bouton secondaire (contour), sous le bouton principal */
function buttonOutline(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 0;"><tr><td align="center" style="border:1px solid ${GREEN};border-radius:12px;">
<a href="${escHtml(href)}" style="display:block;padding:14px 22px;font-family:${SANS};font-size:15px;font-weight:600;color:${GREEN};text-decoration:none;text-align:center;">${escHtml(label)}</a>
</td></tr></table>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0;"><tr><td align="center" style="background:${GREEN};border-radius:12px;">
<a href="${escHtml(href)}" style="display:block;padding:15px 22px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;text-align:center;">${escHtml(label)}</a>
</td></tr></table>`
}

/** Le besoin en fiche : libellé discret au-dessus, valeur en dessous, deux par ligne */
function fiche(rows: Array<[string, string]>): string {
  if (!rows.length) return ''
  const cell = ([l, v]: [string, string], sep: string) => `<td width="50%" valign="top" style="padding:12px 14px;${sep}">
<div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${SOFT};">${escHtml(l)}</div>
<div style="margin-top:4px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.4;color:${INK};">${escHtml(v)}</div></td>`
  const lines: string[] = []
  for (let i = 0; i < rows.length; i += 2) {
    const sep = i ? `border-top:1px solid ${LINE};` : ''
    lines.push(`<tr>${cell(rows[i], sep)}${rows[i + 1] ? cell(rows[i + 1], sep) : `<td width="50%" style="${sep}"></td>`}</tr>`)
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:14px;border-collapse:separate;margin:0 0 20px;">${lines.join('')}</table>`
}

function citation(message: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
<td width="3" style="background:${YELLOW};border-radius:3px;font-size:0;">&nbsp;</td>
<td style="padding:2px 0 2px 16px;font-family:${SERIF};font-size:16px;font-style:italic;line-height:1.6;color:${INK};">${escHtml(message).replace(/\n/g, '<br>')}</td>
</tr></table>`
}

function contact(d: DemandeMail): string {
  const lignes = [
    `<a href="mailto:${escHtml(d.email)}" style="color:${GREEN};text-decoration:none;">${escHtml(d.email)}</a>`,
    d.telephone ? `<a href="${escHtml(telHref(d.telephone))}" style="color:${GREEN};text-decoration:none;">${escHtml(d.telephone)}</a>` : '',
  ].filter(Boolean).join('<br>')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${TINT};border-radius:14px;margin:0 0 22px;"><tr>
<td width="44" valign="middle" style="padding:14px 0 14px 16px;"><div style="width:40px;height:40px;border-radius:40px;background:${GREEN};color:#FFFFFF;font-family:${SERIF};font-size:16px;line-height:40px;text-align:center;">${escHtml(initiales(d.nom))}</div></td>
<td valign="middle" style="padding:14px 16px 14px 12px;"><div style="font-family:${SANS};font-size:15px;font-weight:600;color:${INK};">${escHtml(d.nom)}</div>
<div style="margin-top:2px;font-family:${SANS};font-size:13px;color:${SOFT};">${lignes}</div></td>
</tr></table>`
}

function proLigne(pro: ProMail, last: boolean): string {
  return `<tr><td style="padding:12px 0;${last ? '' : `border-bottom:1px solid ${LINE};`}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="44" valign="middle"><div style="width:38px;height:38px;border-radius:38px;background:${TINT};color:${GREEN};font-family:${SERIF};font-size:15px;line-height:38px;text-align:center;">${escHtml(initiales(pro.nom))}</div></td>
<td valign="middle" style="padding-left:12px;"><div style="font-family:${SANS};font-size:15px;font-weight:600;color:${INK};">${escHtml(pro.nom)}</div>${pro.ville ? `<div style="font-family:${SANS};font-size:13px;color:${SOFT};">${escHtml(pro.ville)}</div>` : ''}</td>
<td valign="middle" align="right" style="font-family:${SANS};font-size:13px;white-space:nowrap;">${link(pro.url, 'Voir la fiche')}</td>
</tr></table></td></tr>`
}

/** Carte « Place libre » : aucun pro dans la zone pour l'instant */
function attente(ville: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF6E8;border:1px solid #F1E3BC;border-radius:14px;margin:0 0 18px;"><tr>
<td width="46" valign="middle" style="padding:16px 0 16px 16px;"><div style="width:42px;height:42px;border-radius:12px;background:#FFE8A8;font-family:${SANS};font-size:20px;line-height:42px;text-align:center;color:#8A5A12;">&#8987;</div></td>
<td valign="middle" style="padding:16px 16px 16px 12px;"><div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#8A5A12;">En file d’attente</div>
<div style="margin-top:3px;font-family:${SERIF};font-size:19px;line-height:1.25;color:${INK};">Place libre à ${escHtml(ville)}</div></td>
</tr></table>`
}

function etapes(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">${items.map((t, i) => `<tr>
<td width="30" valign="top" style="padding:6px 0;"><div style="width:22px;height:22px;border-radius:22px;border:1px solid ${LINE};font-family:${SANS};font-size:12px;font-weight:600;line-height:22px;text-align:center;color:${GREEN};">${i + 1}</div></td>
<td valign="top" style="padding:7px 0 6px 6px;font-family:${SANS};font-size:14px;line-height:1.55;color:#2B3A32;">${t}</td></tr>`).join('')}</table>`
}

/** Qui fait la demande (hôtels, conciergeries, gîtes : 24/10/2026) */
function qui(d: Pick<DemandeMail, 'etablissement'>): string {
  return d.etablissement === 'hotel' ? 'Un hôtel' : d.etablissement === 'conciergerie' ? 'Une conciergerie' : d.etablissement === 'gite' ? 'Un gîte' : 'Un hôte'
}

function besoinRows(d: DemandeMail, avecVille: boolean): Array<[string, string]> {
  const type = etablissementLabel(d.etablissement)
  const grand = d.etablissement === 'hotel' || d.etablissement === 'conciergerie'
  return ([
    avecVille ? ['Ville', d.ville] : null,
    type && d.etablissement !== 'lcd' ? ['Type', type] : null,
    d.logement ? [grand ? 'Taille' : 'Logement', d.logement] : null,
    d.frequence ? ['Besoin', d.frequence] : null,
    d.quand ? ['Quand', d.quand] : null,
    d.budget ? ['Budget indiqué', d.budget] : null,
  ].filter(Boolean)) as Array<[string, string]>
}

const FOOTER_PRO = `Demande reçue par l’annuaire de ${link('https://jasonmarinho.com', 'jasonmarinho.com')}.<br>Aucune commission : le devis et le paiement se règlent entre toi et l’hôte.`
const FOOTER_HOTE = `${link('https://jasonmarinho.com', 'jasonmarinho.com')} · Location courte durée<br>Tes coordonnées ne vont qu’aux pros qui reçoivent ta demande.`

// ── E-mails ──────────────────────────────────────────────────────────

/** Au pro : le besoin, l'hôte, un bouton pour lui répondre */
export function proEmail(d: DemandeMail, o: { proPrenom: string; manuel: boolean; adequation: string | null; filtre: boolean; demandesUrl: string; priseUrl?: string | null }): { subject: string; html: string; text: string } {
  const m = METIER[d.metier]
  const title = `${qui(d)} cherche ${m.un} à ${d.ville}`
  const hote = prenom(d.nom) || 'l’hôte'
  const intro = o.manuel
    ? `Un hôte a décrit son besoin sur jasonmarinho.com, et Jason Marinho te transmet sa demande.`
    : `Un hôte vient de décrire son besoin sur jasonmarinho.com. Tu fais partie des 3 pros les plus proches de son logement${o.filtre ? ', parmi ceux qui proposent ce qu’il demande' : ''}.`
  const objet = `Ta demande ${d.metier === 'photographe' ? 'de photographe' : 'de ménage'} à ${d.ville}`
  const mailto = `mailto:${d.email}?subject=${encodeURIComponent(objet)}`
  // « Je m'en occupe » (26/10/2026) : un clic, sans connexion, et la demande
  // ne part plus à d'autres pros (lib/demandes/prise.ts, /demande/prise/<jeton>)
  const suite = o.priseUrl
    ? `« Je m’en occupe » : la demande est à toi et ne part pas à d’autres pros. Sans signe de ta part sous 48 h, elle part à d’autres pros de la zone. Tu peux aussi répondre à cet e-mail : ta réponse arrive chez ${escHtml(hote)}.`
    : `Tu peux aussi répondre à cet e-mail : ta réponse arrive chez l’hôte. La demande est rangée dans ${link(o.demandesUrl, 'Demandes reçues')} : change son statut quand tu as répondu, sinon elle part à d’autres pros au bout de 48 h.`
  const body = [
    p(`Bonjour ${escHtml(o.proPrenom)},`, 10),
    p(escHtml(intro)),
    fiche(besoinRows(d, true)),
    o.adequation ? p(`<span style="color:${SOFT};">${escHtml(o.adequation)}</span>`) : '',
    d.message ? citation(d.message) : '',
    contact(d),
    o.priseUrl ? button(o.priseUrl, 'Je m’en occupe') + buttonOutline(mailto, `Répondre à ${hote}`) : button(mailto, `Répondre à ${hote}`),
    `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
    small(suite),
  ].join('')
  // Version texte envoyée avec le HTML (aide Gmail à classer l'e-mail), invisible pour le pro
  const text = [
    `Bonjour ${o.proPrenom},`, '', intro, '', title, ...besoinRows(d, true).map(([l, v]) => `${l} : ${v}`),
    ...(o.adequation ? ['', o.adequation] : []),
    ...(d.message ? ['', `« ${d.message} »`] : []),
    '', d.nom, d.email, ...(d.telephone ? [d.telephone] : []),
    '', ...(o.priseUrl ? [`Je m’en occupe : ${o.priseUrl}`, 'La demande est à toi et ne part pas à d’autres pros. Sans signe de ta part sous 48 h, elle part à d’autres pros de la zone.'] : [`Demandes reçues : ${o.demandesUrl}`]),
    `Tu peux répondre directement à cet e-mail : ta réponse arrive chez ${hote}.`,
    '', 'Jason Marinho, jasonmarinho.com',
  ].join('\n')
  return { subject: title, text, html: layout({ preview: `${d.logement ? `${d.logement}, ` : ''}${d.quand ? d.quand.toLowerCase() : 'nouvelle demande'} : réponds directement à l’hôte`, etiquette: `Nouvelle demande · ${m.etiquette}`, title, body, footer: FOOTER_PRO }) }
}

/** À l'hôte : sa demande est partie (ou enregistrée sans pro), qui l'a reçue, la suite */
export function hoteEmail(d: DemandeMail, o: { pros: ProMail[]; vague: number; suiviUrl: string | null; sansProQui: string; guideUrl: string; partielNote: string | null; inscriptionUrl: string }): { subject: string; html: string } {
  const m = METIER[d.metier]
  const n = o.pros.length
  const bonjour = p(`Bonjour ${escHtml(prenom(d.nom))},`, 10)
  if (!n) {
    const body = [
      bonjour,
      p(`Ta demande est bien enregistrée. Il n’y a pas encore ${escHtml(o.sansProQui)} près de ${escHtml(d.ville)}, alors on ne la laisse pas dormir :`),
      attente(d.ville),
      etapes([
        `${d.metier === 'menage' ? 'La première équipe' : 'Le premier pro'} qui s’inscrit près de chez toi la reçoit automatiquement, pendant 30 jours.`,
        'Jason la regarde lui-même et cherche quelqu’un de son côté.',
        'Tu reçois un e-mail dès qu’un pro l’a entre les mains, et il te répond directement.',
      ]),
      fiche(besoinRows(d, true)),
      button(o.suiviUrl ?? o.guideUrl, o.suiviUrl ? 'Suivre ma demande' : 'Voir l’annuaire'),
      `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
      small(`Tu connais ${d.metier === 'menage' ? 'une équipe' : 'un pro'} dans ton coin ? ${link(o.inscriptionUrl, 'Envoie-lui ce lien')} : dès que sa fiche est en ligne, elle reçoit ta demande.`),
    ].join('')
    return { subject: `Ta demande à ${d.ville} est enregistrée`, html: layout({ preview: 'On la transmet dès qu’un pro de ta zone rejoint l’annuaire', etiquette: `Ta demande · ${m.etiquette}`, title: 'Ta demande est enregistrée', body, footer: FOOTER_HOTE }) }
  }
  const qui = n > 1 ? `${n} ${m.labels}` : m.un
  const body = [
    bonjour,
    p(o.vague === 1
      ? `Ta demande est partie chez ${n > 1 ? `les ${escHtml(qui)} les plus proches` : `${escHtml(qui)} proche`} de ton logement à ${escHtml(d.ville)}.`
      : `Les premiers pros n’ont pas encore répondu : ta demande vient de partir chez ${n > 1 ? `${n} autres ${m.labels}` : 'un autre pro'}.`),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};margin:0 0 22px;">${o.pros.map((x, i) => proLigne(x, i === n - 1)).join('')}</table>`,
    o.partielNote ? p(`<span style="color:${SOFT};">${escHtml(o.partielNote)}</span>`) : '',
    etapes([
      `${n > 1 ? 'Ils te répondent' : 'Il te répond'} directement par e-mail.`,
      `Compare les fiches (photos, formules, prix) et choisis.`,
      `Sans réponse sous 48 h, ta demande part à d’autres pros de ta zone.`,
    ]),
    o.suiviUrl ? button(o.suiviUrl, 'Suivre ma demande') : '',
  ].join('')
  return {
    subject: `Ta demande à ${d.ville} est partie chez ${n} pro${n > 1 ? 's' : ''}`,
    html: layout({ preview: `${n > 1 ? `${n} pros l’ont reçue` : 'Un pro l’a reçue'} : réponse directe par e-mail`, etiquette: `Ta demande · ${m.etiquette}`, title: o.vague === 1 ? 'Ta demande est partie' : 'Ta demande part plus loin', body, footer: FOOTER_HOTE }),
  }
}

/**
 * À l'hôte, demande en plusieurs villes (29/10/2026) : un seul e-mail, une
 * partie par ville (ses pros ou « en file d'attente », son lien de suivi).
 * Les relances et transmissions suivantes restent envoyées ville par ville.
 */
export function hoteMultiEmail(d: DemandeMail, villes: Array<{ ville: string; pros: ProMail[]; suiviUrl: string | null }>, o: { inscriptionUrl: string }): { subject: string; html: string } {
  const m = METIER[d.metier]
  const nv = villes.length
  const n = villes.reduce((t, v) => t + v.pros.length, 0)
  const sansPro = villes.filter(v => !v.pros.length).length
  const section = (v: { ville: string; pros: ProMail[]; suiviUrl: string | null }) => [
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr>
<td valign="middle" style="font-family:${SERIF};font-size:19px;line-height:1.3;color:${INK};">${escHtml(v.ville)}</td>
<td valign="middle" align="right" style="font-family:${SANS};font-size:12px;font-weight:700;white-space:nowrap;color:${v.pros.length ? GREEN : '#8A5A12'};">${v.pros.length ? `${v.pros.length} pro${v.pros.length > 1 ? 's' : ''}` : 'En file d’attente'}</td>
</tr></table>`,
    v.pros.length
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};margin:0 0 10px;">${v.pros.map((x, i) => proLigne(x, i === v.pros.length - 1)).join('')}</table>`
      : small(`Pas encore de pro inscrit près de ${escHtml(v.ville)} : le premier qui s’inscrit la reçoit, et Jason cherche de son côté.`),
    v.suiviUrl ? `<p style="margin:${v.pros.length ? 0 : 8}px 0 0;font-family:${SANS};font-size:14px;">${link(v.suiviUrl, `Suivre la demande à ${escHtml(v.ville)}`)}</p>` : '',
    `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`,
  ].join('')
  const body = [
    p(`Bonjour ${escHtml(prenom(d.nom))},`, 10),
    p(`Ta demande part dans ${nv} villes, une demande par ville : chacune va aux ${escHtml(m.labels)} de sa zone${n ? `, ${n} pro${n > 1 ? 's' : ''} l’${n > 1 ? 'ont' : 'a'} déjà reçue` : ''}.`),
    villes.map(section).join(''),
    fiche(besoinRows(d, false)),
    etapes([
      'Les pros te répondent directement par e-mail, ville par ville.',
      'Sans réponse sous 48 h dans une ville, sa demande part à d’autres pros de cette zone.',
      sansPro ? `Dans ${sansPro > 1 ? 'les villes' : 'la ville'} sans pro, tu reçois un e-mail dès qu’un pro l’a entre les mains.` : 'Chaque lien de suivi montre qui a pris la demande en main.',
    ]),
    sansPro ? small(`Tu connais ${d.metier === 'menage' ? 'une équipe' : 'un pro'} dans une de ces villes ? ${link(o.inscriptionUrl, 'Envoie-lui ce lien')} : dès que sa fiche est en ligne, elle reçoit ta demande.`) : '',
  ].join('')
  return {
    subject: `Ta demande dans ${nv} villes : ${villes.map(v => v.ville).join(', ')}`,
    html: layout({ preview: n ? `${n} pro${n > 1 ? 's' : ''} l’${n > 1 ? 'ont' : 'a'} déjà reçue` : 'On la transmet dès qu’un pro de ces villes rejoint l’annuaire', etiquette: `Ta demande · ${m.etiquette}`, title: `Ta demande part dans ${nv} villes`, body, footer: FOOTER_HOTE }),
  }
}

/** À Jason, demande en plusieurs villes : l'état de chaque ville, sans les coordonnées */
export function adminMultiEmail(d: Omit<DemandeMail, 'nom' | 'email' | 'telephone' | 'message'>, villes: Array<{ ville: string; pros: string[]; qgUrl: string }>): string {
  const sansPro = villes.filter(v => !v.pros.length).length
  const body = [
    fiche(besoinRows({ ...d, nom: '', email: '', telephone: null, message: null }, false)),
    villes.map(v => p(`<strong>${escHtml(v.ville)}</strong> : ${v.pros.length ? `envoyée à ${v.pros.map(escHtml).join(', ')}` : '<span style="color:#8A5A12;">sans pro, à transmettre</span>'} · ${link(v.qgUrl, 'QG')}`, 10)).join(''),
    `<div style="height:8px;line-height:8px;font-size:0;">&nbsp;</div>`,
    button(villes[0].qgUrl, 'Ouvrir dans le QG'),
  ].join('')
  return layout({ preview: `${villes.length} villes${sansPro ? `, dont ${sansPro} sans pro` : ''}`, etiquette: sansPro ? 'Nouvelle demande · plusieurs villes' : 'Nouvelle demande', title: `${qui(d as DemandeMail)} cherche ${METIER[d.metier].un} dans ${villes.length} villes`, body, footer: 'Coordonnées de l’hôte dans le QG seulement.' })
}

/** À l'hôte : Jason a transmis sa demande à un pro de plus */
export function hoteManuelEmail(d: DemandeMail, pro: ProMail, suiviUrl: string | null, premier = false): { subject: string; html: string } {
  const m = METIER[d.metier]
  const body = [
    p(`Bonjour ${escHtml(prenom(d.nom))},`, 10),
    p(premier ? `Bonne nouvelle : Jason a trouvé un pro pour ta demande à ${escHtml(d.ville)} et vient de la lui transmettre. Il te répond directement par e-mail.` : `Ta demande à ${escHtml(d.ville)} vient aussi d’être transmise à ce pro. Il te répond directement par e-mail.`),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};margin:0 0 22px;">${proLigne(pro, true)}</table>`,
    suiviUrl ? button(suiviUrl, 'Suivre ma demande') : '',
  ].join('')
  return { subject: premier ? `Ta demande à ${d.ville} : un pro l’a reçue` : `Ta demande à ${d.ville} : un pro de plus l’a reçue`, html: layout({ preview: `${pro.nom} a reçu ta demande`, etiquette: `Ta demande · ${m.etiquette}`, title: premier ? 'Un pro a reçu ta demande' : 'Un pro de plus a reçu ta demande', body, footer: FOOTER_HOTE }) }
}

/** À Jason : le besoin sans les coordonnées, la suite, le lien vers la fiche du QG */
export function adminEmail(d: Omit<DemandeMail, 'nom' | 'email' | 'telephone' | 'message'>, o: { etiquette: string; title: string; texte: string; pros: string[]; qgUrl: string }): string {
  const body = [
    fiche(besoinRows({ ...d, nom: '', email: '', telephone: null, message: null }, true)),
    p(escHtml(o.texte)),
    o.pros.length ? p(`<strong>Envoyée à :</strong> ${o.pros.map(escHtml).join(', ')}`) : '',
    button(o.qgUrl, 'Ouvrir la demande dans le QG'),
  ].join('')
  return layout({ preview: o.texte, etiquette: o.etiquette, title: o.title, body, footer: 'Coordonnées de l’hôte dans le QG seulement.' })
}
