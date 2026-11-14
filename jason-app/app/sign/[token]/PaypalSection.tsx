// Paiement PayPal après la signature (15/11/2026) : bouton vers le lien
// PayPal.me de l'hôte, montant déjà rempli. Le paiement se fait directement
// entre le voyageur et l'hôte (pas de suivi automatique côté app).
import type { UiLang } from '@/lib/sign-ui-i18n'
import { paypalMeUrl } from '@/lib/contracts/paypal'

const T: Record<UiLang, {
  title: string; hint: string; btn: (a: string) => string; ref: string; notice: string;
  solde: (a: string, quand?: string) => string
}> = {
  fr: {
    title: 'Payer avec PayPal',
    hint: 'Le bouton ouvre PayPal avec le montant déjà rempli.',
    btn: a => `Payer ${a} avec PayPal`,
    ref: 'Indiquez cette référence dans la note du paiement',
    notice: 'Le paiement va directement au bailleur. Il confirmera sa bonne réception.',
    solde: (a, q) => `Reste ${a} à régler${q ? ` ${q}` : ''}.`,
  },
  pt: {
    title: 'Pagar com PayPal',
    hint: 'O botão abre o PayPal com o montante já preenchido.',
    btn: a => `Pagar ${a} com PayPal`,
    ref: 'Indique esta referência na nota do pagamento',
    notice: 'O pagamento vai diretamente para o senhorio, que confirmará a receção.',
    solde: (a, q) => `Falta pagar ${a}${q ? ` ${q}` : ''}.`,
  },
  en: {
    title: 'Pay with PayPal',
    hint: 'The button opens PayPal with the amount already filled in.',
    btn: a => `Pay ${a} with PayPal`,
    ref: 'Add this reference in the payment note',
    notice: 'The payment goes directly to the landlord, who will confirm receipt.',
    solde: (a, q) => `${a} left to pay${q ? ` ${q}` : ''}.`,
  },
}

const eur = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export default function PaypalSection({ name, amount, soldeAmount, reference, lang, soldeQuand }: {
  name: string
  amount: number
  soldeAmount?: number
  reference: string
  lang: UiLang
  soldeQuand?: string
}) {
  const t = T[lang] ?? T.fr
  return (
    <div style={box}>
      <strong style={{ color: '#f0ebe1', display: 'block', marginBottom: '6px', fontSize: '16px' }}>{t.title}</strong>
      <p style={hint}>{t.hint}</p>
      <a href={paypalMeUrl(name, amount)} target="_blank" rel="noopener noreferrer" style={btn}>
        {t.btn(eur(amount))}
      </a>
      <p style={{ ...hint, marginTop: '14px', fontSize: '12px' }}>
        {t.ref} : <strong style={{ color: '#FFD56B', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{reference}</strong>
      </p>
      {soldeAmount != null && soldeAmount > 0.009 && (
        <p style={{ ...hint, marginTop: '8px' }}>{t.solde(eur(soldeAmount), soldeQuand)}</p>
      )}
      <p style={notice}>{t.notice}</p>
    </div>
  )
}

const box: React.CSSProperties = {
  background: 'rgba(255,213,107,0.05)',
  border: '1px solid rgba(255,213,107,0.22)',
  borderRadius: '16px',
  padding: '24px 28px',
  marginBottom: '16px',
}
const hint: React.CSSProperties = { fontSize: '13px', color: '#a5c4b0', lineHeight: 1.7, margin: 0 }
const btn: React.CSSProperties = {
  display: 'block', textAlign: 'center', marginTop: '16px', padding: '14px 18px',
  background: '#FFD56B', color: '#0a1a14', borderRadius: '12px',
  fontSize: '15px', fontWeight: 700, textDecoration: 'none',
}
const notice: React.CSSProperties = {
  fontSize: '12px', color: '#6b9a7e', lineHeight: 1.6, margin: '16px 0 0',
  paddingTop: '14px', borderTop: '1px solid rgba(255,213,107,0.15)',
}
