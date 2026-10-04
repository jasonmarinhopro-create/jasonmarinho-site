// E-mails des devis et factures des pros de l'annuaire (04/10/2026) :
// envoi au client, relance d'une facture, devis accepté (au pro).
// Expédiés par notifications@ au nom du pro ; la réponse du client va au pro.

import 'server-only'
import { Resend } from 'resend'
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from './template'
import { DOC_LABEL, eur, frDate, type ProDocument } from '@/lib/pros/billing'
import { logger } from '@/lib/logger'

const log = logger('email/pro-documents')
const FROM = 'notifications@jasonmarinho.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

export const docPublicUrl = (token: string) => `${APP_URL}/doc/${token}`

function resend() {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

/** Nom affiché de l'expéditeur, sans caractère qui casserait l'en-tête */
const fromName = (s: string) => s.replace(/["<>\r\n]/g, '').slice(0, 60)

export async function sendDocumentToClient(opts: {
  doc: ProDocument
  sellerName: string
  replyTo: string | null
  reminder?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const r = resend()
  if (!r) return { ok: false, error: 'Envoi d\'e-mails indisponible pour le moment.' }
  const { doc, sellerName, replyTo, reminder } = opts
  if (!doc.client_email) return { ok: false, error: 'Ajoute l\'e-mail du client pour lui envoyer le document.' }

  const label = DOC_LABEL[doc.kind]
  const isQuote = doc.kind === 'devis'
  const url = docPublicUrl(doc.public_token)
  const subject = reminder
    ? `Rappel : facture ${doc.number} de ${sellerName}`
    : `${label} ${doc.number} de ${sellerName}`
  const rows = [
    { label: label, value: doc.number ?? '' },
    { label: 'Montant', value: eur(doc.total_ttc) },
    ...(isQuote && doc.valid_until ? [{ label: 'Valable jusqu\'au', value: frDate(doc.valid_until) }] : []),
    ...(!isQuote && doc.due_date ? [{ label: 'À régler avant le', value: frDate(doc.due_date) }] : []),
  ]
  const intro = reminder
    ? `Sauf erreur de ma part, la facture ${escHtml(doc.number ?? '')} n'a pas encore été réglée. Tu la retrouves ci-dessous, avec les moyens de paiement.`
    : isQuote
      ? 'Voici le devis demandé. Tu peux le consulter, le télécharger et l\'accepter en ligne en un clic.'
      : 'Voici ta facture. Tu peux la consulter et la télécharger en PDF.'
  const html = buildEmail({
    title: reminder ? 'Petit rappel' : `${label} de ${escHtml(sellerName)}`,
    preview: `${label} ${doc.number} : ${eur(doc.total_ttc)}`,
    body: `
      ${emailP(`Bonjour ${escHtml(doc.client_name ?? '')},`)}
      ${emailP(intro)}
      ${doc.notes && !reminder ? emailP(escHtml(doc.notes).replace(/\n/g, '<br>')) : ''}
      ${emailInfoBlock(rows)}
      ${emailBtn(url, isQuote ? 'Voir et accepter le devis' : 'Voir la facture')}
      ${emailP(`${escHtml(sellerName)}`)}
      ${emailNote('Pour toute question, réponds simplement à cet e-mail : ta réponse arrive directement chez ton prestataire. Document envoyé avec l\'outil de devis et factures de Jason Marinho.')}
    `,
  })
  try {
    const { error } = await r.emails.send({
      from: `${fromName(sellerName)} via Jason Marinho <${FROM}>`,
      to: doc.client_email,
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
    })
    if (error) { log.error('envoi au client refusé', { err: error.message }); return { ok: false, error: 'L\'e-mail n\'a pas pu partir. Réessaie dans un instant.' } }
    return { ok: true }
  } catch (e) {
    log.error('envoi au client échoué', { err: e instanceof Error ? e.message : String(e) })
    return { ok: false, error: 'L\'e-mail n\'a pas pu partir. Réessaie dans un instant.' }
  }
}

export async function sendQuoteAcceptedToPro(opts: {
  to: string
  doc: Pick<ProDocument, 'number' | 'client_name' | 'total_ttc' | 'accepted_name'>
  href: string
}): Promise<void> {
  const r = resend()
  if (!r) return
  const { doc } = opts
  const html = buildEmail({
    title: 'Devis accepté',
    preview: `${doc.client_name} a accepté le devis ${doc.number}`,
    body: `
      ${emailP(`Bonne nouvelle : <strong>${escHtml(doc.client_name ?? '')}</strong> vient d'accepter ton devis <strong>${escHtml(doc.number ?? '')}</strong> (${eur(doc.total_ttc)}).`)}
      ${emailP(`Accepté en ligne au nom de ${escHtml(doc.accepted_name ?? '')}. Une fois la prestation faite, transforme-le en facture en un clic.`)}
      ${emailBtn(opts.href, 'Ouvrir le devis')}
    `,
  })
  try {
    await r.emails.send({ from: `Jason Marinho <${FROM}>`, to: opts.to, subject: `Devis ${doc.number} accepté par ${doc.client_name}`, html })
  } catch (e) {
    log.error('e-mail devis accepté échoué', { err: e instanceof Error ? e.message : String(e) })
  }
}
