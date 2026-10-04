// Page du client pour un devis, une facture ou un avoir d'un pro de l'annuaire
// (04/10/2026). Publique par jeton (comme /sign et /invoice), jamais indexée :
// voir, télécharger en PDF (impression du navigateur), accepter un devis.

import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import type { Metadata } from 'next'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { DOC_COLUMNS, normalizeDoc } from '@/lib/pros/billing-server'
import { DOC_LABEL, displayStatus, eur, frDate, sellerDisplayName, EMPTY_PROFILE } from '@/lib/pros/billing'
import DocumentPaper from '@/components/pros/billing/DocumentPaper'
import DocActions from './DocActions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Document', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  noStore()
  const { token } = await params
  if (!/^[0-9a-f]{32,64}$/i.test(token)) notFound()
  const db = getServiceClient()
  const { data } = await db.from('pro_documents').select(`${DOC_COLUMNS}, owner_kind, owner_id`).eq('public_token', token).maybeSingle()
  if (!data || data.status === 'brouillon') notFound()
  const doc = normalizeDoc(data as Record<string, unknown>)
  const table = data.owner_kind === 'cleaner' ? 'cleaners' : 'photographers'
  const [{ data: pro }, source] = await Promise.all([
    db.from(table).select('logo_url').eq('id', data.owner_id as string).maybeSingle(),
    doc.source_id ? db.from('pro_documents').select('number').eq('id', doc.source_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const today = parisToday()
  const seller = doc.seller ?? EMPTY_PROFILE
  const st = displayStatus(doc, today)
  const label = DOC_LABEL[doc.kind]
  const sellerName = seller.trade_name || sellerDisplayName(seller)
  const canAccept = doc.kind === 'devis' && st === 'en_attente'

  return (
    <div style={s.page} className="doc-page">
      <div style={s.bar} className="no-print">
        <div style={{ minWidth: 0 }}>
          <div style={s.barTitle}>{label} {doc.number} · {sellerName}</div>
          <div style={s.barSub}>
            {eur(doc.total_ttc)}
            {doc.kind === 'devis' && doc.valid_until && st === 'en_attente' && ` · valable jusqu'au ${frDate(doc.valid_until)}`}
            {st === 'expire' && ' · devis expiré'}
            {st === 'accepte' && ' · devis accepté'}
            {doc.kind === 'facture' && st === 'paye' && ' · payée'}
            {doc.kind === 'facture' && (st === 'a_encaisser' || st === 'en_retard') && (doc.due_date && doc.due_date > (doc.issue_date ?? '') ? ` · à régler avant le ${frDate(doc.due_date)}` : ' · à régler à réception')}
            {st === 'annule' && ' · facture annulée par un avoir'}
          </div>
        </div>
        <DocActions token={token} canAccept={canAccept} clientName={doc.client_name ?? ''} />
      </div>

      <main style={s.main}>
        <DocumentPaper doc={doc} seller={seller} logoUrl={(pro?.logo_url as string | null) ?? null} sourceNumber={(source?.data as { number?: string } | null)?.number ?? null} today={today} />
        <p style={s.powered} className="no-print">Document créé avec l&apos;outil de devis et factures de Jason Marinho, pour les pros de la location courte durée.</p>
      </main>

      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .doc-page { background: #fff !important; padding: 0 !important; }
          .doc-paper { box-shadow: none !important; max-width: none !important; padding: 0 !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#ECF5EF', padding: '0 0 40px', fontFamily: 'var(--font-outfit), Outfit, -apple-system, Helvetica, Arial, sans-serif', colorScheme: 'light' },
  bar: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', padding: '14px clamp(16px, 4vw, 40px)', background: '#004C3F', color: '#fff' },
  barTitle: { fontFamily: 'var(--font-fraunces), Fraunces, Georgia, serif', fontSize: 18, lineHeight: 1.25 },
  barSub: { fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 },
  main: { padding: '28px clamp(12px, 4vw, 40px) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  powered: { fontSize: 12, color: '#4A5D51', textAlign: 'center', margin: 0 },
}
