'use client'

import { useState, useTransition } from 'react'
import {
  MagnifyingGlass, ShieldCheck, ShieldWarning, Warning,
  CheckCircle, Phone, EnvelopeSimple, User,
  CaretDown, Info, PaperPlaneRight, X,
} from '@phosphor-icons/react'
import { searchGuest, reportGuest } from './actions'

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

export default function SecuriteView() {
  const [query, setQuery] = useState('')
  const [queryType, setQueryType] = useState<'email' | 'phone' | 'name'>('email')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, startSearch] = useTransition()

  const [showReport, setShowReport] = useState(false)
  const [isReporting, startReport] = useTransition()
  const [reportSuccess, setReportSuccess] = useState(false)
  const [reportError, setReportError] = useState('')
  const [report, setReport] = useState({
    identifier: '',
    identifier_type: 'email' as 'email' | 'phone' | 'name',
    name: '',
    incident_type: INCIDENT_TYPES[0],
    description: '',
    reporter_city: '',
  })

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
      setReport({ identifier: '', identifier_type: 'email', name: '', incident_type: INCIDENT_TYPES[0], description: '', reporter_city: '' })
    })
  }

  const incidentColor: Record<string, string> = {
    'Dégradation du logement': '#F87171',
    'Fête non autorisée': '#FB923C',
    'Tentative d\'arnaque / fraude': '#F87171',
    'Impayé / remboursement abusif': '#FB923C',
  }

  return (
    <div style={styles.page} className="dash-page">
      {/* Header section */}
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          Sécurité <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>voyageurs</em>
        </h2>
        <p style={styles.pageDesc}>
          Vérifie une demande de réservation douteuse ou signale un voyageur problématique à la communauté.
        </p>
      </div>

      <div style={styles.grid}>
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
              {/* Type selector */}
              <div style={styles.typeRow}>
                {(['email', 'phone', 'name'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQueryType(t)}
                    style={{ ...styles.typePill, ...(queryType === t ? styles.typePillActive : {}) }}
                  >
                    {t === 'email' ? <EnvelopeSimple size={13} /> : t === 'phone' ? <Phone size={13} /> : <User size={13} />}
                    {t === 'email' ? 'E-mail' : t === 'phone' ? 'Téléphone' : 'Nom'}
                  </button>
                ))}
              </div>

              <div style={styles.inputRow}>
                <input
                  type={queryType === 'email' ? 'email' : 'text'}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={
                    queryType === 'email' ? 'jean.dupont@gmail.com'
                    : queryType === 'phone' ? '+33 6 12 34 56 78'
                    : 'Prénom Nom'
                  }
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
                {results.length === 0 ? (
                  <div style={styles.resultOk}>
                    <CheckCircle size={28} color="#34D399" weight="fill" />
                    <div>
                      <div style={styles.resultOkTitle}>Aucun antécédent trouvé</div>
                      <div style={styles.resultOkDesc}>
                        Ce voyageur n'a pas été signalé dans notre base. Cela ne garantit pas l'absence de problème — reste vigilant et utilise les conseils ci-dessous.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={styles.resultAlertHeader}>
                      <ShieldWarning size={20} color="#F87171" weight="fill" />
                      <span style={styles.resultAlertTitle}>
                        {results.length} signalement{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {results.map(r => (
                      <div key={r.id} style={styles.resultItem}>
                        <div style={styles.resultItemHeader}>
                          <span style={{ ...styles.incidentBadge, background: (incidentColor[r.incident_type] ?? '#FB923C') + '20', color: incidentColor[r.incident_type] ?? '#FB923C' }}>
                            {r.incident_type}
                          </span>
                          <span style={styles.resultDate}>
                            {new Date(r.reported_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            {r.reporter_city ? ` — ${r.reporter_city}` : ''}
                          </span>
                        </div>
                        {r.description && (
                          <p style={styles.resultDesc}>{r.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Report CTA */}
            <div style={styles.reportCta}>
              <Info size={14} color="rgba(240,244,255,0.3)" />
              <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.35)' }}>
                Tu as eu un problème avec un voyageur ?
              </span>
              <button onClick={() => setShowReport(true)} style={styles.reportLink}>
                Signaler
              </button>
            </div>
          </div>

          {/* Report modal / inline form */}
          {showReport && (
            <div style={styles.reportCard} className="glass-card fade-up">
              <div style={styles.reportHeader}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0f4ff' }}>
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
                <div style={styles.formRow}>
                  <label style={styles.label}>Type d'identifiant</label>
                  <div style={styles.typeRow}>
                    {(['email', 'phone', 'name'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => setReport(r => ({ ...r, identifier_type: t }))}
                        style={{ ...styles.typePill, ...(report.identifier_type === t ? styles.typePillActive : {}) }}
                      >
                        {t === 'email' ? 'E-mail' : t === 'phone' ? 'Téléphone' : 'Nom'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    {report.identifier_type === 'email' ? 'Adresse e-mail' : report.identifier_type === 'phone' ? 'Numéro de téléphone' : 'Nom complet'}
                  </label>
                  <input
                    type="text"
                    value={report.identifier}
                    onChange={e => setReport(r => ({ ...r, identifier: e.target.value }))}
                    style={styles.input}
                    placeholder={report.identifier_type === 'email' ? 'jean.dupont@gmail.com' : report.identifier_type === 'phone' ? '+33 6...' : 'Prénom Nom'}
                    required
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Prénom / Nom (optionnel)</label>
                  <input
                    type="text"
                    value={report.name}
                    onChange={e => setReport(r => ({ ...r, name: e.target.value }))}
                    style={styles.input}
                    placeholder="Pour aider les autres membres à identifier"
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Type d'incident</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={report.incident_type}
                      onChange={e => setReport(r => ({ ...r, incident_type: e.target.value }))}
                      style={styles.select}
                    >
                      {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <CaretDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.4)', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Décris l'incident</label>
                  <textarea
                    value={report.description}
                    onChange={e => setReport(r => ({ ...r, description: e.target.value }))}
                    style={styles.textarea}
                    placeholder="Décris ce qui s'est passé (minimum 20 caractères). Ne mentionne pas d'informations personnelles sensibles."
                    rows={4}
                    required
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Ta ville (optionnel)</label>
                  <input
                    type="text"
                    value={report.reporter_city}
                    onChange={e => setReport(r => ({ ...r, reporter_city: e.target.value }))}
                    style={styles.input}
                    placeholder="Paris, Lyon, Marseille..."
                  />
                </div>

                {reportError && <p style={styles.errorMsg}>{reportError}</p>}

                <button
                  type="submit"
                  disabled={isReporting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  <PaperPlaneRight size={15} weight="bold" />
                  {isReporting ? 'Envoi...' : 'Envoyer le signalement'}
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

          {/* Disclaimer */}
          <div style={styles.disclaimer} className="fade-up">
            <Info size={14} color="rgba(240,244,255,0.25)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={styles.disclaimerText}>
              Les signalements sont soumis à modération avant publication. Cette base est alimentée par la communauté et ne remplace pas une démarche légale en cas de litige sérieux.
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
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', maxWidth: '540px', lineHeight: 1.6 },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '12px' },

  card: { padding: '28px', borderRadius: '20px' },
  cardTitle: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400,
    color: '#f0f4ff', marginBottom: '10px',
  },
  cardDesc: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', lineHeight: 1.6, marginBottom: '24px' },

  searchForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  typeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  typePill: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 400,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(240,244,255,0.5)', cursor: 'pointer',
  },
  typePillActive: {
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)',
    color: '#FFD56B',
  },
  inputRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#f0f4ff',
    outline: 'none',
  },
  errorMsg: { fontSize: '13px', color: '#F87171', marginTop: '4px' },

  resultsWrap: { marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' },
  resultOk: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '14px', padding: '16px 20px',
  },
  resultOkTitle: { fontSize: '15px', fontWeight: 600, color: '#34D399', marginBottom: '6px' },
  resultOkDesc: { fontSize: '13px', color: 'rgba(240,244,255,0.5)', lineHeight: 1.55 },
  resultAlertHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '14px',
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
  resultDate: { fontSize: '11px', color: 'rgba(240,244,255,0.3)' },
  resultDesc: { fontSize: '13px', color: 'rgba(240,244,255,0.6)', lineHeight: 1.55 },

  reportCta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  reportLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, color: '#FFD56B',
    textDecoration: 'underline', padding: 0,
  },

  // Report form
  reportCard: { padding: '24px', borderRadius: '20px' },
  reportHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', marginBottom: '12px',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(240,244,255,0.4)', padding: '4px', borderRadius: '6px',
  },
  reportNotice: {
    fontSize: '12px', color: 'rgba(240,244,255,0.4)', lineHeight: 1.5,
    background: 'rgba(255,213,107,0.06)', border: '1px solid rgba(255,213,107,0.12)',
    borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
  },
  reportForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: 'rgba(240,244,255,0.4)',
  },
  select: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 36px 10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#f0f4ff',
    outline: 'none', appearance: 'none' as const,
  },
  textarea: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#f0f4ff',
    outline: 'none', resize: 'vertical' as const, minHeight: '100px',
  },

  successBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '12px', padding: '14px 18px',
    fontSize: '13px', color: '#34D399',
  },

  // Tips
  tipsHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  tipsTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#f0f4ff' },
  tipsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tip: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '16px', borderRadius: '14px',
  },
  tipIcon: { fontSize: '20px', flexShrink: 0, marginTop: '1px' },
  tipTitle: { fontSize: '14px', fontWeight: 600, color: '#f0f4ff', marginBottom: '4px' },
  tipText: { fontSize: '12px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', lineHeight: 1.55 },

  disclaimer: {
    display: 'flex', gap: '10px',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px', marginTop: '4px',
  },
  disclaimerText: { fontSize: '11px', color: 'rgba(240,244,255,0.28)', lineHeight: 1.55 },
}
