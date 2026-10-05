// Contenu de l'e-mail au voyageur quand l'hôte décide de la caution
// (05/10/2026). Pur (pas d'envoi), testé : lib/email/deposit-guest-content.test.ts.
import { buildEmail, emailBtn, emailInfoBlock, emailNote, emailP, escHtml } from './template'
import { toEmailLang } from './contract-i18n'

const money = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export interface DepositGuestEmail {
  to: string | null | undefined
  langue: string | null | undefined
  token: string
  guestFirstName: string | null | undefined
  hostName: string
  hostEmail?: string | null
  property: string
  deposit: number
  outcome: 'released' | 'captured'
  /** Somme retenue (si encaissement) */
  kept?: number
  reason?: string | null
}

const TXT = {
  fr: {
    releasedSubject: (p: string) => `Caution libérée : ${p}`,
    releasedTitle: 'Votre caution est libérée',
    releasedBody: (amount: string) => `Le propriétaire a levé le blocage de ${amount} sur votre carte : rien n'a été prélevé. Selon votre banque, la somme redevient disponible tout de suite ou sous quelques jours.`,
    capturedSubject: (p: string) => `Caution : somme retenue, ${p}`,
    capturedTitle: 'Une partie de votre caution a été retenue',
    capturedBody: (kept: string, total: string) => `Le propriétaire a retenu ${kept} sur la caution de ${total}. Le reste du blocage a été levé : il n'est pas prélevé.`,
    reason: 'Motif',
    kept: 'Somme retenue',
    released: 'Somme libérée',
    hello: (n: string) => `Bonjour ${n},`,
    thanks: 'Merci pour votre séjour.',
    question: 'Une question sur cette retenue ? Répondez simplement à cet e-mail : votre message arrive chez le propriétaire.',
    btn: 'Voir mon contrat',
    note: 'Paiement géré par Stripe. Le propriétaire ne voit jamais le numéro de votre carte.',
  },
  pt: {
    releasedSubject: (p: string) => `Caução libertada: ${p}`,
    releasedTitle: 'A sua caução foi libertada',
    releasedBody: (amount: string) => `O proprietário levantou o bloqueio de ${amount} no seu cartão: nada foi cobrado. Consoante o banco, o valor volta a estar disponível de imediato ou em poucos dias.`,
    capturedSubject: (p: string) => `Caução: valor retido, ${p}`,
    capturedTitle: 'Parte da sua caução foi retida',
    capturedBody: (kept: string, total: string) => `O proprietário reteve ${kept} da caução de ${total}. O resto do bloqueio foi levantado: não é cobrado.`,
    reason: 'Motivo',
    kept: 'Valor retido',
    released: 'Valor libertado',
    hello: (n: string) => `Olá ${n},`,
    thanks: 'Obrigado pela sua estadia.',
    question: 'Alguma questão sobre esta retenção? Basta responder a este e-mail: a sua mensagem chega ao proprietário.',
    btn: 'Ver o meu contrato',
    note: 'Pagamento gerido pela Stripe. O proprietário nunca vê o número do seu cartão.',
  },
}


export function buildDepositGuestEmail(e: DepositGuestEmail, appUrl: string): { subject: string; html: string; fromName: string } {
  const t = TXT[toEmailLang(e.langue)]
  const property = e.property || 'séjour'
  const isCapture = e.outcome === 'captured'
  const kept = e.kept ?? e.deposit
  const rows = isCapture
    ? [
        { label: t.kept, value: money(kept) },
        ...(kept < e.deposit ? [{ label: t.released, value: money(e.deposit - kept) }] : []),
        ...(e.reason ? [{ label: t.reason, value: escHtml(e.reason) }] : []),
      ]
    : [{ label: t.released, value: money(e.deposit) }]
  const html = buildEmail({
    title: isCapture ? t.capturedTitle : t.releasedTitle,
    preview: isCapture ? t.capturedBody(money(kept), money(e.deposit)) : t.releasedBody(money(e.deposit)),
    body: `
      ${emailP(t.hello(escHtml(e.guestFirstName ?? '')).replace(' ,', ','))}
      ${emailP(isCapture ? t.capturedBody(money(kept), money(e.deposit)) : `${t.releasedBody(money(e.deposit))} ${t.thanks}`)}
      ${emailInfoBlock(rows)}
      ${isCapture ? emailP(t.question) : ''}
      ${emailBtn(`${appUrl}/sign/${encodeURIComponent(e.token)}#depot-garantie`, t.btn)}
      ${emailP(escHtml(e.hostName))}
      ${emailNote(t.note)}
    `,
  })
  return {
    subject: isCapture ? t.capturedSubject(property) : t.releasedSubject(property),
    html,
    fromName: `${e.hostName.replace(/["<>\r\n]/g, '').slice(0, 60) || 'Votre hôte'} via Jason Marinho`,
  }
}
