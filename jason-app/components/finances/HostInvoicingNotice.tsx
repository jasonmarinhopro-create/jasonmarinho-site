// Factures de l'hôte et facture électronique (05/10/2026, question d'une
// hôte : « créer des factures à la suite du contrat »). Faits vérifiés en
// octobre 2026 (sources dans l'article d'aide emettre-facture.md) :
// - réception des factures électroniques obligatoire depuis le 1/9/2026 pour
//   tous les loueurs meublés assujettis, franchise de TVA comprise ;
// - émission et e-reporting au 1/9/2027 seulement pour les loueurs redevables
//   de TVA ou en para-hôtellerie (au moins 3 des 4 services), même en franchise ;
// - location meublée sans services (exonérée, art. 261 D 4° CGI) à un
//   particulier : la facture de l'app suffit, rien ne change en 2027.
// Pas de hook : utilisable dans un composant serveur ou client.

import { Receipt, CheckCircle, WarningCircle, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { TIIME_URL, INDY_URL } from '@/lib/pros/invoicing-partners'

interface Props {
  /** Fond sombre (pages publiques /invoice) ou thème de l'app */
  tone?: 'app' | 'dark'
  /** Le client du contrat est une entreprise */
  proClient?: boolean
}

export default function HostInvoicingNotice({ tone = 'app', proClient = false }: Props) {
  const c = tone === 'dark'
    ? { bg: '#0f2018', border: '#1e3d2f', text: '#f0ebe1', text2: '#a5c4b0', accent: '#63D683', amber: '#FFD56B', card: 'rgba(255,255,255,0.03)' }
    : { bg: 'var(--surface)', border: 'var(--border)', text: 'var(--text)', text2: 'var(--text-2)', accent: 'var(--accent-text)', amber: '#8A5A12', card: 'var(--surface-2)' }

  const row = (ok: boolean, title: string, text: string) => (
    <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      {ok
        ? <CheckCircle size={16} weight="fill" color={c.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
        : <WarningCircle size={16} weight="fill" color={c.amber} style={{ flexShrink: 0, marginTop: '2px' }} />}
      <span><strong style={{ color: c.text }}>{title}</strong> {text}</span>
    </li>
  )

  const partner = (name: string, href: string, pitch: string) => (
    <a href={href} target="_blank" rel="sponsored noopener" style={{
      flex: '1 1 220px', display: 'block', textDecoration: 'none',
      background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '12px 14px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <strong style={{ color: c.text, fontSize: '14px' }}>{name}</strong>
        <ArrowSquareOut size={14} color={c.accent} />
      </span>
      <span style={{ fontSize: '12.5px', color: c.text2, lineHeight: 1.5, display: 'block' }}>{pitch}</span>
    </a>
  )

  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '16px 18px', fontSize: '13px', lineHeight: 1.6, color: c.text2 }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px', color: c.text, fontWeight: 700, fontSize: '14.5px' }}>
        <Receipt size={18} weight="fill" color={c.accent} />
        Factures : ce qui change avec la facture électronique
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'grid', gap: '8px' }}>
        {row(!proClient, 'Location meublée sans services, voyageur particulier :',
          'la facture de l’app reste valable, rien ne change en 2027.')}
        {row(false, 'Depuis le 1er septembre 2026 :',
          'tu dois pouvoir recevoir les factures électroniques de tes prestataires (ménage, conciergerie). Une plateforme agréée gratuite suffit.')}
        {row(false, 'À partir du 1er septembre 2027, si tu factures la TVA ou proposes au moins 3 services sur 4 (petit-déjeuner, ménage pendant le séjour, linge, accueil) :',
          `tes factures aux entreprises${proClient ? ' (comme ce client)' : ''} passent par une plateforme agréée et tes ventes aux particuliers sont déclarées. La facture de l’app ne suffira plus : fais-les dans un outil agréé.`)}
      </ul>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {partner('Tiime', TIIME_URL, 'Facturation gratuite, plateforme agréée : reçoit et émet tes factures électroniques.')}
        {partner('Indy', INDY_URL, 'Gratuit pour la facturation, offre LMNP pour ta déclaration. 1er mois offert sur l’offre payante.')}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: c.text2 }}>
        Liens affiliés : je touche une commission si tu t’abonnes, sans surcoût pour toi.
      </p>
    </div>
  )
}
