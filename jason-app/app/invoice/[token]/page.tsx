import { createClient } from '@supabase/supabase-js'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import InvoicePrintButton from './InvoicePrintButton'

// Page publique (token-based, comme /sign/[token]) mais utile seulement au
// bailleur/locataire qui a le lien — jamais indexée, jamais devinable.
export const dynamic = 'force-dynamic'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  )
}

type Lang = 'fr' | 'pt'

const T: Record<Lang, {
  title: string
  invoiceNo: (n: string) => string
  issuedOn: (d: string) => string
  seller: string
  buyer: string
  taxId: string
  representedBy: string
  description: string
  lineLabel: (property: string, arr: string, dep: string, n: number) => string
  amount: string
  total: string
  paymentStatus: string
  paid: string
  pending: string
  legalNoticeB2B: string
  printLabel: string
  notIssuedTitle: string
  notIssuedBody: string
  locale: string
}> = {
  fr: {
    title: 'Facture',
    invoiceNo: n => `N° ${n}`,
    issuedOn: d => `Émise le ${d}`,
    seller: 'Vendeur',
    buyer: 'Client',
    taxId: 'N° SIRET / fiscal',
    representedBy: 'Représenté par',
    description: 'Désignation',
    lineLabel: (property, arr, dep, n) => `Location saisonnière, ${property}, du ${arr} au ${dep} (${n} nuit${n > 1 ? 's' : ''})`,
    amount: 'Montant',
    total: 'Total TTC',
    paymentStatus: 'Statut du paiement',
    paid: 'Réglé',
    pending: 'En attente',
    legalNoticeB2B: "En cas de retard de paiement, une pénalité au taux d'intérêt légal en vigueur ainsi qu'une indemnité forfaitaire de recouvrement de 40 € seront exigibles, conformément à l'article L441-10 du Code de commerce.",
    printLabel: 'Télécharger / Imprimer la facture (PDF)',
    notIssuedTitle: "Cette facture n'a pas encore été émise",
    notIssuedBody: 'Contactez le propriétaire pour obtenir la facture de ce contrat.',
    locale: 'fr-FR',
  },
  pt: {
    title: 'Fatura',
    invoiceNo: n => `N.º ${n}`,
    issuedOn: d => `Emitida em ${d}`,
    seller: 'Vendedor',
    buyer: 'Cliente',
    taxId: 'NIF',
    representedBy: 'Representado por',
    description: 'Descrição',
    lineLabel: (property, arr, dep, n) => `Arrendamento de curta duração, ${property}, de ${arr} a ${dep} (${n} noite${n > 1 ? 's' : ''})`,
    amount: 'Valor',
    total: 'Total',
    paymentStatus: 'Estado do pagamento',
    paid: 'Pago',
    pending: 'Pendente',
    legalNoticeB2B: 'Em caso de atraso no pagamento, será devida uma penalização à taxa de juro legal em vigor, nos termos da legislação aplicável.',
    printLabel: 'Descarregar / Imprimir a fatura (PDF)',
    notIssuedTitle: 'Esta fatura ainda não foi emitida',
    notIssuedBody: 'Contacte o proprietário para obter a fatura deste contrato.',
    locale: 'pt-PT',
  },
}

export async function generateMetadata() {
  return {
    title: 'Facture',
    robots: 'noindex, nofollow',
  }
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  noStore()
  const { token } = await params
  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !contract) return notFound()

  const lang: Lang = contract.langue === 'pt' ? 'pt' : 'fr'
  const t = T[lang]

  if (!contract.invoice_number) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={noticeBox}>
            <h1 style={{ ...title, fontSize: '22px', marginBottom: '10px' }}>{t.notIssuedTitle}</h1>
            <p style={{ color: '#a5c4b0', fontSize: '14px', margin: 0 }}>{t.notIssuedBody}</p>
          </div>
        </div>
      </div>
    )
  }

  const n = Math.round((new Date(contract.date_depart).getTime() - new Date(contract.date_arrivee).getTime()) / 86400000)
  const propertyLabel = contract.logement_nom ?? contract.logement_adresse
  const dateArr = new Date(contract.date_arrivee).toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const dateDep = new Date(contract.date_depart).toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const issuedDate = new Date(contract.invoice_issued_at).toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const amount = Number(contract.montant_loyer).toLocaleString(t.locale, { minimumFractionDigits: 2 })
  const isPaid = contract.stripe_payment_status === 'paid'
  const isPro = contract.locataire_type === 'professionnel' && !!contract.locataire_structure

  return (
    <div style={page} className="print-page">
      <div style={container} className="print-container">
        <div style={header}>
          <div>
            <h1 style={title} className="print-title">{t.title}</h1>
            <p style={subtitle}>{t.invoiceNo(contract.invoice_number)}</p>
            <p style={subtitle}>{t.issuedOn(issuedDate)}</p>
          </div>
        </div>

        <div style={partyGrid}>
          <div style={partyBox}>
            <p style={partyLabel}>{t.seller}</p>
            <p style={partyName}>{contract.bailleur_prenom} {contract.bailleur_nom}</p>
            {contract.bailleur_adresse && <p style={partyDetail}>{contract.bailleur_adresse}</p>}
            {contract.bailleur_email && <p style={partyDetail}>{contract.bailleur_email}</p>}
            {contract.bailleur_numero_fiscal && <p style={partyDetail}>{t.taxId}&nbsp;: {contract.bailleur_numero_fiscal}</p>}
          </div>
          <div style={partyBox}>
            <p style={partyLabel}>{t.buyer}</p>
            {isPro ? (
              <>
                <p style={partyName}>{contract.locataire_structure}</p>
                <p style={partyDetail}>{t.representedBy} {contract.locataire_prenom} {contract.locataire_nom}</p>
                {contract.locataire_nif && <p style={partyDetail}>{t.taxId}&nbsp;: {contract.locataire_nif}</p>}
              </>
            ) : (
              <p style={partyName}>{contract.locataire_prenom} {contract.locataire_nom}</p>
            )}
            {contract.locataire_email && <p style={partyDetail}>{contract.locataire_email}</p>}
          </div>
        </div>

        <div style={contractBody} className="contract-print">
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr>
                <th style={thStyle}>{t.description}</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>{t.lineLabel(propertyLabel, dateArr, dateDep, n)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' as const }}>{amount} €</td>
              </tr>
            </tbody>
          </table>

          <div style={totalRow}>
            <span style={totalLabel}>{t.total}</span>
            <span style={totalValue}>{amount} €</span>
          </div>

          {contract.bailleur_mention_tva && (
            <p style={tvaMention}>{contract.bailleur_mention_tva}</p>
          )}

          <div style={statusRow}>
            <span style={{ fontSize: '12px', color: '#6b9a7e' }}>{t.paymentStatus}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: isPaid ? '#34D399' : '#FFD56B' }}>
              {isPaid ? t.paid : t.pending}
            </span>
          </div>
        </div>

        {isPro && (
          <p style={legalNote}>{t.legalNoticeB2B}</p>
        )}

        <InvoicePrintButton label={t.printLabel} />
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm 15mm; }
          body { background: white !important; color: #111 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-page { background: white !important; padding: 0 !important; min-height: auto !important; }
          .print-container { max-width: 100% !important; margin: 0 !important; }
          .print-title { color: #111 !important; }
          .contract-print { background: white !important; border: 1px solid #ccc !important; }
          .contract-print * { background: transparent !important; color: #111 !important; border-color: #ccc !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,76,63,0.4), transparent 60%), #0a1a14',
  padding: 'clamp(20px, 4vw, 56px) clamp(16px, 4vw, 24px)',
}

const container: React.CSSProperties = {
  maxWidth: '680px',
  margin: '0 auto',
}

const noticeBox: React.CSSProperties = {
  background: '#0f2018',
  border: '1px solid #1e3d2f',
  borderRadius: '20px',
  padding: '32px',
  textAlign: 'center' as const,
}

const header: React.CSSProperties = {
  marginBottom: '28px',
}

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '32px',
  fontWeight: 400,
  color: '#f0ebe1',
  margin: '0 0 8px',
}

const subtitle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b9a7e',
  margin: '2px 0',
}

const partyGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
}

const partyBox: React.CSSProperties = {
  background: '#0f2018',
  border: '1px solid #1e3d2f',
  borderRadius: '14px',
  padding: '18px 20px',
}

const partyLabel: React.CSSProperties = {
  fontSize: '10px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.2px',
  margin: '0 0 10px',
  fontWeight: 700,
}

const partyName: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#f0ebe1',
  margin: '0 0 6px',
}

const partyDetail: React.CSSProperties = {
  fontSize: '13px',
  color: '#a5c4b0',
  margin: '2px 0',
}

const contractBody: React.CSSProperties = {
  background: '#0f2018',
  border: '1px solid #1e3d2f',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left' as const,
  fontSize: '11px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.8px',
  paddingBottom: '10px',
  borderBottom: '1px solid #1e3d2f',
}

const tdStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#e8ede8',
  padding: '14px 0',
  borderBottom: '1px solid #1e3d2f',
}

const totalRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '14px',
}

const totalLabel: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#f0ebe1',
}

const totalValue: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#FFD56B',
  fontFamily: 'Georgia, serif',
}

const tvaMention: React.CSSProperties = {
  fontSize: '11.5px',
  color: '#6b9a7e',
  marginTop: '12px',
  fontStyle: 'italic' as const,
}

const statusRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid #1e3d2f',
}

const legalNote: React.CSSProperties = {
  fontSize: '11px',
  color: '#4a7260',
  lineHeight: 1.6,
  textAlign: 'center' as const,
  margin: '0 0 8px',
}
