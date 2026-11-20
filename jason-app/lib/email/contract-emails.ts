// E-mails des contrats (20/11/2026) : invitation à signer, contrat signé
// (voyageur et hôte), rappel de paiement, lien de caution à J-2. Contenu pur
// (testé, contract-emails.test.ts) ; l'envoi reste dans les routes.
//
// Avant : quatre gabarits écrits à la main, restes du thème sombre convertis
// à l'envoi, couleurs « var(--…) » ignorées par les messageries, heure de
// signature en UTC, objet en français pour un contrat portugais.
//
// Le voyageur traite avec son hôte : pas de signature de Jason, expéditeur
// « <hôte> via Jason Marinho », réponse adressée à l'hôte (contractFrom).
import { buildEmail, emailAlert, emailBtn, emailFiche, emailInfoBlock, emailNote, emailP, emailSmall, EMAIL_COLORS, EMAIL_SANS, escHtml } from './template'
import { CONTRACT_EMAIL_I18N, type EmailLang } from './contract-i18n'

const CONTRATS = 'contrats@jasonmarinho.com'

/** Expéditeur affiché côté voyageur : le nom de l'hôte, sans caractère qui casse l'en-tête */
export function contractFrom(hostName: string): string {
  const clean = hostName.replace(/["<>\r\n]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
  return clean ? `${clean} via Jason Marinho <${CONTRATS}>` : `Jason Marinho <${CONTRATS}>`
}

/** Date et heure de signature, toujours à l'heure de Paris (le serveur est en UTC) */
export function signDateLabel(d: Date, lang: EmailLang): string {
  return d.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })
}

export interface VirementInfo { iban: string; bic: string | null; beneficiaire: string; montant: string | null; reference: string }

/** Coordonnées du virement, faciles à sélectionner et copier */
export function virementBlock(lang: EmailLang, v: VirementInfo): string {
  const et = CONTRACT_EMAIL_I18N[lang]
  const C = EMAIL_COLORS
  const row = (label: string, value: string, mono: boolean, strong = false) => `<tr>
<td style="padding:6px 14px 6px 0;font-family:${EMAIL_SANS};font-size:12.5px;color:${C.soft};white-space:nowrap;vertical-align:top;">${escHtml(label)}</td>
<td style="padding:6px 0;font-family:${mono ? "'Courier New',Courier,monospace" : EMAIL_SANS};font-size:${strong ? 16 : 14}px;font-weight:${strong ? 700 : 600};color:${C.ink};word-break:break-all;-webkit-user-select:all;user-select:all;">${escHtml(value)}</td></tr>`
  return `<div style="border:1px solid ${C.line};border-radius:14px;padding:16px 18px;margin:0 0 20px;">
<div style="font-family:${EMAIL_SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${C.green};margin:0 0 8px;">${escHtml(et.bankTransferTitle)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row(et.bankTransferLabelIban, v.iban, true)}
${v.bic ? row(`${et.bankTransferLabelBic} / SWIFT`, v.bic, true) : ''}
${row(et.bankTransferLabelBeneficiaire, v.beneficiaire, false)}
${v.montant ? row(et.bankTransferLabelMontant, `${v.montant} €`, false, true) : ''}
${row(et.bankTransferLabelReference, v.reference, true)}
</table>
<p style="margin:10px 0 0;font-family:${EMAIL_SANS};font-size:12.5px;line-height:1.6;color:${C.soft};">${et.bankTransferNote}</p>
</div>`
}

/** Référence de virement tirée de l'adresse (lettres et chiffres seulement) */
export const virementReference = (adresse: string) => adresse.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim()

// ─── Invitation à signer ──────────────────────────────────────────────

export function contractInviteEmail(o: {
  lang: EmailLang; hostName: string; guestName: string; property: string; adresse: string | null
  arrivee: string; depart: string; signUrl: string; cgv: boolean
}): { subject: string; html: string } {
  const et = CONTRACT_EMAIL_I18N[o.lang]
  const body = [
    emailP(et.inviteGreeting(escHtml(o.guestName)), 10),
    emailP(et.inviteBody(escHtml(o.hostName))),
    emailFiche([
      [et.labelLogement, o.property],
      ...(o.adresse ? [[et.labelAdresse, o.adresse] as [string, string]] : []),
      [et.labelArrivee, o.arrivee],
      [et.labelDepart, o.depart],
    ]),
    o.cgv ? emailSmall(et.inviteCgv) : '',
    emailBtn(o.signUrl, et.inviteBtn),
    emailNote(et.inviteNote),
  ].join('')
  return {
    subject: et.inviteSubject(o.property),
    html: buildEmail({ lang: o.lang, etiquette: et.tagContract, title: et.inviteTitle, preview: et.invitePreview(o.hostName, o.property), body, footer: et.sentOnBehalf(escHtml(o.hostName)) }),
  }
}

// ─── Contrat signé : voyageur ─────────────────────────────────────────

export interface PaymentLinks {
  /** Lien Stripe du loyer (paiement en ligne activé) */
  payUrl: string | null
  loyer: string
  /** Lien de la caution, seulement quand la fenêtre est ouverte (J-2) */
  depositUrl: string | null
  caution: string | null
  /** Date d'ouverture du lien de caution si elle n'est pas encore ouverte */
  depositLater: string | null
}

function paymentsBlock(lang: EmailLang, p: PaymentLinks): string {
  const et = CONTRACT_EMAIL_I18N[lang]
  if (!p.payUrl && !p.caution) return ''
  return [
    `<div style="font-family:${EMAIL_SANS};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${EMAIL_COLORS.green};margin:4px 0 8px;">${escHtml(et.finalizeTitle)}</div>`,
    p.payUrl ? emailBtn(p.payUrl, et.payBookingBtn(p.loyer)).replace('margin:6px 0 20px', 'margin:0 0 10px') : '',
    p.caution && p.depositUrl ? emailBtn(p.depositUrl, et.payDepositBtn(p.caution), 'secondary').replace('margin:6px 0 20px', 'margin:0 0 10px') : '',
    p.caution ? emailSmall(p.depositUrl ? et.depositNote : et.depositLater(escHtml(p.depositLater ?? ''))) : '',
    '<div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>',
  ].join('')
}

export function contractSignedGuestEmail(o: {
  lang: EmailLang; hostName: string; guestName: string; property: string; signedAt: string; ip: string
  contractUrl: string; payments: PaymentLinks; virement: VirementInfo | null
}): { subject: string; html: string } {
  const et = CONTRACT_EMAIL_I18N[o.lang]
  const body = [
    emailP(et.signedGreeting(escHtml(o.guestName)), 10),
    emailP(et.signedBody(escHtml(o.property), escHtml(o.signedAt))),
    paymentsBlock(o.lang, o.payments),
    o.virement ? virementBlock(o.lang, o.virement) : '',
    emailBtn(o.contractUrl, et.viewContractBtn, o.payments.payUrl || o.payments.depositUrl ? 'secondary' : 'primary'),
    emailInfoBlock([
      { label: et.labelSigned, value: escHtml(o.signedAt) },
      { label: et.labelIp, value: escHtml(o.ip) },
    ]),
    emailNote(et.eidasNote),
  ].join('')
  return {
    subject: et.signedSubject(o.property),
    html: buildEmail({ lang: o.lang, etiquette: et.tagContract, title: et.signedTitle, preview: et.signedPreview(o.property), body, footer: et.sentOnBehalf(escHtml(o.hostName)) }),
  }
}

// ─── Contrat signé : hôte (toujours en français) ──────────────────────

export interface DeclarationInfo { label: string; deadline: string; note: string; portalUrl: string | null }

export function contractSignedHostEmail(o: {
  hostFirstName: string; guestName: string; property: string; signedAt: string; ip: string
  loyer: string | null; caution: string | null; paiementEnLigne: boolean
  declaration: DeclarationInfo | null; contractUrl: string; dashboardUrl: string
}): { subject: string; html: string } {
  const body = [
    emailP(`Bonjour${o.hostFirstName ? ` ${escHtml(o.hostFirstName)}` : ''},`, 10),
    emailP(`<strong>${escHtml(o.guestName)}</strong> a signé le contrat pour <strong>${escHtml(o.property)}</strong>.${o.paiementEnLigne ? ' Il peut maintenant payer le loyer en ligne : tu reçois un e-mail dès que c’est fait.' : ''}`),
    emailFiche([
      ['Voyageur', o.guestName],
      ['Signé le', o.signedAt],
      ...(o.loyer ? [['Loyer', `${o.loyer} €`] as [string, string]] : []),
      ...(o.caution ? [['Caution', `${o.caution} €`] as [string, string]] : []),
    ]),
    o.declaration ? emailAlert(
      `Déclaration obligatoire : ${escHtml(o.declaration.label)}`,
      `<strong>${escHtml(o.guestName)}</strong> doit être déclaré avant le <strong>${escHtml(o.declaration.deadline)}</strong>. ${escHtml(o.declaration.note)}${o.declaration.portalUrl ? `<br><a href="${escHtml(o.declaration.portalUrl)}" style="color:${EMAIL_COLORS.warnInk};font-weight:700;">Faire la déclaration sur le portail officiel</a>` : ''}<br><span style="color:${EMAIL_COLORS.soft};font-size:12.5px;">Marque-la « faite » dans ton espace une fois envoyée.</span>`,
    ) : '',
    emailBtn(o.dashboardUrl, 'Voir la fiche voyageur'),
    emailSmall(`<a href="${escHtml(o.contractUrl)}" style="color:${EMAIL_COLORS.green};font-weight:600;text-decoration:none;">Ouvrir le contrat signé</a> · Adresse IP de signature : ${escHtml(o.ip)}`),
    emailNote('Signature électronique simple au sens du règlement eIDAS (UE) 910/2014 et de l’article 1366 du Code civil.'),
  ].join('')
  return {
    subject: `${o.guestName} a signé le contrat, ${o.property}`,
    html: buildEmail({ track: 'contrat-hote', etiquette: 'Contrat signé', title: `${escHtml(o.guestName)} a signé son contrat`, preview: `${o.property}, signé le ${o.signedAt}`, body }),
  }
}

// ─── Rappel de paiement (bouton de l'hôte) ────────────────────────────

export function paymentReminderEmail(o: {
  lang: EmailLang; hostName: string; guestName: string; property: string
  contractUrl: string; payments: PaymentLinks; virement: VirementInfo | null
}): { subject: string; html: string } {
  const et = CONTRACT_EMAIL_I18N[o.lang]
  const enLigne = !!(o.payments.payUrl || o.payments.depositUrl)
  const body = [
    emailP(et.reminderGreeting(escHtml(o.guestName)), 10),
    emailP(`${et.reminderBody(escHtml(o.property))} ${enLigne ? et.reminderPaymentsIntro(!!(o.payments.payUrl && o.payments.depositUrl)) : o.virement ? et.reminderVirementIntro : ''}`),
    paymentsBlock(o.lang, o.payments),
    o.virement ? virementBlock(o.lang, o.virement) : '',
    emailBtn(o.contractUrl, et.viewContractBtn, enLigne ? 'secondary' : 'primary'),
    emailNote(et.reminderTroubleNote),
  ].join('')
  return {
    subject: et.reminderSubject(o.property),
    html: buildEmail({ lang: o.lang, etiquette: et.tagPayment, title: et.reminderTitle, preview: et.reminderPreheader, body, footer: et.sentOnBehalf(escHtml(o.hostName)) }),
  }
}

// ─── Lien de caution à J-2 (cron) ─────────────────────────────────────

export function depositOpenEmailContent(o: {
  lang: EmailLang; hostName: string; guestName: string; property: string; arrival: string
  caution: string; depositUrl: string; contractUrl: string
}): { subject: string; html: string } {
  const et = CONTRACT_EMAIL_I18N[o.lang]
  const body = [
    emailP(et.reminderGreeting(escHtml(o.guestName)), 10),
    emailP(et.depositOpenBody(escHtml(o.property), escHtml(o.arrival))),
    emailBtn(o.depositUrl, et.payDepositBtn(o.caution)),
    emailSmall(et.depositNote),
    '<div style="height:8px;line-height:8px;font-size:0;">&nbsp;</div>',
    emailBtn(o.contractUrl, et.viewContractBtn, 'secondary'),
    emailNote(et.reminderTroubleNote),
  ].join('')
  return {
    subject: et.depositOpenSubject(o.property),
    html: buildEmail({ lang: o.lang, etiquette: et.tagDeposit, title: et.depositOpenTitle, preview: et.depositOpenPreheader, body, footer: et.sentOnBehalf(escHtml(o.hostName)) }),
  }
}
