'use client'

import { useState } from 'react'
import SignaturePage from './SignaturePage'
import PrintButton from './PrintButton'
import DepositSection from './DepositSection'
import PaymentSection from './PaymentSection'
import IbanSection from './IbanSection'
import ContractIbanBlock from './ContractIbanBlock'
import { getContractTemplate } from '@/lib/contract-templates'
import { getCountry } from '@/lib/countries'
import { SIGN_UI, formatDateLang, type UiLang } from '@/lib/sign-ui-i18n'
import { DEFAULT_ANNULATION, DEFAULT_REGLEMENT, resolveClauseText } from '@/lib/contract-default-clauses'

interface ContractRow {
  id: string
  statut: string
  token_expires_at: string
  signature_date: string | null
  signature_image: string | null
  created_at: string
  bailleur_prenom: string
  bailleur_nom: string
  bailleur_adresse: string | null
  bailleur_email: string | null
  bailleur_telephone: string | null
  locataire_prenom: string
  locataire_nom: string
  locataire_email: string | null
  locataire_telephone: string | null
  logement_adresse: string | null
  logement_description: string | null
  logement_description_pt?: string | null
  logement_description_en?: string | null
  capacite_max: number
  date_arrivee: string
  date_depart: string
  heure_arrivee: string
  heure_depart: string
  montant_loyer: number
  montant_caution: number
  modalites_paiement: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  conditions_annulation: string
  conditions_annulation_pt?: string | null
  conditions_annulation_en?: string | null
  reglement_interieur: string | null
  reglement_interieur_pt?: string | null
  reglement_interieur_en?: string | null
}

interface Props {
  token: string
  contract: ContractRow
  contractPays: string
  initialLang: UiLang
  isViewerBailleur: boolean
  expired: boolean
  cancelled: boolean
  alreadySigned: boolean
  n: number
  hostIban: string | null
  hostBic: string | null
  stripeReady: boolean
  paymentEnabled: boolean
  paymentAlreadyDone: boolean
  hasDeposit: boolean
  depositAlreadyHeld: boolean
  acomptePercent: number
  montantAcompte: number
  montantSolde: number
  paymentParam?: string
  depositParam?: string
}

const LANG_OPTIONS: UiLang[] = ['fr', 'pt', 'en']
const LANG_FLAG: Record<UiLang, string> = { fr: '🇫🇷', pt: '🇵🇹', en: '🇬🇧' }
const LANG_NAME: Record<UiLang, string> = { fr: 'Français', pt: 'Português', en: 'English' }

export default function ContractView({
  token, contract, contractPays, initialLang, isViewerBailleur, expired, cancelled, alreadySigned, n,
  hostIban, hostBic, stripeReady, paymentEnabled, paymentAlreadyDone, hasDeposit, depositAlreadyHeld,
  acomptePercent, montantAcompte, montantSolde, paymentParam, depositParam,
}: Props) {
  const [lang, setLang] = useState<UiLang>(initialLang)
  const t = SIGN_UI[lang]
  const tpl = getContractTemplate(contractPays, lang)
  const countryInfo = getCountry(contractPays)

  // Textes libres (description, clauses) : traduits seulement si le bailleur
  // a rempli les champs PT/EN sur la fiche logement, sauf pour les clauses
  // par défaut qui se traduisent automatiquement (cf. lib/contract-default-clauses.ts).
  const description = lang === 'en'
    ? (contract.logement_description_en || contract.logement_description)
    : lang === 'pt'
    ? (contract.logement_description_pt || contract.logement_description)
    : contract.logement_description
  const conditionsAnnulation = resolveClauseText(
    contract.conditions_annulation,
    lang === 'pt' ? contract.conditions_annulation_pt : contract.conditions_annulation_en,
    lang, DEFAULT_ANNULATION
  )
  const reglementInterieur = contract.reglement_interieur ? resolveClauseText(
    contract.reglement_interieur,
    lang === 'pt' ? contract.reglement_interieur_pt : contract.reglement_interieur_en,
    lang, DEFAULT_REGLEMENT
  ) : null

  const badgeStyle: React.CSSProperties = alreadySigned
    ? { ...badge, background: 'var(--success-border)', border: '1px solid rgba(52,211,153,0.35)', color: 'var(--success-1)' }
    : cancelled
    ? { ...badge, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: 'var(--danger)' }
    : expired
    ? { ...badge, background: 'rgba(165,196,176,0.12)', border: '1px solid rgba(165,196,176,0.25)', color: '#a5c4b0' }
    : badge

  return (
    <div style={page} className="print-page">
      <div style={container} className="print-container">
        {/* Sélecteur de langue du contrat */}
        <div style={langSwitcher} className="no-print">
          {LANG_OPTIONS.map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              style={{
                ...langBtn,
                background: lang === l ? 'var(--accent-bg-2)' : 'var(--surface)',
                border: `1.5px solid ${lang === l ? 'var(--accent-text)' : 'var(--border)'}`,
                color: lang === l ? 'var(--accent-text)' : 'var(--text-2)',
                fontWeight: lang === l ? 700 : 500,
                boxShadow: lang === l ? '0 0 0 3px var(--accent-bg)' : 'none',
              }}
              title={LANG_NAME[l]}
            >
              {LANG_FLAG[l]} {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Header */}
        <div style={header}>
          <span style={badgeStyle} className="no-print">
            {cancelled ? t.badgeCancelled : alreadySigned ? t.badgeSigned : expired ? t.badgeExpired : t.badgePending}
          </span>
          <h1 style={title} className="print-title">
            {t.contractTitle1}<br />
            <em style={{ color: '#FFD56B', fontStyle: 'normal' }}>{t.contractTitle2}</em>
          </h1>
          <p style={subtitle} className="print-subtitle">
            {tpl.legalBasis}<br />
            {t.eidasNote}
            {contractPays !== 'FR' && (
              <><br /><span style={{ fontSize: '11px', opacity: 0.75 }}>{countryInfo.flag} {t.boundByLaw} {countryInfo.name.toLowerCase()}</span></>
            )}
          </p>
        </div>

        {/* Status banners */}
        {alreadySigned && (
          <div style={successBanner} className="no-print">
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <strong>{t.signedBanner}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>
                {t.signedBannerSub(formatDateLang(contract.signature_date ?? contract.created_at, lang))}
              </p>
            </div>
          </div>
        )}
        {expired && !alreadySigned && (
          <div style={warningBanner} className="no-print">
            <span style={{ fontSize: '20px' }}>⏰</span>
            <div>
              <strong>{t.expiredBanner}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>{t.expiredBannerSub}</p>
            </div>
          </div>
        )}
        {cancelled && (
          <div style={warningBanner} className="no-print">
            <span style={{ fontSize: '20px' }}>❌</span>
            <div><strong>{t.cancelledBanner}</strong></div>
          </div>
        )}

        {/* ─── Corps du contrat ─────────────────────────────────────────────── */}
        <div style={contractBody} className="contract-print">
          {/* Art. 1, Parties */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art1}</h2>
            <div style={partyGrid}>
              <div style={partyBox}>
                <p style={partyLabel}>{t.bailleurLabel}</p>
                <p style={partyName}>{contract.bailleur_prenom} {contract.bailleur_nom}</p>
                {contract.bailleur_adresse && <p style={partyDetail}>{contract.bailleur_adresse}</p>}
                {contract.bailleur_email && <p style={partyDetail}>{contract.bailleur_email}</p>}
                {contract.bailleur_telephone && <p style={partyDetail}>{contract.bailleur_telephone}</p>}
              </div>
              <div style={partyBox}>
                <p style={partyLabel}>{t.locataireLabel}</p>
                <p style={partyName}>{contract.locataire_prenom} {contract.locataire_nom}</p>
                {contract.locataire_email && <p style={partyDetail}>{contract.locataire_email}</p>}
                {contract.locataire_telephone && <p style={partyDetail}>{contract.locataire_telephone}</p>}
              </div>
            </div>
          </section>

          <div style={divider} />

          {/* Art. 2, Bien loué */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art2}</h2>
            <p style={contractText}>{t.bienLoueIntro}</p>
            <p style={{ ...contractText, fontWeight: 600, color: '#f0ebe1', marginTop: '8px' }}>
              {contract.logement_adresse || <em style={{ color: '#6b9a7e', fontWeight: 400 }}>{t.addressMissing}</em>}
            </p>
            {description && (
              <p style={{ ...contractText, marginTop: '8px' }}>{description}</p>
            )}
            <p style={{ ...contractText, marginTop: '8px' }}>
              <strong>{t.capaciteMax(contract.capacite_max)}</strong>
            </p>
            <p style={{ ...contractText, marginTop: '6px', fontSize: '13px', opacity: 0.7 }}>
              {t.petsAllowed}&nbsp;: {contract.animaux_acceptes ? t.yes : t.no} -{' '}
              {contract.fumeur_accepte ? t.smokingAllowed : t.smokingForbidden}
            </p>
          </section>

          <div style={divider} />

          {/* Art. 3, Durée */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art3}</h2>
            <div style={datesGrid}>
              <div style={dateBox}>
                <p style={dateLabel}>{t.arrivee}</p>
                <p style={dateValue}>{formatDateLang(contract.date_arrivee, lang)}</p>
                <p style={dateTime}>{t.from} {contract.heure_arrivee}</p>
              </div>
              <div style={dateArrow}>→</div>
              <div style={dateBox}>
                <p style={dateLabel}>{t.depart}</p>
                <p style={dateValue}>{formatDateLang(contract.date_depart, lang)}</p>
                <p style={dateTime}>{t.before} {contract.heure_depart}</p>
              </div>
              <div style={nightsBadge}>{t.nights(n)}</div>
            </div>
          </section>

          <div style={divider} />

          {/* Art. 4, Prix */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art4}</h2>
            <div style={pricesGrid}>
              <div style={priceBox}>
                <p style={priceLabel}>{t.loyerTotal}</p>
                <p style={priceValue}>{Number(contract.montant_loyer).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
              </div>
              <div style={priceBox}>
                <p style={priceLabel}>{t.deposit}</p>
                <p style={priceValue}>{Number(contract.montant_caution).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted, #6b9a7e)', marginTop: '2px' }}>{t.depositRefund}</p>
              </div>
            </div>
            {acomptePercent < 100 && (
              <div style={{ ...pricesGrid, marginTop: '10px' }}>
                <div style={priceBox}>
                  <p style={priceLabel}>{t.acompte(acomptePercent)}</p>
                  <p style={priceValue}>{montantAcompte.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted, #6b9a7e)', marginTop: '2px' }}>{t.acompteHint}</p>
                </div>
                <div style={priceBox}>
                  <p style={priceLabel}>{t.solde}</p>
                  <p style={priceValue}>{montantSolde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted, #6b9a7e)', marginTop: '2px' }}>{t.soldeHint}</p>
                </div>
              </div>
            )}
            <p style={{ ...contractText, marginTop: '12px', marginBottom: '8px' }}>
              <strong>{t.paymentTerms}</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(contract.modalites_paiement ?? 'Virement bancaire').split(/,\s*|\s*\/\s*|\s*ou\s*/i).map((m: string, i: number) => (
                <span key={i} style={{
                  display: 'inline-block',
                  background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
                  borderRadius: '8px', padding: '4px 10px',
                  fontSize: '12px', color: '#FFD56B', fontWeight: 500,
                }}>{m.trim()}</span>
              ))}
            </div>
            {/* Coordonnées bancaires directement dans le corps du contrat, visibles
                dès avant la signature (pas seulement dans le bloc post-signature). */}
            {hostIban && (
              <ContractIbanBlock
                iban={hostIban}
                bic={hostBic}
                beneficiary={`${contract.bailleur_prenom} ${contract.bailleur_nom}`}
                primaryLang={lang}
              />
            )}
          </section>

          <div style={divider} />

          {/* Art. 5, Conditions d'annulation (texte libre rédigé par le bailleur —
              traduit seulement si les champs PT/EN de la fiche logement sont
              remplis, ou si c'est le texte par défaut non modifié) */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art5}</h2>
            <p style={{ ...contractText, whiteSpace: 'pre-line' }}>{conditionsAnnulation}</p>
          </section>

          <div style={divider} />

          {/* Art. 6, Règlement intérieur (idem) */}
          {reglementInterieur && (
            <>
              <section style={contractSection}>
                <h2 style={sectionTitle}>{t.art6}</h2>
                <p style={{ ...contractText, whiteSpace: 'pre-line' }}>{reglementInterieur}</p>
              </section>
              <div style={divider} />
            </>
          )}

          {/* Art. 7, Obligations légales */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art7}</h2>
            <p style={contractText}>
              <strong>{t.bailleurCommit}</strong> {tpl.obligationsBailleur}
            </p>
            <p style={{ ...contractText, marginTop: '10px' }}>
              <strong>{t.locataireCommit}</strong> {tpl.obligationsLocataire} {t.capaciteReminder(contract.capacite_max)}
            </p>
            {tpl.declarationVoyageur && (
              <p style={{ ...contractText, marginTop: '10px', fontSize: '13px', opacity: 0.85 }}>
                <strong>{t.foreignGuestDeclaration}</strong> {tpl.declarationVoyageur}
              </p>
            )}
          </section>

          <div style={divider} />

          {/* Art. 8, RGPD */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art8}</h2>
            <p style={contractText}>{tpl.rgpd}</p>
          </section>

          <div style={divider} />

          {/* Art. 9, Loi applicable */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art9}</h2>
            <p style={contractText}>{tpl.loiApplicable}</p>
          </section>

          <div style={divider} />

          {/* Art. 10, Signature électronique */}
          <section style={contractSection}>
            <h2 style={sectionTitle}>{t.art10}</h2>
            <p style={contractText}>{tpl.signatureElectronique}</p>
          </section>

          {/* Disclaimer template non-FR */}
          {tpl.disclaimer && (
            <section style={{ ...contractSection, background: 'var(--warning-bg)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.22)' }}>
              <p style={{ ...contractText, fontSize: '12px', fontStyle: 'italic', margin: 0, opacity: 0.85 }}>
                {tpl.disclaimer}
              </p>
            </section>
          )}
        </div>

        {/* Signature canvas (si non signé) */}
        {!alreadySigned && !expired && !cancelled && (
          <div className="no-print">
            {isViewerBailleur ? (
              <div style={warningBanner}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                <div>
                  <strong>{t.ownerLockedTitle}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>{t.ownerLockedText}</p>
                </div>
              </div>
            ) : (
              <SignaturePage token={token} contractId={contract.id} locataireName={`${contract.locataire_prenom} ${contract.locataire_nom}`} />
            )}
          </div>
        )}

        {/* ── Paiements (uniquement si actionnable : Stripe prêt ou IBAN configuré) ── */}
        {alreadySigned && ((paymentEnabled && stripeReady) || (hasDeposit && stripeReady) || hostIban) && (
          <div style={paymentsBlock} className="no-print">
            <p style={paymentsTitle}>{t.finalizeTitle}</p>

            {/* Sections Stripe (uniquement si compte prêt) */}
            {stripeReady && (
              <>
                {/* 1. Paiement de la réservation */}
                {paymentEnabled && (
                  <div id="paiement-reservation">
                    <PaymentSection
                      token={token}
                      amount={montantAcompte}
                      isPartial={acomptePercent < 100}
                      paymentParam={paymentParam}
                      alreadyPaid={paymentAlreadyDone}
                      lang={lang}
                    />
                  </div>
                )}
                {/* 2. Dépôt de garantie */}
                {hasDeposit && (
                  <div id="depot-garantie">
                    <DepositSection
                      token={token}
                      amount={Number(contract.montant_caution)}
                      depositParam={depositParam}
                      depositAlreadyHeld={depositAlreadyHeld}
                      lang={lang}
                    />
                  </div>
                )}
              </>
            )}

            {/* 3. Virement bancaire IBAN (si le bailleur a configuré son IBAN) */}
            {hostIban && (
              <IbanSection
                iban={hostIban}
                bic={hostBic}
                amount={montantAcompte}
                soldeAmount={acomptePercent < 100 ? montantSolde : undefined}
                reference={`LOC-${contract.id.slice(0, 8).toUpperCase()}`}
                beneficiary={`${contract.bailleur_prenom} ${contract.bailleur_nom}`}
                lang={lang}
              />
            )}
          </div>
        )}

        {/* Signature du locataire, affichée en bas du contrat */}
        {alreadySigned && (
          <div style={signedBlock} className="print-signature">
            <div style={signedLeft}>
              <p style={signedLabel}>{t.signedBy}</p>
              <p style={signedName}>{contract.locataire_prenom} {contract.locataire_nom}</p>
              <p style={signedDate}>{t.signedOn(formatDateLang(contract.signature_date ?? contract.created_at, lang))}</p>
            </div>
            {contract.signature_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contract.signature_image}
                alt="Signature"
                loading="lazy"
                style={signatureImg}
              />
            )}
          </div>
        )}

        {/* Footer légal */}
        <div style={footerLegal} className="print-footer">
          <p>
            {t.footerLine1.split('jasonmarinho.com').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <a href="https://jasonmarinho.com" style={{ color: '#4a7260' }}>jasonmarinho.com</a>}
              </span>
            ))}
          </p>
          <p style={{ marginTop: '6px' }}>
            {t.footerRef(contract.id.slice(0, 8).toUpperCase(), formatDateLang(contract.created_at, lang))}
          </p>
        </div>

        {/* Print button (visible only on screen, not print) */}
        {alreadySigned && <div className="no-print"><PrintButton /></div>}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm 15mm; }

          body { background: white !important; color: #111 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          .no-print { display: none !important; }

          .print-page { background: white !important; padding: 0 !important; min-height: auto !important; }
          .print-container { max-width: 100% !important; margin: 0 !important; }

          .print-title { font-family: Georgia, serif !important; font-size: 20px !important;
            color: #111 !important; margin-bottom: 4px !important; }
          .print-title em { color: #111 !important; font-style: italic !important; }
          .print-subtitle { font-size: 10px !important; color: #555 !important; margin-bottom: 10px !important; }

          .contract-print { background: white !important; border: 1px solid #ccc !important;
            border-radius: 4px !important; overflow: visible !important; margin-bottom: 10px !important; }
          .contract-print * { background: transparent !important; color: #111 !important;
            border-color: #ccc !important; }
          .contract-print section { padding: 12px 16px !important; break-inside: avoid; }
          .contract-print h2 { font-size: 11px !important; font-weight: 700 !important;
            text-transform: uppercase !important; letter-spacing: 0.5px !important;
            border-bottom: 1px solid #ddd !important; padding-bottom: 5px !important;
            margin-bottom: 8px !important; }
          .contract-print p { font-size: 11px !important; line-height: 1.6 !important;
            margin: 0 0 5px !important; }
          .contract-print strong { color: #000 !important; }
          .contract-print div[style*="height: 1px"] { background: #ddd !important; }

          .print-signature { background: white !important; border: 1px solid #ccc !important;
            border-radius: 4px !important; padding: 14px 18px !important;
            margin-bottom: 10px !important; break-inside: avoid; }
          .print-signature * { color: #111 !important; background: transparent !important; }
          .print-signature img { border: 1px solid #ccc !important; background: white !important; }

          .print-footer { color: #555 !important; border-top: 1px solid #ccc !important;
            font-size: 10px !important; padding-top: 8px !important; margin-top: 6px !important; }
          .print-footer a { color: #555 !important; }
        }
        @media (prefers-color-scheme: light) {
          :root { --text: #1a1a1a; --text-muted: #666; --bg: #f8f8f8; }
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
  maxWidth: '760px',
  margin: '0 auto',
  animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
}

const langSwitcher: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '20px',
}

const langBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const header: React.CSSProperties = {
  marginBottom: '40px',
  textAlign: 'center' as const,
}

const badge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255,213,107,0.12)',
  border: '1px solid rgba(255,213,107,0.32)',
  borderRadius: '999px',
  padding: '5px 14px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  color: '#FFD56B',
  marginBottom: '20px',
  boxShadow: '0 0 0 4px rgba(255,213,107,0.06)',
}

const title: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(28px, 5vw, 44px)',
  fontWeight: 400,
  color: '#f0ebe1',
  margin: '0 0 14px',
  lineHeight: 1.15,
  letterSpacing: '-0.5px',
}

const subtitle: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(240,235,225,0.55)',
  lineHeight: 1.7,
  margin: '0 auto',
  maxWidth: '520px',
}

const successBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
  background: 'radial-gradient(ellipse 60% 80% at 100% 0%, rgba(52,211,153,0.10), transparent 60%), rgba(52,211,153,0.06)',
  border: '1px solid rgba(52,211,153,0.32)',
  borderRadius: '14px',
  padding: '16px 22px',
  marginBottom: '24px',
  color: 'rgba(110,231,183,0.95)',
  fontSize: '14px',
  lineHeight: 1.55,
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
}

const warningBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
  background: 'radial-gradient(ellipse 60% 80% at 100% 0%, rgba(255,213,107,0.10), transparent 60%), rgba(255,213,107,0.05)',
  border: '1px solid rgba(255,213,107,0.32)',
  borderRadius: '14px',
  padding: '16px 22px',
  marginBottom: '24px',
  color: '#FFD56B',
  fontSize: '14px',
  lineHeight: 1.55,
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
}

const contractBody: React.CSSProperties = {
  background: '#0f2018',
  border: '1px solid #1e3d2f',
  borderRadius: '20px',
  overflow: 'hidden',
  marginBottom: '24px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
}

const contractSection: React.CSSProperties = {
  padding: '26px 30px',
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '16px',
  fontWeight: 600,
  color: '#f0ebe1',
  margin: '0 0 16px',
  letterSpacing: '-0.2px',
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
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '12px',
  padding: '18px 20px',
  transition: 'border-color 0.2s cubic-bezier(.4,0,.2,1)',
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
  fontSize: '17px',
  fontWeight: 600,
  color: '#f0ebe1',
  margin: '0 0 6px',
  letterSpacing: '-0.2px',
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
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '12px',
  padding: '16px 20px',
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
  background: 'rgba(255,213,107,0.12)',
  border: '1px solid rgba(255,213,107,0.28)',
  borderRadius: '999px',
  padding: '7px 18px',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.3px',
  boxShadow: '0 0 0 4px rgba(255,213,107,0.04)',
  color: '#FFD56B',
}

const pricesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
}

const priceBox: React.CSSProperties = {
  background: '#0a1a14',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '12px',
  padding: '18px 22px',
}

const priceLabel: React.CSSProperties = {
  fontSize: '10px',
  color: '#6b9a7e',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.2px',
  margin: '0 0 8px',
  fontWeight: 700,
}

const priceValue: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#FFD56B',
  margin: 0,
  fontVariantNumeric: 'tabular-nums',
  fontFamily: 'Georgia, serif',
  letterSpacing: '-0.5px',
}

const signedBlock: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  background: 'var(--success-bg)',
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
  color: 'var(--success-1)',
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
  background: '#ffffff',
}

const paymentsBlock: React.CSSProperties = {
  marginBottom: '24px',
}

const paymentsTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  color: '#6b9a7e',
  margin: '0 0 12px',
}

const footerLegal: React.CSSProperties = {
  fontSize: '11px',
  color: '#4a7260',
  lineHeight: 1.6,
  borderTop: '1px solid #1e3d2f',
  paddingTop: '20px',
  marginTop: '12px',
}
