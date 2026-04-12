'use client'

import { useState, useTransition } from 'react'
import {
  MagnifyingGlass, ShieldCheck, ShieldWarning, Warning,
  CheckCircle, Info, PaperPlaneRight, X, PhoneCall, Star, Trash,
} from '@phosphor-icons/react'
import { searchGuest, reportGuest, requestDeletion } from './actions'

const INCIDENT_TYPES = [
  'Dégradation du logement',
  'Fête non autorisée',
  'Non-respect des règles',
  'Fumée dans le logement',
  'Présence de personnes non déclarées',
  'Tentative d\'arnaque / fraude',
  'Avis négatif abusif',
  'Impayé / remboursement abusif',
  'Autre',
]

const POSITIVE_TYPES = [
  'Voyageur exemplaire',
  'Logement laissé impeccable',
  'Communication excellente',
  'Respect total des règles',
  'Je recommande vivement',
]

const TIPS = [
  {
    icon: '🔍',
    title: 'Vérifie le profil Airbnb',
    text: 'Un profil sans photo, sans avis et créé récemment est un signal d\'alerte. Demande toujours une raison du séjour.',
  },
  {
    icon: '📞',
    title: 'Propose un appel de vérification',
    text: 'Pour les réservations longues ou de grande valeur, propose un rapide appel téléphonique. Les escrocs fuient ce type de vérification.',
  },
  {
    icon: '💬',
    title: 'Méfie-toi des demandes inhabituelles',
    text: 'Paiement en dehors de la plateforme, voyageur "trop pressé", discours incohérent sur le motif du séjour = signaux d\'alerte.',
  },
  {
    icon: '📋',
    title: 'Ajoute une caution digitale',
    text: 'Utilise Swikly ou une plateforme équivalente pour sécuriser une empreinte bancaire sans friction pour le voyageur honnête.',
  },
  {
    icon: '📸',
    title: 'Documente l\'état des lieux',
    text: 'Photos horodatées avant chaque check-in. En cas de litige, c\'est ta principale preuve auprès d\'Airbnb ou en justice.',
  },
  {
    icon: '🔒',
    title: 'Serrure connectée = contrôle total',
    text: 'Une serrure connectée te permet de savoir quand quelqu\'un entre, de changer le code à distance, et de prouver les horaires en cas de problème.',
  },
]

type SearchResult = Awaited<ReturnType<typeof searchGuest>>['results'][0]

const incidentColor: Record<string, string> = {
  'Dégradation du logement': '#F87171',
  'Fête non autorisée': '#FB923C',
  'Tentative d\'arnaque / fraude': '#F87171',
  'Impayé / remboursement abusif': '#FB923C',
  'Voyageur exemplaire': '#34D399',
  'Logement laissé impeccable': '#34D399',
  'Communication excellente': '#34D399',
  'Respect total des règles': '#34D399',
  'Je recommande vivement': '#34D399',
}

const POSITIVE_SET = new Set(POSITIVE_TYPES)

export default function SecuriteView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, startSearch] = useTransition()

  const [showReport, setShowReport] = useState(false)
  const [isReporting, startReport] = useTransition()
  const [reportSuccess, setReportSuccess] = useState(false)
  const [reportError, setReportError] = useState('')
  const [report, setReport] = useState({
    email: '',
    phone: '',
    full_name: '',
    incident_type: INCIDENT_TYPES[0],
    description: '',
  })

  const [showPositive, setShowPositive] = useState(false)
  const [isPositive, startPositive] = useTransition()
  const [positiveSuccess, setPositiveSuccess] = useState(false)
  const [positiveError, setPositiveError] = useState('')
  const [positive, setPositive] = useState({
    email: '',
    phone: '',
    full_name: '',
    incident_type: POSITIVE_TYPES[0],
    description: '',
  })

  const [deletionRequestId, setDeletionRequestId] = useState<string | null>(null)
  const [isDeletionPending, startDeletion] = useTransition()
  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchError('')
    setResults(null)
    startSearch(async () => {
      const res = await searchGuest(query)
      if (res.error) { setSearchError(res.error); return }
      setResults(res.results)
    })
  }

  function handleReport(e: React.FormEvent) {
    e.preventDefault()
    setReportError('')
    startReport(async () => {
      const res = await reportGuest(report)
      if (res.error) { setReportError(res.error); return }
      setReportSuccess(true)
      setShowReport(false)
      setReport({ email: '', phone: '', full_name: '', incident_type: INCIDENT_TYPES[0], description: '' })
    })
  }

  function handlePositive(e: React.FormEvent) {
    e.preventDefault()
    setPositiveError('')
    startPositive(async () => {
      const res = await reportGuest(positive)
      if (res.error) { setPositiveError(res.error); return }
      setPositiveSuccess(true)
      setShowPositive(false)
      setPositive({ email: '', phone: '', full_name: '', incident_type: POSITIVE_TYPES[0], description: '' })
    })
  }

  function handleDeletionRequest(id: string, identifier: string) {
    startDeletion(async () => {
      const res = await requestDeletion({ entry_id: id, identifier })
      if (res.success) { setDeletionSuccess(id); setDeletionRequestId(null) }
    })
  }

  const hasOneIdentifier = report.email.trim() || report.phone.trim() || report.full_name.trim()
  const hasOnePositiveIdentifier = positive.email.trim() || positive.phone.trim() || positive.full_name.trim()

  return (
    <div style={styles.page} className="dash-page">
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          Sécurité <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>voyageurs</em>
        </h2>
        <p style={styles.pageDesc}>
          Vérifie une demande de réservation douteuse ou signale un voyageur problématique à la communauté.
        </p>
      </div>

      <div style={styles.grid} className="sec-grid">
        {/* LEFT COLUMN */}
        <div style={styles.leftCol}>
          {/* Search box */}
          <div style={styles.card} className="glass-card fade-up d1">
            <div style={styles.cardTitle}>
              <MagnifyingGlass size={18} color="#FFD56B" weight="fill" />
              Vérifier un voyageur
            </div>
            <p style={styles.cardDesc}>
              Entre l'e-mail, le numéro de téléphone ou le nom complet du voyageur pour vérifier s'il a eu des antécédents signalés par la communauté.
            </p>

            <form onSubmit={handleSearch} style={styles.searchForm}>
              <div style={styles.inputRow} className="sec-input-row">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="E-mail, téléphone ou nom complet..."
                  style={styles.input}
                  required
                />
                <button
                  type="submit"
                  disabled={isSearching || query.length < 3}
                  className="btn-primary"
                  style={{ padding: '10px 18px', fontSize: '14px', flexShrink: 0 }}
                >
                  {isSearching ? 'Recherche...' : 'Vérifier'}
                </button>
              </div>
              {searchError && <p style={styles.errorMsg}>{searchError}</p>}
            </form>

            {/* Results */}
            {results !== null && (
              <div style={styles.resultsWrap}>
                {(() => {
                  const negResults = results.filter(r => !POSITIVE_SET.has(r.incident_type))
                  const posResults = results.filter(r => POSITIVE_SET.has(r.incident_type))
                  return results.length === 0 ? null : (
                    <>
                      {negResults.length > 0 && (
                        <div>
                          <div style={styles.resultAlertHeader}>
                            <ShieldWarning size={20} color="#F87171" weight="fill" />
                            <span style={styles.resultAlertTitle}>
                              {negResults.length} signalement{negResults.length > 1 ? 's' : ''} trouvé{negResults.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          {negResults.map(r => (
                            <div key={r.id} style={styles.resultItem}>
                              <div style={styles.resultItemHeader}>
                                <span style={{ ...styles.incidentBadge, background: (incidentColor[r.incident_type] ?? '#FB923C') + '20', color: incidentColor[r.incident_type] ?? '#FB923C' }}>
                                  {r.incident_type}
                                </span>
                                <span style={styles.resultDate}>
                                  {new Date(r.reported_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                              {r.description && <p style={styles.resultDesc}>{r.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {posResults.length > 0 && (
                        <div>
                          <div style={styles.resultAlertHeader}>
                            <Star size={20} color="#34D399" weight="fill" />
                            <span style={{ ...styles.resultAlertTitle, color: '#34D399' }}>
                              {posResults.length} témoignage{posResults.length > 1 ? 's' : ''} positif{posResults.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          {posResults.map(r => (
                            <div key={r.id} style={styles.resultItemPositive}>
                              <div style={styles.resultItemHeader}>
                                <span style={{ ...styles.incidentBadge, background: '#34D39920', color: '#34D399' }}>
                                  {r.incident_type}
                                </span>
                                <span style={styles.resultDate}>
                                  {new Date(r.reported_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                              {r.description && <p style={styles.resultDesc}>{r.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {negResults.length === 0 && posResults.length > 0 && (
                        <div style={styles.resultOk}>
                          <CheckCircle size={28} color="#34D399" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <div style={styles.resultOkTitle}>Aucun signalement négatif</div>
                            <div style={styles.resultOkDesc}>Ce voyageur a uniquement des témoignages positifs dans notre base.</div>
                          </div>
                        </div>
                      )}
                      <div style={styles.legalNote}>
                        <Info size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          Ces signalements sont soumis à modération. Ils constituent des témoignages communautaires et ne valent pas décision judiciaire.
                        </span>
                      </div>

                      {/* RGPD deletion requests */}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          RGPD — Droit à l'effacement (Art. 17)
                        </div>
                        {results.map(r => (
                          <div key={r.id} style={{ marginBottom: '6px' }}>
                            {deletionSuccess === r.id ? (
                              <span style={{ fontSize: '12px', color: '#34D399' }}>
                                ✓ Demande de suppression envoyée pour cette fiche
                              </span>
                            ) : deletionRequestId === r.id ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                                  Confirmer la demande de suppression de la fiche «&nbsp;{r.identifier}&nbsp;» ?
                                </span>
                                <button
                                  onClick={() => handleDeletionRequest(r.id, r.identifier)}
                                  disabled={isDeletionPending}
                                  style={{ fontSize: '12px', background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                                >
                                  {isDeletionPending ? 'Envoi...' : 'Confirmer'}
                                </button>
                                <button
                                  onClick={() => setDeletionRequestId(null)}
                                  style={{ fontSize: '12px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', padding: '4px 6px' }}
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletionRequestId(r.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0', textDecoration: 'underline' }}
                              >
                                <Trash size={12} />
                                Je souhaite supprimer la fiche «&nbsp;{r.identifier}&nbsp;»
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
                {results.length === 0 && (
                  <div>
                    <div style={styles.resultOk}>
                      <CheckCircle size={28} color="#34D399" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={styles.resultOkTitle}>Aucun signalement trouvé</div>
                        <div style={styles.resultOkDesc}>
                          Ce voyageur n'apparaît pas dans notre base communautaire. Cela ne garantit pas l'absence de risque — restez vigilant et fiez-vous à votre instinct.
                        </div>
                      </div>
                    </div>
                    <div style={styles.vigilanceBox}>
                      <Info size={14} color="#FFD56B" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>Restez quand même vigilant.</strong>{' '}
                        En cas de doute, consultez les conseils de sécurité ci-contre ou contactez-nous directement.
                        Notre base est alimentée par la communauté et ne couvre pas tous les cas.
                      </div>
                    </div>
                    <div style={styles.contactCta}>
                      <PhoneCall size={14} color="var(--text-3)" />
                      <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                        Doute persistant ?
                      </span>
                      <a
                        href="https://wa.me/33630212592"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.contactLink}
                      >
                        Contactez Jason sur WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report CTAs */}
            <div style={styles.reportCta}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' as const }}>
                <Info size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  Tu as eu un problème ?
                </span>
                <button
                  onClick={() => { setShowReport(v => !v); setShowPositive(false) }}
                  style={styles.reportLink}
                >
                  {showReport ? 'Annuler' : 'Signaler'}
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>·</span>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  Tout s'est bien passé ?
                </span>
                <button
                  onClick={() => { setShowPositive(v => !v); setShowReport(false) }}
                  style={styles.positiveLink}
                >
                  {showPositive ? 'Annuler' : 'Témoigner'}
                </button>
              </div>
            </div>
          </div>

          {/* Negative report form */}
          {showReport && (
            <div style={styles.reportCard} className="glass-card fade-up">
              <div style={styles.reportHeader}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Warning size={16} color="#FB923C" /> Signaler un voyageur
                </div>
                <button onClick={() => setShowReport(false)} style={styles.closeBtn}>
                  <X size={16} />
                </button>
              </div>
              <p style={styles.reportNotice}>
                Ton signalement sera examiné avant publication. Ne partage pas d'informations personnelles sensibles dans la description.
              </p>

              <form onSubmit={handleReport} style={styles.reportForm}>
                <div style={styles.identifiersBlock}>
                  <label style={styles.label}>Coordonnées du voyageur <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(au moins un champ)</span></label>
                  <input
                    type="email"
                    value={report.email}
                    onChange={e => setReport(r => ({ ...r, email: e.target.value }))}
                    style={styles.input}
                    placeholder="E-mail (optionnel)"
                  />
                  <input
                    type="tel"
                    value={report.phone}
                    onChange={e => setReport(r => ({ ...r, phone: e.target.value }))}
                    style={styles.input}
                    placeholder="Téléphone (optionnel)"
                  />
                  <input
                    type="text"
                    value={report.full_name}
                    onChange={e => setReport(r => ({ ...r, full_name: e.target.value }))}
                    style={styles.input}
                    placeholder="Nom & prénom (optionnel)"
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Type d'incident</label>
                  <select
                    value={report.incident_type}
                    onChange={e => setReport(r => ({ ...r, incident_type: e.target.value }))}
                    style={styles.select}
                  >
                    {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Décris l'incident <span style={{ color: '#F87171' }}>*</span></label>
                  <textarea
                    value={report.description}
                    onChange={e => setReport(r => ({ ...r, description: e.target.value }))}
                    style={styles.textarea}
                    placeholder="Décris ce qui s'est passé (minimum 20 caractères). Ne mentionne pas d'informations personnelles sensibles."
                    rows={4}
                    required
                  />
                  <span style={{ fontSize: '11px', color: report.description.length < 20 ? 'var(--text-muted)' : '#34D399' }}>
                    {report.description.length}/20 minimum
                  </span>
                </div>

                {reportError && (
                  <p style={styles.errorMsg}>
                    {reportError === 'TABLE_MISSING'
                      ? '⚠️ La table n\'existe pas encore dans Supabase. Exécute le fichier supabase-migration.sql dans le dashboard Supabase.'
                      : reportError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isReporting || !hasOneIdentifier || report.description.length < 20}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  <PaperPlaneRight size={15} weight="bold" />
                  {isReporting ? 'Envoi...' : 'Envoyer le signalement'}
                </button>
              </form>
            </div>
          )}

          {/* Positive report form */}
          {showPositive && (
            <div style={styles.positiveCard} className="glass-card fade-up">
              <div style={styles.reportHeader}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={16} color="#34D399" weight="fill" /> Témoigner positivement
                </div>
                <button onClick={() => setShowPositive(false)} style={styles.closeBtn}>
                  <X size={16} />
                </button>
              </div>
              <p style={styles.positiveNotice}>
                Partage une bonne expérience avec la communauté. Ce témoignage sera examiné avant publication.
              </p>

              <form onSubmit={handlePositive} style={styles.reportForm}>
                <div style={styles.identifiersBlock}>
                  <label style={styles.label}>Coordonnées du voyageur <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(au moins un champ)</span></label>
                  <input
                    type="email"
                    value={positive.email}
                    onChange={e => setPositive(r => ({ ...r, email: e.target.value }))}
                    style={styles.input}
                    placeholder="E-mail (optionnel)"
                  />
                  <input
                    type="tel"
                    value={positive.phone}
                    onChange={e => setPositive(r => ({ ...r, phone: e.target.value }))}
                    style={styles.input}
                    placeholder="Téléphone (optionnel)"
                  />
                  <input
                    type="text"
                    value={positive.full_name}
                    onChange={e => setPositive(r => ({ ...r, full_name: e.target.value }))}
                    style={styles.input}
                    placeholder="Nom & prénom (optionnel)"
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Type de témoignage</label>
                  <select
                    value={positive.incident_type}
                    onChange={e => setPositive(r => ({ ...r, incident_type: e.target.value }))}
                    style={styles.selectPositive}
                  >
                    {POSITIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Décris ton expérience <span style={{ color: '#34D399' }}>*</span></label>
                  <textarea
                    value={positive.description}
                    onChange={e => setPositive(r => ({ ...r, description: e.target.value }))}
                    style={styles.textareaPositive}
                    placeholder="Décris ce qui s'est bien passé (minimum 20 caractères)."
                    rows={4}
                    required
                  />
                  <span style={{ fontSize: '11px', color: positive.description.length < 20 ? 'var(--text-muted)' : '#34D399' }}>
                    {positive.description.length}/20 minimum
                  </span>
                </div>

                {positiveError && <p style={styles.errorMsg}>{positiveError}</p>}

                <button
                  type="submit"
                  disabled={isPositive || !hasOnePositiveIdentifier || positive.description.length < 20}
                  style={{ ...styles.positiveBtn, width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  <Star size={15} weight="bold" />
                  {isPositive ? 'Envoi...' : 'Envoyer le témoignage'}
                </button>
              </form>
            </div>
          )}

          {reportSuccess && (
            <div style={styles.successBanner} className="fade-up">
              <CheckCircle size={18} color="#34D399" weight="fill" />
              Signalement reçu — il sera examiné avant publication. Merci pour la communauté.
            </div>
          )}

          {positiveSuccess && (
            <div style={styles.positiveBanner} className="fade-up">
              <Star size={18} color="#34D399" weight="fill" />
              Témoignage reçu — il sera examiné avant publication. Merci pour la communauté !
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Tips */}
        <div style={styles.rightCol}>
          <div style={styles.tipsHeader} className="fade-up d1">
            <ShieldCheck size={18} color="#FFD56B" weight="fill" />
            <span style={styles.tipsTitle}>Conseils de sécurité</span>
          </div>
          <div style={styles.tipsList}>
            {TIPS.map((tip, i) => (
              <div key={i} style={styles.tip} className={`glass-card fade-up d${i + 1}`}>
                <div style={styles.tipIcon}>{tip.icon}</div>
                <div>
                  <div style={styles.tipTitle}>{tip.title}</div>
                  <p style={styles.tipText}>{tip.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.disclaimer} className="fade-up">
            <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={styles.disclaimerText}>
              Les signalements sont soumis à modération avant publication. Cette base est alimentée par la communauté et ne remplace pas une démarche légale en cas de litige sérieux. Les données personnelles sont traitées conformément au RGPD.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '32px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '540px', lineHeight: 1.6 },

  grid: { gap: '24px' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '12px' },

  card: { padding: '28px', borderRadius: '20px' },
  cardTitle: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400,
    color: 'var(--text)', marginBottom: '10px',
  },
  cardDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' },

  searchForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  input: {
    flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'var(--text)',
    outline: 'none', width: '100%',
  },
  errorMsg: { fontSize: '13px', color: '#F87171', marginTop: '4px', lineHeight: 1.5 },

  resultsWrap: { marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  resultOk: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '14px', padding: '16px 20px',
  },
  resultOkTitle: { fontSize: '15px', fontWeight: 600, color: '#34D399', marginBottom: '6px' },
  resultOkDesc: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 },
  vigilanceBox: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    background: 'rgba(255,213,107,0.05)', border: '1px solid rgba(255,213,107,0.12)',
    borderRadius: '12px', padding: '14px 16px',
  },
  contactCta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '4px', paddingTop: '12px',
  },
  contactLink: {
    fontSize: '12px', fontWeight: 500, color: 'var(--accent-text)',
    textDecoration: 'underline',
  },
  resultAlertHeader: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px',
  },
  resultAlertTitle: { fontSize: '15px', fontWeight: 600, color: '#F87171' },
  resultItem: {
    background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
    borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
  },
  resultItemHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' },
  incidentBadge: {
    display: 'inline-block', fontSize: '11px', fontWeight: 600,
    padding: '3px 10px', borderRadius: '100px',
  },
  resultDate: { fontSize: '11px', color: 'var(--text-muted)' },
  resultDesc: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 },
  legalNote: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    marginTop: '8px', padding: '10px 12px',
    background: 'var(--surface)', borderRadius: '8px',
  },

  reportCta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)',
  },
  reportLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, color: 'var(--accent-text)',
    textDecoration: 'underline', padding: 0,
  },

  reportCard: { padding: '24px', borderRadius: '20px' },
  reportHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', marginBottom: '12px',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', padding: '4px', borderRadius: '6px',
  },
  reportNotice: {
    fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5,
    background: 'rgba(255,213,107,0.06)', border: '1px solid rgba(255,213,107,0.12)',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
  },
  reportForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  identifiersBlock: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
  },
  select: {
    width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'var(--text)',
    outline: 'none', appearance: 'none' as const,
  },
  selectPositive: {
    width: '100%', background: 'var(--bg-2)', border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'var(--text)',
    outline: 'none', appearance: 'none' as const,
  },
  textarea: {
    width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'var(--text)',
    outline: 'none', resize: 'vertical' as const, minHeight: '100px',
  },
  textareaPositive: {
    width: '100%', background: 'var(--bg-2)', border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'var(--text)',
    outline: 'none', resize: 'vertical' as const, minHeight: '100px',
  },

  successBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '12px', padding: '14px 18px',
    fontSize: '13px', color: '#34D399',
  },
  positiveBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '12px', padding: '14px 18px',
    fontSize: '13px', color: '#34D399',
  },
  positiveCard: {
    padding: '24px', borderRadius: '20px',
    border: '1px solid rgba(52,211,153,0.2)',
    background: 'rgba(52,211,153,0.04)',
  },
  positiveNotice: {
    fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5,
    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
  },
  positiveLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, color: '#34D399',
    textDecoration: 'underline', padding: 0,
  },
  positiveBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
    color: '#34D399', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600,
    padding: '11px 22px', borderRadius: '10px', cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  resultItemPositive: {
    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '12px', padding: '14px 16px', marginBottom: '10px',
  },

  tipsHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  tipsTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)' },
  tipsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tip: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '16px', borderRadius: '14px',
  },
  tipIcon: { fontSize: '20px', flexShrink: 0, marginTop: '1px' },
  tipTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' },
  tipText: { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.55 },

  disclaimer: {
    display: 'flex', gap: '10px',
    padding: '12px 14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', marginTop: '4px',
  },
  disclaimerText: { fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55 },
}
