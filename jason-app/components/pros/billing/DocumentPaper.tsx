// Feuille d'un devis, d'une facture ou d'un avoir (04/10/2026), partagée par
// l'aperçu en direct de l'éditeur et la page du client (/doc/<jeton>).
// Couleurs fixes, pas de variables de thème : c'est un document imprimé sur
// fond blanc, identique en thème clair ou sombre. Composant pur (sans hook).

import {
  DOC_LABEL, eur, frDate, legalMentions, lineAmount, sellerDisplayName,
  type BillingProfile, type DocLine, type DocKind, type VatMode,
} from '@/lib/pros/billing'

export interface PaperDoc {
  kind: DocKind
  number: string | null
  status: string
  client_name: string | null
  client_email: string | null
  client_address: string | null
  client_is_pro: boolean
  client_siren: string | null
  title: string | null
  issue_date: string | null
  service_date: string | null
  valid_until: string | null
  due_date: string | null
  lines: DocLine[]
  vat_mode: VatMode
  vat_rate: number
  total_ht: number
  total_tva: number
  total_ttc: number
  notes: string | null
  accepted_at: string | null
  accepted_name: string | null
  paid_at: string | null
  paid_method: string | null
}

const C = {
  text: '#0B1D0F', muted: '#4A5D51', faint: '#7A8C80', green: '#004C3F', pale: '#F4F9F6',
  border: '#D5E5DB', yellow: '#FFD56B', rust: '#9A3B26',
}

export default function DocumentPaper({ doc, seller, logoUrl, sourceNumber, today }: {
  doc: PaperDoc
  seller: BillingProfile
  logoUrl?: string | null
  sourceNumber?: string | null
  today: string
}) {
  const draft = doc.status === 'brouillon'
  const issue = doc.issue_date ?? today
  const name = sellerDisplayName(seller) || 'Ton nom'
  const label = DOC_LABEL[doc.kind]
  const mentions = legalMentions({ ...doc, issue_date: issue }, seller, sourceNumber)
  const hasDetail = doc.lines.some(l => l.detail)
  const lines = doc.lines.length ? doc.lines : [{ label: '', qty: 1, unit: 'forfait', unit_price: 0 } as DocLine]

  return (
    <article style={s.paper} className="doc-paper">
      {draft && <div style={s.draftBand}>Aperçu du brouillon : le numéro est attribué à la finalisation</div>}

      <header style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" width={52} height={52} style={s.logo} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={s.seller}>{seller.trade_name || name}</div>
            {seller.trade_name && <div style={s.sellerSub}>{name}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={s.docType}>{label}</div>
          <div style={s.docNum}>{doc.number ?? 'Brouillon'}</div>
        </div>
      </header>
      <div style={s.filet} />

      <section style={s.parties}>
        <div style={s.party}>
          <div style={s.partyLabel}>Émis par</div>
          <div style={s.partyName}>{name}</div>
          {seller.address && <div style={s.line}>{seller.address}</div>}
          {seller.siret && <div style={s.line}>SIRET {seller.siret}</div>}
          {seller.vat_mode === 'tva' && seller.vat_number && <div style={s.line}>N° TVA {seller.vat_number}</div>}
          {seller.email && <div style={s.line}>{seller.email}</div>}
          {seller.phone && <div style={s.line}>{seller.phone}</div>}
        </div>
        <div style={{ ...s.party, ...s.partyClient }}>
          <div style={s.partyLabel}>{doc.kind === 'devis' ? 'Pour' : 'Facturé à'}</div>
          <div style={s.partyName}>{doc.client_name || <span style={{ color: C.faint }}>Nom du client</span>}</div>
          {doc.client_address && <div style={{ ...s.line, whiteSpace: 'pre-line' as const }}>{doc.client_address}</div>}
          {doc.client_is_pro && doc.client_siren && <div style={s.line}>SIREN {doc.client_siren}</div>}
          {doc.client_email && <div style={s.line}>{doc.client_email}</div>}
        </div>
      </section>

      <section style={s.meta}>
        <Meta k={doc.kind === 'devis' ? 'Date du devis' : 'Date de facture'} v={frDate(issue)} />
        {doc.service_date && <Meta k="Date de la prestation" v={frDate(doc.service_date)} />}
        {doc.kind === 'devis' && doc.valid_until && <Meta k="Valable jusqu'au" v={frDate(doc.valid_until)} />}
        {doc.kind === 'facture' && <Meta k="Échéance" v={doc.due_date && doc.due_date > issue ? frDate(doc.due_date) : 'À réception'} />}
        <Meta k="Nature" v="Prestation de services" />
      </section>

      {doc.title && <div style={s.objet}><span style={s.objetK}>Objet</span>{doc.title}</div>}

      <div style={{ overflowX: 'auto' as const }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: 'left' as const }}>Désignation</th>
              <th style={s.th}>Qté</th>
              <th style={s.th}>Prix unitaire{doc.vat_mode === 'tva' ? ' HT' : ''}</th>
              <th style={s.th}>Montant{doc.vat_mode === 'tva' ? ' HT' : ''}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td style={{ ...s.td, textAlign: 'left' as const }}>
                  <div style={{ fontWeight: 600, color: l.label ? C.text : C.faint }}>{l.label || 'Désignation de la prestation'}</div>
                  {hasDetail && l.detail && <div style={s.detail}>{l.detail}</div>}
                </td>
                <td style={s.td}>{fmtQty(l.qty)} <span style={{ color: C.faint }}>{l.unit}</span></td>
                <td style={s.td}>{eur(l.unit_price)}</td>
                <td style={{ ...s.td, fontWeight: 600 }}>{eur(lineAmount(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section style={s.bottom}>
        <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {doc.notes && <div style={s.notes}>{doc.notes}</div>}
          {doc.kind === 'facture' && doc.status !== 'paye' && (seller.iban || seller.bic) && (
            <div style={s.box}>
              <div style={s.boxTitle}>Paiement par virement</div>
              {seller.iban && <div style={s.mono}>IBAN {seller.iban}</div>}
              {seller.bic && <div style={s.mono}>BIC {seller.bic}</div>}
              {doc.number && <div style={s.lineSm}>Référence à indiquer : {doc.number}</div>}
            </div>
          )}
          {doc.kind === 'facture' && doc.status === 'paye' && doc.paid_at && (
            <div style={s.stamp}>Payée le {frDate(doc.paid_at)}{doc.paid_method ? ` (${doc.paid_method.toLowerCase()})` : ''}</div>
          )}
          {doc.kind === 'devis' && (doc.accepted_at ? (
            <div style={s.stamp}>Bon pour accord, accepté en ligne le {frDate(doc.accepted_at.slice(0, 10))}{doc.accepted_name ? ` par ${doc.accepted_name}` : ''}</div>
          ) : (
            <div style={s.sign}>
              <div style={s.boxTitle}>Bon pour accord</div>
              <div style={s.lineSm}>Date, nom et signature du client précédés de la mention « Bon pour accord »</div>
            </div>
          ))}
        </div>
        <div style={s.totals}>
          {doc.vat_mode === 'tva' && <>
            <Row k="Total HT" v={eur(doc.total_ht)} />
            <Row k={`TVA ${String(doc.vat_rate).replace('.', ',')} %`} v={eur(doc.total_tva)} />
          </>}
          <div style={s.totalBig}>
            <span>{doc.kind === 'avoir' ? 'Total de l\'avoir' : doc.vat_mode === 'tva' ? 'Total TTC' : 'Total'}</span>
            <span>{eur(doc.total_ttc)}</span>
          </div>
        </div>
      </section>

      <footer style={s.foot}>
        {mentions.map((m, i) => <p key={i} style={{ margin: 0 }}>{m}</p>)}
      </footer>
    </article>
  )
}

function fmtQty(n: number) {
  return (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={s.metaK}>{k}</div>
      <div style={s.metaV}>{v}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={s.totalRow}><span>{k}</span><span>{v}</span></div>
}

const s: Record<string, React.CSSProperties> = {
  paper: {
    background: '#fff', color: C.text, borderRadius: 6, padding: 'clamp(22px, 5%, 48px)',
    boxShadow: '0 1px 2px rgba(0,40,30,.06), 0 12px 40px rgba(0,40,30,.10)', fontFamily: 'var(--font-outfit), Outfit, -apple-system, Helvetica, Arial, sans-serif',
    fontSize: 13, lineHeight: 1.5, width: '100%', maxWidth: 820, margin: '0 auto', position: 'relative', overflow: 'hidden',
  },
  draftBand: { margin: '-6px 0 18px', padding: '7px 12px', borderRadius: 8, background: '#FFF6DB', color: '#7A5A0C', fontSize: 11.5, fontWeight: 600, textAlign: 'center' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  logo: { width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: `1px solid ${C.border}` },
  seller: { fontFamily: 'var(--font-fraunces), Fraunces, Georgia, serif', fontSize: 21, fontWeight: 500, letterSpacing: '-.01em', color: C.text, lineHeight: 1.2 },
  sellerSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  docType: { fontFamily: 'var(--font-fraunces), Fraunces, Georgia, serif', fontSize: 30, fontWeight: 500, color: C.green, letterSpacing: '-.02em', lineHeight: 1 },
  docNum: { fontSize: 13, fontWeight: 700, color: C.muted, marginTop: 6, fontVariantNumeric: 'tabular-nums' },
  filet: { width: 64, height: 3, borderRadius: 3, background: C.yellow, margin: '18px 0 22px' },
  parties: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  party: { flex: '1 1 220px', minWidth: 0, padding: '14px 16px', borderRadius: 10, border: `1px solid ${C.border}` },
  partyClient: { background: C.pale },
  partyLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.green, marginBottom: 6 },
  partyName: { fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 3, overflowWrap: 'anywhere' },
  line: { fontSize: 12.5, color: C.muted, overflowWrap: 'anywhere' },
  lineSm: { fontSize: 11.5, color: C.muted, marginTop: 4 },
  meta: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, margin: '18px 0', padding: '12px 16px', borderRadius: 10, background: C.pale },
  metaK: { fontSize: 10.5, fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '.06em' },
  metaV: { fontSize: 13, fontWeight: 600, color: C.text, marginTop: 2 },
  objet: { fontSize: 13.5, color: C.text, margin: '0 0 14px', fontWeight: 600 },
  objetK: { fontSize: 10.5, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '.08em', marginRight: 10 },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 420 },
  th: { fontSize: 10.5, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right', padding: '9px 10px', borderBottom: `2px solid ${C.green}`, whiteSpace: 'nowrap' },
  td: { padding: '11px 10px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  detail: { fontSize: 11.5, color: C.muted, marginTop: 2, whiteSpace: 'normal' },
  bottom: { display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 18, alignItems: 'flex-start' },
  notes: { fontSize: 12.5, color: C.muted, whiteSpace: 'pre-line', lineHeight: 1.6 },
  box: { padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}` },
  boxTitle: { fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 },
  mono: { fontSize: 12.5, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: C.text, overflowWrap: 'anywhere' },
  sign: { padding: '12px 14px', borderRadius: 10, border: `1.5px dashed ${C.border}`, minHeight: 84 },
  stamp: { display: 'inline-block', alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 8, border: `2px solid ${C.green}`, color: C.green, fontWeight: 700, fontSize: 12.5, transform: 'rotate(-1.5deg)' },
  totals: { flex: '0 1 280px', marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  totalRow: { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13, color: C.muted, fontVariantNumeric: 'tabular-nums', padding: '0 4px' },
  totalBig: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 14px', borderRadius: 10, background: C.green, color: '#fff', fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' },
  foot: { marginTop: 26, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 10.5, color: C.faint, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 3 },
}
