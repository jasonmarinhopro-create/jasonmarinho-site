import Link from 'next/link'
import { getProfile } from '@/lib/queries/profile'
import ImportCsvForm from './ImportCsvForm'
import { ArrowLeft, FileCsv, Lightning, Info, Question, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Audit Express, Import CSV, Jason Marinho' }

export default async function ImportCsvPage() {
  const profile = await getProfile()

  return (
    <>
      <div style={s.page}>

        {/* Retour */}
        <Link href="/dashboard/audit-gbp" style={s.back}>
          <ArrowLeft size={14} weight="bold" /> Retour à l'audit
        </Link>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroBadge}>
            <Lightning size={13} color="#FFD56B" weight="fill" />
            Audit Express · Import CSV
          </div>
          <h1 style={s.heroTitle}>
            Pré-remplis 7 questions<br />
            <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>en 2 clics.</em>
          </h1>
          <p style={s.heroDesc}>
            Google Business Profile permet d'exporter toutes tes infos en un fichier CSV.
            Importe-le ici et on pré-remplira automatiquement les questions sur l'identité,
            les catégories, la description, les horaires, et plus.
          </p>
        </div>

        {/* Instructions étape par étape */}
        <div style={s.steps}>
          <h2 style={s.stepsTitle}>Comment exporter ton CSV depuis Google</h2>

          <div style={s.step}>
            <div style={s.stepNum}>1</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Connecte-toi à Google Business Profile</div>
              <div style={s.stepDesc}>
                Rends-toi sur <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" style={s.link}>business.google.com<ArrowSquareOut size={11} weight="bold" style={{ marginLeft: 3 }} /></a> avec
                le compte Google associé à ta fiche.
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>2</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Sélectionne ta ou tes fiches</div>
              <div style={s.stepDesc}>
                Coche la (ou les) fiche que tu veux auditer. Si tu n'en gères qu'une seule
                et que tu ne vois pas la liste, c'est normal, Google va directement te proposer
                ses options de gestion en bas de page.
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>3</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Clique sur "Actions" puis "Télécharger"</div>
              <div style={s.stepDesc}>
                Bouton <strong>Actions</strong> en haut à droite → <strong>Télécharger les fiches</strong> →
                choisis le format <strong>Feuille de calcul (CSV)</strong>.
                Le fichier se télécharge en quelques secondes dans ton dossier "Téléchargements".
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>4</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Importe le fichier ici</div>
              <div style={s.stepDesc}>
                Glisse-dépose le fichier ci-dessous (ou clique pour le sélectionner).
                Ton fichier reste 100% privé : il est traité dans ton navigateur, pas envoyé sur nos serveurs.
              </div>
            </div>
          </div>
        </div>

        {/* FAQ / Fallback */}
        <details style={s.faq}>
          <summary style={s.faqQ}>
            <Question size={14} color="var(--text-2)" weight="fill" />
            Je ne vois pas le bouton "Actions" ou "Télécharger"
          </summary>
          <div style={s.faqA}>
            <p style={s.faqP}>
              Google a deux interfaces différentes selon ton type de compte :
            </p>
            <ul style={s.faqList}>
              <li>
                <strong>Compte multi-fiches</strong> : tu vois une liste de fiches → coche celles que tu veux,
                puis bouton <em>Actions</em> en haut à droite. Le téléchargement CSV est natif.
              </li>
              <li>
                <strong>Compte mono-fiche</strong> : Google ne te montre pas la liste, mais directement
                ta fiche. Dans ce cas, va plutôt sur <a href="https://www.google.com/search?q=mon+entreprise" target="_blank" rel="noopener noreferrer" style={s.link}>Google Search "mon entreprise"</a> et
                clique sur "Modifier le profil", l'export CSV n'est <strong>pas disponible</strong> dans
                cette interface.
              </li>
            </ul>
            <p style={{ ...s.faqP, marginTop: '12px' }}>
              <strong>Solution alternative</strong> : utilise Google Takeout pour exporter tes données
              GBP. Va sur <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" style={s.link}>takeout.google.com</a>,
              décoche tout sauf "Google Business Profile", clique "Étape suivante", lance l'export.
              Tu recevras le CSV par email sous 24h.
            </p>
            <p style={{ ...s.faqP, marginTop: '12px' }}>
              Si rien de tout ça ne fonctionne, tu peux toujours{' '}
              <Link href="/dashboard/audit-gbp" style={s.link}>faire l'audit manuellement</Link> -
              c'est plus long mais ça marche à 100%.
            </p>
          </div>
        </details>

        {/* Note privacy */}
        <div style={s.privacyNote}>
          <Info size={14} color="#34d399" weight="fill" />
          <div>
            <strong style={{ color: 'var(--text)' }}>Tes données restent privées.</strong> Le CSV
            est lu localement dans ton navigateur. Seules les réponses (oui/non/choix) sont
            sauvegardées en base, jamais le fichier brut.
          </div>
        </div>

        {/* Formulaire d'import */}
        <ImportCsvForm userId={profile?.userId ?? null} />

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '760px' },

  back: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--text-2)',
    textDecoration: 'none', marginBottom: '16px',
    padding: '6px 0',
  },

  /* Hero */
  hero: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,36px)',
    marginBottom: '20px',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: '#FFD56B', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400,
    color: 'var(--text)', marginBottom: '12px', marginTop: 0, lineHeight: 1.25,
  },
  heroDesc: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', maxWidth: '600px', margin: 0,
  },

  /* Steps */
  steps: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
    marginBottom: '16px',
  },
  stepsTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 18px',
  },
  step: {
    display: 'flex', gap: '14px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '16px',
  },
  stepNum: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'rgba(255,213,107,0.12)',
    color: '#FFD56B',
    fontWeight: 700, fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepBody: { flex: 1, paddingTop: '4px' },
  stepTitle: {
    fontSize: '14px', fontWeight: 600,
    color: 'var(--text)', marginBottom: '4px',
  },
  stepDesc: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7,
  },
  link: {
    color: '#FFD56B', textDecoration: 'none',
    fontWeight: 500,
  },

  /* FAQ accordéon */
  faq: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    marginBottom: '16px',
    padding: '0',
    overflow: 'hidden' as const,
  },
  faqQ: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 18px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    cursor: 'pointer',
    listStyle: 'none' as const,
  },
  faqA: {
    padding: '0 18px 18px',
    borderTop: '1px solid var(--border)',
    paddingTop: '14px',
  },
  faqP: {
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.7, margin: 0,
  },
  faqList: {
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.7,
    paddingLeft: '20px',
    margin: '8px 0 0',
  },

  /* Privacy note */
  privacyNote: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '12px 14px',
    background: 'rgba(52,211,153,0.06)',
    border: '1px solid rgba(52,211,153,0.18)',
    borderRadius: '10px',
    fontSize: '12.5px', color: 'var(--text-2)',
    lineHeight: 1.6, marginBottom: '20px',
  },
}
