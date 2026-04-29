import Link from 'next/link'
import { getProfile } from '@/lib/queries/profile'
import ImportUrlForm from './ImportUrlForm'
import { ArrowLeft, MapPin, Lightning, Info, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Audit Express — Import URL — Jason Marinho' }

export default async function ImportUrlPage() {
  const profile = await getProfile()

  return (
    <>
      <div style={s.page}>

        <Link href="/dashboard/audit-gbp" style={s.back}>
          <ArrowLeft size={14} weight="bold" /> Retour à l'audit
        </Link>

        <div style={s.hero}>
          <div style={s.heroBadge}>
            <Lightning size={13} color="#34d399" weight="fill" />
            Audit Express · Import URL
          </div>
          <h1 style={s.heroTitle}>
            Pré-remplis 9 questions<br />
            <em style={{ color: '#34d399', fontStyle: 'italic' }}>en collant ton URL.</em>
          </h1>
          <p style={s.heroDesc}>
            Donne-nous le lien Google Maps de ta fiche : on récupère officiellement
            via l'API Google les infos clés (nom, catégorie, note, avis, horaires…)
            et on pré-remplit les questions correspondantes.
          </p>
        </div>

        <div style={s.steps}>
          <h2 style={s.stepsTitle}>Comment trouver ton URL ?</h2>

          <div style={s.step}>
            <div style={s.stepNum}>1</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Va sur Google Maps</div>
              <div style={s.stepDesc}>
                Ouvre <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={s.link}>google.com/maps<ArrowSquareOut size={11} weight="bold" style={{ marginLeft: 3 }} /></a> et
                tape le nom de ton logement pour ouvrir ta fiche.
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>2</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Copie l'URL depuis la barre d'adresse</div>
              <div style={s.stepDesc}>
                Une fois ta fiche ouverte, regarde la <strong>barre d'adresse du navigateur</strong> en
                haut. Sélectionne-la entièrement (Ctrl/Cmd+A) et copie (Ctrl/Cmd+C). L'URL doit
                commencer par <code style={s.code}>https://www.google.com/maps/place/...</code>
              </div>
            </div>
          </div>

          <div style={s.step}>
            <div style={s.stepNum}>3</div>
            <div style={s.stepBody}>
              <div style={s.stepTitle}>Colle-la dans le champ ci-dessous</div>
              <div style={s.stepDesc}>
                <strong>⚠️ Important</strong> : n'utilise pas le bouton "Partager" de Google Maps,
                il génère un lien raccourci (<code style={s.code}>share.google/...</code>) qui
                n'est pas accepté par l'API officielle. Toujours copier l'URL longue depuis
                la barre d'adresse.
              </div>
            </div>
          </div>
        </div>

        <div style={s.privacyNote}>
          <Info size={14} color="#34d399" weight="fill" />
          <div>
            <strong style={{ color: 'var(--text)' }}>API officielle Google Places</strong> : on
            utilise uniquement les données publiques fournies par Google. Aucun scraping,
            aucun risque légal, aucun coût pour toi.
          </div>
        </div>

        <ImportUrlForm userId={profile?.userId ?? null} />

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

  hero: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,36px)',
    marginBottom: '20px',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: '#34d399', background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.18)',
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
    background: 'rgba(52,211,153,0.12)',
    color: '#34d399',
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
    color: '#34d399', textDecoration: 'none',
    fontWeight: 500,
  },
  code: {
    fontFamily: 'monospace',
    background: 'var(--bg-2, rgba(255,255,255,0.04))',
    padding: '2px 6px', borderRadius: '4px',
    fontSize: '11.5px',
  },

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
