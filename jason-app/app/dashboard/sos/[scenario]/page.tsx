import { getProfile } from '@/lib/queries/profile'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { SOS_SCENARIOS } from '@/lib/sos/scenarios'
import { ArrowLeft, Warning, Info } from '@phosphor-icons/react/dist/ssr'
import { SCENARIOS_CONTENT } from '@/lib/sos/scenarios-content'
import ScenarioContent from '@/components/sos/ScenarioContent'
import SOSFeedbackBlock from '@/components/sos/SOSFeedbackBlock'

/* Page détail d'un scénario SOS Hôte.
   Le contenu de chaque scénario × canal sera ajouté en Phase 2.
   Pour l'instant : squelette structurel + placeholder.
*/

type Channel = 'airbnb' | 'booking' | 'vrbo' | 'direct'
const CHANNEL_LABELS: Record<Channel, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'Vrbo / Abritel',
  direct: 'Location directe',
}

export default async function ScenarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenario: string }>
  searchParams: Promise<{ canal?: string }>
}) {
  const { scenario } = await params
  const { canal } = await searchParams
  const channel = (canal && ['airbnb', 'booking', 'vrbo', 'direct'].includes(canal) ? canal : 'airbnb') as Channel

  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  // Gate plan : Découverte → redirect vers abonnement
  if (profile.plan === 'decouverte' && profile.role !== 'admin') {
    redirect('/dashboard/abonnement?source=sos-' + scenario)
  }

  const scenarioDef = SOS_SCENARIOS.find(s => s.slug === scenario)
  if (!scenarioDef) notFound()

  const channelSupported = scenarioDef.channels.includes(channel)

  return (
    <div style={s.page}>
      {/* Header retour + titre */}
      <Link href="/dashboard" style={s.backLink}>
        <ArrowLeft size={14} weight="bold" />
        Retour au dashboard
      </Link>

      <div style={s.badge}>
        <Warning size={11} weight="fill" />
        SOS Hôte
      </div>

      <h1 style={s.title}>{scenarioDef.title}</h1>
      <p style={s.subtitle}>{scenarioDef.short}</p>

      {/* Channel switcher sticky */}
      <div style={s.channelStrip}>
        <span style={s.channelLabel}>Canal&nbsp;:</span>
        {(Object.keys(CHANNEL_LABELS) as Channel[]).map(ch => {
          const supported = scenarioDef.channels.includes(ch)
          const active = ch === channel
          return (
            <Link
              key={ch}
              href={supported ? `/dashboard/sos/${scenario}?canal=${ch}` : '#'}
              style={{
                ...s.channelChip,
                ...(active ? s.channelChipActive : {}),
                ...(supported ? {} : s.channelChipDisabled),
              }}
              aria-disabled={!supported}
            >
              {CHANNEL_LABELS[ch]}
            </Link>
          )
        })}
      </div>

      {!channelSupported ? (
        <div style={s.notSupported}>
          <Info size={16} />
          <div>
            <strong>Ce scénario n&apos;est pas applicable sur {CHANNEL_LABELS[channel]}.</strong>
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '4px' }}>
              Bascule sur un autre canal en haut pour voir le pas-à-pas adapté.
            </div>
          </div>
        </div>
      ) : (() => {
        const scenarioContent = SCENARIOS_CONTENT[scenario]?.[channel]
        if (!scenarioContent) {
          // Contenu pas encore rédigé pour cette combinaison → placeholder
          return (
            <div style={s.placeholder}>
              <div style={s.placeholderIcon}>🚧</div>
              <h2 style={s.placeholderTitle}>Contenu en cours de rédaction</h2>
              <p style={s.placeholderText}>
                Le pas-à-pas <strong>{scenarioDef.title}</strong> pour <strong>{CHANNEL_LABELS[channel]}</strong>
                {' '}est en cours de finalisation. Il inclura&nbsp;:
              </p>
              <ul style={s.placeholderList}>
                <li>📅 Le délai critique pour agir</li>
                <li>📋 Le pas-à-pas numéroté avec actions concrètes</li>
                <li>💬 Les templates de messages prêts à copier</li>
                <li>⛔ Les erreurs à NE SURTOUT PAS faire</li>
                <li>⚖️ Les recours additionnels (médiateur, justice…)</li>
                <li>🛡 La prévention pour éviter que ça se reproduise</li>
              </ul>
              <p style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '16px' }}>
                En attendant, contacte directement Jason via le{' '}
                <Link href="/dashboard/aide" style={{ color: 'var(--accent-text)' }}>Centre d&apos;aide</Link>.
              </p>
            </div>
          )
        }
        // Contenu disponible → rendu complet + bloc feedback communauté
        return (
          <>
            <ScenarioContent content={scenarioContent} />
            <div style={{ marginTop: '20px' }}>
              <SOSFeedbackBlock scenario={scenario} channel={channel} />
            </div>
          </>
        )
      })()}

      {/* Disclaimer juridique */}
      <div style={s.disclaimer}>
        <Info size={12} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          Guide pédagogique mis à jour régulièrement. Ce n&apos;est pas un conseil juridique
          personnalisé. Pour les cas complexes ou montants &gt; 5 000 €, consulte un avocat
          spécialisé en droit du tourisme.
        </span>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 32px)',
  },
  backLink: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12.5px', color: 'var(--text-3)',
    textDecoration: 'none',
    width: 'fit-content',
    marginBottom: '14px',
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '10.5px', fontWeight: 700,
    letterSpacing: '0.6px', textTransform: 'uppercase' as const,
    color: '#dc2626',
    background: 'rgba(220,38,38,0.10)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '999px',
    padding: '3px 9px',
    width: 'fit-content',
    marginBottom: '10px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(24px, 3vw, 30px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 8px',
    letterSpacing: '-0.4px',
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-2)',
    margin: '0 0 20px',
    lineHeight: 1.55,
  },
  channelStrip: {
    display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: '6px',
    padding: '10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    marginBottom: '20px',
    position: 'sticky' as const, top: 'calc(var(--header-h) + 8px)',
    zIndex: 5,
  },
  channelLabel: {
    fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    color: 'var(--text-3)', marginRight: '4px',
  },
  channelChip: {
    padding: '6px 12px', borderRadius: '999px',
    border: '1px solid var(--border-2)',
    background: 'var(--bg)',
    color: 'var(--text-2)',
    fontSize: '12.5px',
    textDecoration: 'none',
    transition: 'all 0.12s',
  },
  channelChipActive: {
    background: 'var(--accent-bg-2)',
    borderColor: 'var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  channelChipDisabled: {
    opacity: 0.4, pointerEvents: 'none' as const,
  },

  notSupported: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '16px 18px', borderRadius: '12px',
    background: 'rgba(96,165,250,0.07)',
    border: '1px solid rgba(96,165,250,0.25)',
    color: 'var(--text-2)',
    fontSize: '13px',
    marginBottom: '20px',
  },

  placeholder: {
    padding: '32px 24px',
    background: 'var(--surface)',
    border: '1px dashed var(--border-2)',
    borderRadius: '14px',
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  placeholderIcon: {
    fontSize: '36px', marginBottom: '12px',
  },
  placeholderTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 12px',
  },
  placeholderText: {
    fontSize: '13.5px', color: 'var(--text-2)',
    lineHeight: 1.6, margin: '0 0 16px',
  },
  placeholderList: {
    textAlign: 'left' as const,
    margin: '0 auto', maxWidth: '380px',
    fontSize: '13px', color: 'var(--text-2)',
    lineHeight: 1.9, listStyle: 'none', padding: 0,
  },

  disclaimer: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    padding: '12px 14px',
    background: 'var(--surface-2)',
    borderRadius: '10px',
    fontSize: '11.5px', color: 'var(--text-3)',
    lineHeight: 1.6,
  },
}
