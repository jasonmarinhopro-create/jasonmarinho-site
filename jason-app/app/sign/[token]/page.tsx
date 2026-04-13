import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SignaturePage from './SignaturePage'
import PrintButton from './PrintButton'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function nights(arrivee: string, depart: string) {
  return Math.round((new Date(depart).getTime() - new Date(arrivee).getTime()) / 86400000)
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return {
    title: 'Contrat de location — Signature',
    description: 'Signez votre contrat de location électroniquement.',
    robots: 'noindex, nofollow',
    other: { token },
  }
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !contract) return notFound()

  const expired = new Date(contract.token_expires_at) < new Date()
  const alreadySigned = contract.statut === 'signe'
  const cancelled = contract.statut === 'annule'
  const n = nights(contract.date_arrivee, contract.date_depart)

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <div style={header}>
          <span style={badge}>
            {cancelled ? 'Annulé' : alreadySigned ? 'Signé' : expired ? 'Expiré' : 'En attente de signature'}
          </span>
          <h1 style={title}>
            Contrat de location<br />
            <em style={{ color: '#FFD56B', fontStyle: 'normal' }}>saisonnière</em>
          </h1>
          <p style={subtitle}>
            Établi conformément au Code civil (Art. 1366) et au Code du tourisme (L324-1).<br />
            Signature électronique valide selon le règlement eIDAS (UE) 910/2014.
          </p>
        </div>

        {/* Status banners */}
        {alreadySigned && (
          <div style={successBanner}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <strong>Ce contrat a été signé électroniquement</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>
                Signé le {formatDate(contract.signature_date)} — Les deux parties ont reçu une confirmation par email.
              </p>
            </div>
          </div>
        )}
        {expired && !alreadySigned && (
          <div style={warningBanner}>
            <span style={{ fontSize: '20px' }}>⏰</span>
            <div>
              <strong>Ce lien de signature a expiré</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>
                Contactez le propriétaire pour obtenir un nouveau lien.
              </p>
            </div>
          </div>
        )}
        {cancelled && (
          <div style={warningBanner}>
            <span style={{ fontSize: '20px' }}>❌</span>
            <div><strong>Ce contrat a été annulé.</strong></div>
          </div>
        )}

        {/* ─── Corps du contrat ─────────────────────────────────────────────── */}
        <div style={contractBody} className="contract-print">
          {/* Art. 1 — Parties */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 1 — Parties au contrat</h2>
            <div style={partyGrid}>
              <div style={partyBox}>
                <p style={partyLabel}>Bailleur (propriétaire)</p>
                <p style={partyName}>{contract.bailleur_prenom} {contract.bailleur_nom}</p>
                {contract.bailleur_adresse && <p style={partyDetail}>{contract.bailleur_adresse}</p>}
                {contract.bailleur_email && <p style={partyDetail}>{contract.bailleur_email}</p>}
                {contract.bailleur_telephone && <p style={partyDetail}>{contract.bailleur_telephone}</p>}
              </div>
              <div style={partyBox}>
                <p style={partyLabel}>Locataire</p>
                <p style={partyName}>{contract.locataire_prenom} {contract.locataire_nom}</p>
                {contract.locataire_email && <p style={partyDetail}>{contract.locataire_email}</p>}
                {contract.locataire_telephone && <p style={partyDetail}>{contract.locataire_telephone}</p>}
              </div>
            </div>
          </section>

          <div style={divider} />

          {/* Art. 2 — Bien loué */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 2 — Bien loué</h2>
            <p style={contractText}>
              Le bailleur loue au locataire le bien immobilier situé à l&apos;adresse suivante&nbsp;:
            </p>
            <p style={{ ...contractText, fontWeight: 600, color: 'var(--text, #f0ebe1)', marginTop: '8px' }}>
              {contract.logement_adresse}
            </p>
            {contract.logement_description && (
              <p style={{ ...contractText, marginTop: '8px' }}>{contract.logement_description}</p>
            )}
            <p style={{ ...contractText, marginTop: '8px' }}>
              Capacité maximale d&apos;occupation&nbsp;: <strong>{contract.capacite_max} personne{contract.capacite_max > 1 ? 's' : ''}</strong>.
            </p>
            <p style={{ ...contractText, marginTop: '6px', fontSize: '13px', opacity: 0.7 }}>
              Animaux admis&nbsp;: {contract.animaux_acceptes ? 'Oui' : 'Non'} —
              Tabac&nbsp;: {contract.fumeur_accepte ? 'Autorisé' : 'Interdit'}
            </p>
          </section>

          <div style={divider} />

          {/* Art. 3 — Durée */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 3 — Durée de la location</h2>
            <div style={datesGrid}>
              <div style={dateBox}>
                <p style={dateLabel}>Arrivée</p>
                <p style={dateValue}>{formatDate(contract.date_arrivee)}</p>
                <p style={dateTime}>à partir de {contract.heure_arrivee}</p>
              </div>
              <div style={dateArrow}>→</div>
              <div style={dateBox}>
                <p style={dateLabel}>Départ</p>
                <p style={dateValue}>{formatDate(contract.date_depart)}</p>
                <p style={dateTime}>avant {contract.heure_depart}</p>
              </div>
              <div style={nightsBadge}>
                {n} nuit{n > 1 ? 's' : ''}
              </div>
            </div>
          </section>

          <div style={divider} />

          {/* Art. 4 — Prix */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 4 — Prix et modalités de paiement</h2>
            <div style={pricesGrid}>
              <div style={priceBox}>
                <p style={priceLabel}>Loyer total</p>
                <p style={priceValue}>{Number(contract.montant_loyer).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
              </div>
              <div style={priceBox}>
                <p style={priceLabel}>Dépôt de garantie</p>
                <p style={priceValue}>{Number(contract.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted, #6b9a7e)', marginTop: '2px' }}>remboursé sous 7 jours après l&apos;état des lieux</p>
              </div>
            </div>
            <p style={{ ...contractText, marginTop: '12px' }}>
              <strong>Modalités de paiement&nbsp;:</strong> {contract.modalites_paiement}
            </p>
          </section>

          <div style={divider} />

          {/* Art. 5 — Conditions d'annulation */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 5 — Conditions d&apos;annulation</h2>
            <p style={{ ...contractText, whiteSpace: 'pre-line' }}>{contract.conditions_annulation}</p>
          </section>

          <div style={divider} />

          {/* Art. 6 — Règlement intérieur */}
          {contract.reglement_interieur && (
            <>
              <section style={contractSection}>
                <h2 style={sectionTitle}>Article 6 — Règlement intérieur</h2>
                <p style={{ ...contractText, whiteSpace: 'pre-line' }}>{contract.reglement_interieur}</p>
              </section>
              <div style={divider} />
            </>
          )}

          {/* Art. 7 — Obligations légales */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 7 — Obligations des parties</h2>
            <p style={contractText}>
              <strong>Le bailleur s&apos;engage à&nbsp;:</strong> remettre le logement en bon état, assurer la jouissance paisible des lieux,
              et garantir contre les vices et défauts qui rendraient le bien impropre à l&apos;usage.
            </p>
            <p style={{ ...contractText, marginTop: '10px' }}>
              <strong>Le locataire s&apos;engage à&nbsp;:</strong> user du logement en bon père de famille, payer le loyer aux termes convenus,
              ne pas sous-louer sans accord écrit du bailleur, respecter la capacité maximale d&apos;occupation ({contract.capacite_max} personne{contract.capacite_max > 1 ? 's' : ''}),
              et restituer les lieux dans l&apos;état initial.
            </p>
          </section>

          <div style={divider} />

          {/* Art. 8 — RGPD */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 8 — Protection des données personnelles (RGPD)</h2>
            <p style={contractText}>
              Les données personnelles collectées dans ce contrat sont traitées sur la base légale de l&apos;exécution du contrat
              (Art. 6.1.b RGPD). Elles sont conservées 5 ans à compter de la fin du séjour (prescription civile — Art. 2224 Code civil).
              Vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;effacement auprès du bailleur.
            </p>
          </section>

          <div style={divider} />

          {/* Art. 9 — Loi applicable */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 9 — Loi applicable et juridiction</h2>
            <p style={contractText}>
              Le présent contrat est soumis au droit français. En cas de litige, les parties tenteront de résoudre
              leur différend à l&apos;amiable. À défaut, le tribunal compétent sera celui du lieu de situation du bien loué.
            </p>
          </section>

          <div style={divider} />

          {/* Art. 10 — Signature électronique */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>Article 10 — Valeur juridique de la signature électronique</h2>
            <p style={contractText}>
              La signature électronique apposée ci-dessous constitue une <strong>signature électronique simple</strong> au sens
              du règlement (UE) n° 910/2014 (eIDAS) et de l&apos;article 1366 du Code civil français.
              Elle est produite après identification du signataire par son adresse email, et l&apos;enregistrement de l&apos;adresse IP,
              de l&apos;horodatage et du navigateur utilisé (audit trail). Sa valeur probante est reconnue devant les juridictions françaises et européennes.
            </p>
          </section>
        </div>

        {/* Signature ou confirmation */}
        {alreadySigned ? (
          <div style={signedBlock}>
            <div style={signedLeft}>
              <p style={signedLabel}>Signé par</p>
              <p style={signedName}>{contract.locataire_prenom} {contract.locataire_nom}</p>
              <p style={signedDate}>Le {formatDate(contract.signature_date)}</p>
            </div>
            {contract.signature_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contract.signature_image}
                alt="Signature"
                style={signatureImg}
              />
            )}
          </div>
        ) : !expired && !cancelled ? (
          <SignaturePage token={token} contractId={contract.id} locataireName={`${contract.locataire_prenom} ${contract.locataire_nom}`} />
        ) : null}

        {/* Footer légal */}
        <div style={footerLegal}>
          <p>
            Contrat établi via <a href="https://jasonmarinho.com" style={{ color: '#4a7260' }}>jasonmarinho.com</a>
            {' — '}Conforme au Code civil, au Code du tourisme et au règlement eIDAS (UE) 910/2014.
          </p>
          <p style={{ marginTop: '6px' }}>
            Référence&nbsp;: {contract.id.slice(0, 8).toUpperCase()} — Créé le {formatDate(contract.created_at)}
          </p>
        </div>

        {/* Print button (visible only on screen, not print) */}
        {alreadySigned && <PrintButton />}
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: #111 !important; }
          .no-print { display: none !important; }
          .contract-print { border: 1px solid #ddd !important; }
        }
        @media (prefers-color-scheme: light) {
          :root {
            --text: #1a1a1a;
            --text-muted: #666;
            --bg: #f8f8f8;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0a1a14',
  padding: 'clamp(16px, 4vw, 48px) 16px',
}

const container: React.CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
}

const header: React.CSSProperties = {
  marginBottom: '32px',
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(255,213,107,0.15)',
  border: '1px solid rgba(255,213,107,0.3)',
  borderRadius: '100px',
  padding: '4px 14px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  color: '#FFD56B',
  marginBottom: '16px',
}

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(26px, 5vw, 40px)',
  fontWeight: 400,
  color: '#f0ebe1',
  margin: '0 0 12px',
  lineHeight: 1.2,
}

const subtitle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b9a7e',
  lineHeight: 1.6,
  margin: 0,
}

const successBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
  background: 'rgba(52,211,153,0.1)',
  border: '1px solid rgba(52,211,153,0.25)',
  borderRadius: '14px',
  padding: '16px 20px',
  marginBottom: '24px',
  color: '#34D399',
  fontSize: '14px',
  lineHeight: 1.5,
}

const warningBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
  background: 'rgba(255,213,107,0.08)',
  border: '1px solid rgba(255,213,107,0.25)',
  borderRadius: '14px',
  padding: '16px 20px',
  marginBottom: '24px',
  color: '#FFD56B',
  fontSize: '14px',
  lineHeight: 1.5,
}

const contractBody: React.CSSProperties = {
  background: '#0f2018',
  border: '1px solid #1e3d2f',
  borderRadius: '20px',
  overflow: 'hidden',
  marginBottom: '24px',
}

const contractSection: React.CSSProperties = {
  padding: '24px 28px',
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '16px',
  fontWeight: 600,
  color: '#f0ebe1',
  margin: '0 0 14px',
}

const contractText: React.CSSProperties = {
  fontSize: '14px',
  color: '#a5c4b0',
  lineHeight: 1.8,
  margin: 0,
}

const divider: React.CSSProperties = {
  height: '1px',
  background: '#1e3d2f',
}

const partyGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
}

const partyBox: React.CSSProperties = {
  background: '#0a1a14',
  borderRadius: '12px',
  padding: '16px 18px',
}

const partyLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
  fontWeight: 600,
}

const partyName: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#f0ebe1',
  margin: '0 0 4px',
}

const partyDetail: React.CSSProperties = {
  fontSize: '13px',
  color: '#a5c4b0',
  margin: '2px 0',
}

const datesGrid: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap' as const,
}

const dateBox: React.CSSProperties = {
  background: '#0a1a14',
  borderRadius: '12px',
  padding: '14px 18px',
  minWidth: '140px',
}

const dateLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 6px',
  fontWeight: 600,
}

const dateValue: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#f0ebe1',
  margin: '0 0 2px',
}

const dateTime: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b9a7e',
  margin: 0,
}

const dateArrow: React.CSSProperties = {
  fontSize: '20px',
  color: '#4a7260',
  flexShrink: 0,
}

const nightsBadge: React.CSSProperties = {
  background: 'rgba(255,213,107,0.1)',
  border: '1px solid rgba(255,213,107,0.2)',
  borderRadius: '100px',
  padding: '6px 16px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#FFD56B',
}

const pricesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
}

const priceBox: React.CSSProperties = {
  background: '#0a1a14',
  borderRadius: '12px',
  padding: '16px 18px',
}

const priceLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 6px',
  fontWeight: 600,
}

const priceValue: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#f0ebe1',
  margin: 0,
  fontVariantNumeric: 'tabular-nums',
}

const signedBlock: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  background: 'rgba(52,211,153,0.06)',
  border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '16px',
  padding: '24px 28px',
  marginBottom: '20px',
  flexWrap: 'wrap' as const,
}

const signedLeft: React.CSSProperties = {}

const signedLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 6px',
  fontWeight: 600,
}

const signedName: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#34D399',
  margin: '0 0 4px',
}

const signedDate: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b9a7e',
  margin: 0,
}

const signatureImg: React.CSSProperties = {
  height: '80px',
  maxWidth: '200px',
  objectFit: 'contain',
  borderRadius: '8px',
  border: '1px solid rgba(52,211,153,0.2)',
  padding: '8px',
  background: 'rgba(255,255,255,0.04)',
}

const footerLegal: React.CSSProperties = {
  fontSize: '11px',
  color: '#4a7260',
  lineHeight: 1.6,
  borderTop: '1px solid #1e3d2f',
  paddingTop: '20px',
  marginTop: '12px',
}

