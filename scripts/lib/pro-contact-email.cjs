// E-mails du bouton « Contacter » d'une fiche pro (api/photographer/contact.js, api/cleaner/contact.js).
// Même gabarit que les e-mails de la demande « Trouver un pro » (jason-app/lib/demandes/emails.ts) :
// carte blanche, étiquette, titre Georgia, besoin en fiche, un seul bouton. Garder les deux alignés.
// Hors du dossier api/ : n'est pas une fonction serverless (12 au plus).

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

const METIER = {
  photographe: { etiquette: 'Photo & vidéo', annuaire: 'des photographes et vidéastes', dir: 'photographes', dash: 'ma-fiche-photographe' },
  menage: { etiquette: 'Ménage', annuaire: 'des équipes de ménage', dir: 'menage', dash: 'ma-fiche-menage' },
}

function esc(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
const prenom = nom => (String(nom || '').trim().split(/\s+/)[0] || '').replace(/^./, c => c.toUpperCase())
const initiales = nom => String(nom || '').split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || '?'

/** Les premières lignes composées par le formulaire guidé de la fiche (jmContactMessage) deviennent la fiche du besoin */
const CHAMPS = [['Formule', 'Formule'], ['Ce qu’il me faut', 'Besoin'], ['Logement', 'Logement'], ['Date souhaitée', 'Date souhaitée']]
function lireMessage(message) {
  const lignes = String(message || '').split('\n')
  const rows = []
  while (lignes.length) {
    const m = lignes[0].match(/^([^:]{3,30}) : (.+)$/)
    const champ = m && CHAMPS.find(([k]) => k === m[1].trim())
    if (!champ) break
    rows.push([champ[1], m[2].trim()])
    lignes.shift()
  }
  return { rows, texte: lignes.join('\n').trim() }
}

function layout({ preview, etiquette, title, body, footer }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preview)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
<tr><td align="center" style="padding:36px 14px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 6px 18px;font-family:${SERIF};font-size:17px;color:${INK};letter-spacing:-0.2px;">Jason <em style="color:${GREEN};">Marinho</em></td></tr>
<tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:20px;padding:34px 30px 30px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${TINT};border-radius:999px;padding:5px 11px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${GREEN};">${esc(etiquette)}</td></tr></table>
<h1 style="margin:16px 0 0;font-family:${SERIF};font-size:26px;line-height:1.25;font-weight:400;color:${INK};letter-spacing:-0.4px;">${esc(title)}</h1>
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

const p = (html, mb = 18) => `<p style="margin:0 0 ${mb}px;font-family:${SANS};font-size:15px;line-height:1.65;color:#2B3A32;">${html}</p>`
const small = html => `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.65;color:${SOFT};">${html}</p>`
const link = (href, label) => `<a href="${esc(href)}" style="color:${GREEN};font-weight:600;text-decoration:none;">${label}</a>`
const button = (href, label) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0;"><tr><td align="center" style="background:${GREEN};border-radius:12px;">
<a href="${esc(href)}" style="display:block;padding:15px 22px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;text-align:center;">${esc(label)}</a>
</td></tr></table>`

function fiche(rows) {
  if (!rows.length) return ''
  const cell = ([l, v], sep) => `<td width="50%" valign="top" style="padding:12px 14px;${sep}">
<div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${SOFT};">${esc(l)}</div>
<div style="margin-top:4px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.4;color:${INK};">${esc(v)}</div></td>`
  const lines = []
  for (let i = 0; i < rows.length; i += 2) {
    const sep = i ? `border-top:1px solid ${LINE};` : ''
    lines.push(`<tr>${cell(rows[i], sep)}${rows[i + 1] ? cell(rows[i + 1], sep) : `<td width="50%" style="${sep}"></td>`}</tr>`)
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:14px;border-collapse:separate;margin:0 0 20px;">${lines.join('')}</table>`
}

const citation = message => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
<td width="3" style="background:${YELLOW};border-radius:3px;font-size:0;">&nbsp;</td>
<td style="padding:2px 0 2px 16px;font-family:${SERIF};font-size:16px;font-style:italic;line-height:1.6;color:${INK};">${esc(message).replace(/\n/g, '<br>')}</td>
</tr></table>`

const personne = (nom, sous, fond, texte) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${fond};border-radius:14px;margin:0 0 22px;"><tr>
<td width="44" valign="middle" style="padding:14px 0 14px 16px;"><div style="width:40px;height:40px;border-radius:40px;background:${texte === '#FFFFFF' ? GREEN : '#FFFFFF'};color:${texte};font-family:${SERIF};font-size:16px;line-height:40px;text-align:center;">${esc(initiales(nom))}</div></td>
<td valign="middle" style="padding:14px 16px 14px 12px;"><div style="font-family:${SANS};font-size:15px;font-weight:600;color:${INK};">${esc(nom)}</div>
<div style="margin-top:2px;font-family:${SANS};font-size:13px;color:${SOFT};">${sous}</div></td>
</tr></table>`

/**
 * @param {{ metier: 'photographe'|'menage', proPrenom: string, proNom: string, proVille: string|null, proSlug: string, contactName: string, contactEmail: string, contactPhone?: string, message: string }} o
 */
/** Téléphone facultatif de la demande (26/10/2026) : 8 à 15 chiffres, sinon '' ;
 *  un numéro français à 10 chiffres est écrit par paires (06 12 34 56 78). */
function cleanPhone(v) {
  const raw = String(v || '').trim().slice(0, 30)
  const plus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return ''
  if (!plus && digits.length === 10 && digits.startsWith('0')) return digits.replace(/(\d{2})(?=\d)/g, '$1 ')
  return (plus ? '+' : '') + digits
}

function contactEmails(o) {
  const m = METIER[o.metier]
  const { rows, texte } = lireMessage(o.message)
  const hote = prenom(o.contactName) || 'l’hôte'

  // Version sobre (26/10/2026, Jason : les e-mails de demande arrivaient dans
  // l'onglet Promotions de Gmail) : fond blanc, texte comme un e-mail écrit à
  // la main, pas de bandeau, et une version texte.
  const proTitle = `${hote} veut travailler avec toi`
  const mailto = `mailto:${o.contactEmail}?subject=${encodeURIComponent('Ta demande via jasonmarinho.com')}`
  const demandesUrl = `https://app.jasonmarinho.com/dashboard/${m.dash}/demandes`
  const P = (h, mb = 14) => `<p style="margin:0 0 ${mb}px;font-family:${SANS};font-size:15px;line-height:1.6;color:#1F2B22;">${h}</p>`
  const proHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${esc(proTitle)}</title></head>
<body style="margin:0;padding:0;background:#FFFFFF;">
<div style="max-width:560px;margin:0 auto;padding:24px 18px;">
${P(`Bonjour ${esc(o.proPrenom)},`)}
${P(`Un hôte a vu ta fiche dans l’annuaire ${m.annuaire} de jasonmarinho.com et t’écrit directement.`)}
${rows.length ? P(rows.map(([l, v]) => `${esc(l)} : ${esc(v)}`).join('<br>')) : ''}
${texte ? P(`<em>« ${esc(texte).replace(/\n/g, '<br>')} »</em>`) : ''}
${P(`<strong>${esc(o.contactName)}</strong><br><a href="mailto:${esc(o.contactEmail)}" style="color:${GREEN};">${esc(o.contactEmail)}</a>${o.contactPhone ? `<br><a href="tel:${esc(o.contactPhone.replace(/\s/g, ''))}" style="color:${GREEN};">${esc(o.contactPhone)}</a>` : ''}`)}
<div style="margin:4px 0 10px;"><a href="${esc(mailto)}" style="display:inline-block;padding:11px 18px;border-radius:8px;background:${GREEN};color:#FFFFFF;font-family:${SANS};font-size:15px;font-weight:600;text-decoration:none;">Répondre à ${esc(hote)}</a></div>
${P(`<span style="font-size:14px;color:${SOFT};">${o.contactPhone ? `${esc(hote)} a laissé son numéro : tu peux aussi l’appeler. ` : ''}Tu peux aussi répondre directement à cet e-mail : ta réponse arrive chez ${esc(hote)}. La demande est rangée dans <a href="${esc(demandesUrl)}" style="color:${GREEN};">Demandes reçues</a>.</span>`)}
${P('Bonne journée,<br>Jason Marinho', 18)}
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${SOFT};">Demande reçue par ta fiche sur jasonmarinho.com. Aucune commission : le devis et le paiement se règlent entre toi et l’hôte.</p>
</div></body></html>`
  const proText = [
    `Bonjour ${o.proPrenom},`, '', `Un hôte a vu ta fiche dans l’annuaire ${m.annuaire} de jasonmarinho.com et t’écrit directement.`,
    ...(rows.length ? ['', ...rows.map(([l, v]) => `${l} : ${v}`)] : []),
    ...(texte ? ['', `« ${texte} »`] : []),
    '', o.contactName, o.contactEmail, ...(o.contactPhone ? [o.contactPhone] : []),
    '', `Tu peux répondre directement à cet e-mail : ta réponse arrive chez ${hote}.`, `Demandes reçues : ${demandesUrl}`,
    '', 'Bonne journée,', 'Jason Marinho',
  ].join('\n')

  const ficheUrl = `https://jasonmarinho.com/annuaires/${m.dir}/${o.proSlug}`
  const hoteHtml = layout({
    preview: `${o.proNom} te répond directement par e-mail`,
    etiquette: `Ta demande · ${m.etiquette}`,
    title: 'Ta demande est partie',
    body: [
      p(`Bonjour ${esc(prenom(o.contactName))},`, 10),
      p(`Ton message est bien arrivé chez ce pro. Il te répond directement par e-mail, en général sous 48 h.`),
      personne(o.proNom, `${o.proVille ? esc(o.proVille) + ' &nbsp;·&nbsp; ' : ''}${link(ficheUrl, 'Voir la fiche')}`, TINT, GREEN),
      fiche(rows),
      texte ? citation(texte) : '',
      small(`Pas de réponse d’ici quelques jours ? ${link(`https://jasonmarinho.com/trouver-un-pro?metier=${o.metier}`, 'Décris ton besoin')} : on le transmet aux pros les plus proches de chez toi.`),
    ].join(''),
    footer: `${link('https://jasonmarinho.com', 'jasonmarinho.com')} · Location courte durée<br>Aucune commission : le devis et le paiement se règlent entre toi et le pro.`,
  })

  return {
    pro: { subject: `${hote} veut te contacter via ta fiche`, html: proHtml, text: proText },
    hote: { subject: `Ta demande à ${o.proNom} est partie`, html: hoteHtml },
  }
}

module.exports = { contactEmails, lireMessage, cleanPhone }
