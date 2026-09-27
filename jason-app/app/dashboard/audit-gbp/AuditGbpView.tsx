import Link from 'next/link'
import AuditWizard from './AuditWizard'
import AuditHistory, { type PastAudit } from './AuditHistory'
import { MagnifyingGlass, Star, Camera, Megaphone, ChatCircleDots, Sparkle, IdentificationCard, Clock, ArrowRight, Lightning } from '@phosphor-icons/react/dist/ssr'

// Rendu de la page « Fiche Google » (données chargées par page.tsx) : séparé
// pour pouvoir le prévisualiser avec des données fictives.

const PILLAR_ICONS = [
  { Icon: IdentificationCard, label: 'Identité',  color: 'var(--info)' },
  { Icon: Camera,             label: 'Photos',    color: '#a78bfa' },
  { Icon: Star,               label: 'Avis',      color: 'var(--accent-text)' },
  { Icon: Megaphone,          label: 'Posts',     color: 'var(--success-1)' },
  { Icon: ChatCircleDots,     label: 'Q&A',       color: '#fb923c' },
  { Icon: Sparkle,            label: 'Attributs', color: '#f472b6' },
]

export type InitialAuditSession = { sessionId: string; businessName: string; city: string; answers: Record<string, unknown> }

export default function AuditGbpView({ userId, initialSession, pastAudits }: {
  userId: string | null
  initialSession?: InitialAuditSession
  pastAudits: PastAudit[]
}) {
  const done = pastAudits.filter(a => a.completed_at && a.score_global !== null)
  const lastAudit = done[0] ?? null
  const lastScore = lastAudit?.score_global ?? null
  const scoreDelta = lastAudit && done[1] ? (lastAudit.score_global as number) - (done[1].score_global as number) : null
  return (
    <>
      <div style={s.page}>


        {/* ── Hero (sept. 2026) : pourquoi, comment, et ton score. Avant : trois
              entrées concurrentes (URL, CSV, formulaire) sans hiérarchie, jargon
              « GBP » et score caché en bas de page. ── */}
        <section style={s.heroNew} className="fade-up gg-hero">
          <div style={{ flex: '1 1 440px', minWidth: 0 }}>
            <div style={s.heroEyebrow}>
              <MagnifyingGlass size={13} weight="bold" /> Fiche Google
            </div>
            <h1 style={s.heroTitleNew}>
              Sois trouvé quand on cherche <em style={{ fontStyle: 'italic', color: 'var(--accent-text)' }}>« gîte + ta ville »</em>
            </h1>
            <p style={s.heroDescNew}>
              Beaucoup de voyageurs cherchent directement sur Google Maps. Une fiche complète, avec des photos
              et des avis, t&apos;amène des réservations en direct, sans commission.
            </p>
            <ol style={s.steps}>
              {[
                ['Colle', 'le lien de ta fiche Google Maps'],
                ['Vérifie', 'les points à compléter'],
                ['Suis', 'ton plan d’action priorisé'],
              ].map(([verb, rest], i) => (
                <li key={verb} style={s.step}>
                  <span style={s.stepNum}>{i + 1}</span>
                  <span><strong style={{ color: 'var(--text)' }}>{verb}</strong> {rest}</span>
                </li>
              ))}
            </ol>
            {!initialSession && (
              <div style={s.ctaRow}>
                <Link href="/dashboard/audit-gbp/import-url" style={s.ctaPrimary}>
                  <Lightning size={15} weight="fill" /> Lancer l&apos;audit express · 30 s
                </Link>
                <a href="#audit-complet" style={s.ctaSecondary}>Répondre aux 25 questions</a>
              </div>
            )}
          </div>

          {/* Dernier score : la raison de revenir sur la page */}
          <div style={s.scoreCard}>
            {lastScore !== null ? (
              <>
                <span style={s.scoreLabel}>Ton dernier score</span>
                <span style={{ ...s.scoreValue, color: scoreColor(lastScore) }}>
                  {lastScore}<span style={s.scoreMax}>/100</span>
                </span>
                <div style={s.scoreBar}><div style={{ ...s.scoreFill, width: `${lastScore}%`, background: scoreColor(lastScore) }} /></div>
                {scoreDelta !== null && scoreDelta !== 0 && (
                  <span style={{ ...s.scoreDelta, color: scoreDelta > 0 ? 'var(--success-1)' : 'var(--danger)' }}>
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta} pts depuis l&apos;audit précédent
                  </span>
                )}
                {lastAudit && (
                  <Link href={`/dashboard/audit-gbp/resultats/${lastAudit.id}`} style={s.scoreLink}>
                    Voir mon plan d&apos;action <ArrowRight size={13} weight="bold" />
                  </Link>
                )}
              </>
            ) : (
              <>
                <span style={s.scoreLabel}>Ce qui est vérifié</span>
                <div style={s.pillarsGrid}>
                  {PILLAR_ICONS.map(({ Icon, label, color }) => (
                    <span key={label} style={s.pillarChip}>
                      <Icon size={14} color={color} weight="fill" /> {label}
                    </span>
                  ))}
                </div>
                <span style={s.scoreHint}>Score sur 100 et plan d&apos;action, gratuit.</span>
              </>
            )}
          </div>
        </section>

        {/* ── Bandeau de reprise (si session en cours) ── */}
        {initialSession && (
          <div style={s.resumeBanner} className="fade-up">
            <div style={s.resumeIcon}>
              <Clock size={18} color="#60a5fa" weight="fill" />
            </div>
            <div style={s.resumeBody}>
              <div style={s.resumeTitle}>Tu reprends ton audit</div>
              <div style={s.resumeDesc}>
                Tes réponses précédentes sont chargées, continue là où tu t'étais
                arrêté. Tes modifications sont auto-sauvegardées.
              </div>
            </div>
            <Link href="/dashboard/audit-gbp" style={s.resumeReset}>
              Recommencer
            </Link>
          </div>
        )}

        {/* Grand écran : questionnaire à gauche, historique des audits à droite */}
        <div className={pastAudits.length > 0 ? 'gg-layout' : undefined}>
          <div style={{ minWidth: 0 }}>
            {/* ── Audit complet (25 questions) ── */}
            <div id="audit-complet" style={s.sectionHead}>
              <h2 style={s.sectionTitle}>Audit complet</h2>
              <span style={s.sectionSub}>
                25 questions sur 6 points (identité, photos, avis, posts, questions, attributs), ~5 min.
                Plusieurs fiches ? <Link href="/dashboard/audit-gbp/import-csv" style={s.inlineLink}>Importe ton CSV Google</Link>.
              </span>
            </div>
            <div style={s.section} className="fade-up">
              <AuditWizard userId={userId} initialSession={initialSession} />
            </div>
          </div>

          {/* ── Historique des audits ── */}
          {pastAudits.length > 0 && (
            <aside className="gg-aside">
              <AuditHistory audits={pastAudits} />
            </aside>
          )}
        </div>

        <style>{`
          .gg-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 28px; }
          @media (min-width: 1200px) {
            .gg-layout { grid-template-columns: minmax(0, 1fr) 360px; align-items: start; }
            .gg-aside { position: sticky; top: calc(var(--header-h, 64px) + 16px); }
          }
        `}</style>

      </div>
    </>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--success-1)'
  if (score >= 60) return '#d97706'
  if (score >= 40) return '#fb923c'
  return 'var(--danger)'
}

const s: Record<string, React.CSSProperties> = {
  heroNew: {
    display: 'flex', flexWrap: 'wrap', gap: '24px 40px', alignItems: 'center',
    padding: 'clamp(22px,3vw,36px)', borderRadius: '20px', marginBottom: '28px',
    background: 'linear-gradient(135deg, rgba(66,133,244,0.10) 0%, rgba(52,168,83,0.08) 55%, rgba(251,188,5,0.10) 100%)',
    border: '1px solid rgba(66,133,244,0.20)',
  },
  heroEyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
    color: '#4285F4', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px',
  },
  heroTitleNew: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.5px',
  },
  heroDescNew: { fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: '580px' },
  steps: { listStyle: 'none', margin: '0 0 20px', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' },
  step: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px 8px 8px',
    borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)',
    fontSize: '13px', color: 'var(--text-2)',
  },
  stepNum: {
    width: '22px', height: '22px', borderRadius: '50%', background: '#4285F4', color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0,
  },
  ctaRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' },
  ctaPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '14.5px', fontWeight: 700, textDecoration: 'none',
  },
  ctaSecondary: { fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'underline', textUnderlineOffset: '3px' },
  scoreCard: {
    flex: '0 1 300px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '20px 22px', borderRadius: '18px', background: 'var(--surface)', border: '1px solid var(--border)',
  },
  scoreLabel: { fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  scoreValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '52px', lineHeight: 1, fontWeight: 500 },
  scoreMax: { fontSize: '20px', color: 'var(--text-3)', marginLeft: '2px' },
  scoreBar: { height: '8px', borderRadius: '999px', background: 'var(--bg)', overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: '999px' },
  scoreDelta: { fontSize: '12.5px', fontWeight: 600 },
  scoreLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none', marginTop: '4px' },
  scoreHint: { fontSize: '12.5px', color: 'var(--text-3)' },
  pillarsGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  sectionHead: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', scrollMarginTop: '80px' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  sectionSub: { fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.5 },
  inlineLink: { color: 'var(--accent-text)', fontWeight: 600 },
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  hero: {
    background: 'radial-gradient(ellipse 70% 80% at 90% 0%, var(--info-bg), transparent 60%), var(--surface)',
    border: '1px solid var(--info-border)',
    borderRadius: 'var(--r-xl)',
    padding: 'clamp(28px,3vw,40px)',
    marginBottom: 'var(--s-5)',
    boxShadow: 'var(--shadow-sm)',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(24px,3vw,34px)',
    fontWeight: 400, color: 'var(--text)',
    marginBottom: 'var(--s-3)', marginTop: 0,
    lineHeight: 'var(--lh-tight)', letterSpacing: 'var(--ls-tight)',
  },
  heroDesc: {
    fontSize: 'var(--t-base)', lineHeight: 'var(--lh-relax)',
    color: 'var(--text-2)', marginBottom: 'var(--s-5)',
    maxWidth: '600px',
  },
  pillarChip: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 600,
    color: 'var(--text-2)',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-pill)', padding: '5px 12px',
  },

  section: {
    marginBottom: '20px',
  },

  /* Bandeau de reprise */
  resumeBanner: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 18px',
    background: 'rgba(96,165,250,0.05)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '12px', marginBottom: '16px',
    flexWrap: 'wrap' as const,
  },
  resumeIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'rgba(96,165,250,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  resumeBody: { flex: 1, minWidth: 0 },
  resumeTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    marginBottom: '2px',
  },
  resumeDesc: {
    fontSize: '12px', color: 'var(--text-2)',
    lineHeight: 1.5,
  },
  resumeReset: {
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '7px 12px',
    textDecoration: 'none',
    flexShrink: 0,
  },

  /* Mode Express grid (2 cartes) */

  /* Historique */
}
