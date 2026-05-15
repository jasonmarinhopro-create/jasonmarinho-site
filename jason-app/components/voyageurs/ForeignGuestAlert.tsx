'use client'

import { Warning, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { getCountry } from '@/lib/countries'

type Props = {
  /** Pays du logement (ISO-2) */
  logementPays: string | null | undefined
  /** Nationalité du voyageur (ISO-2). Null = inconnue. */
  voyageurNationalite: string | null | undefined
  /** Date d'arrivée pour afficher la deadline */
  dateArrivee: string | null
  /** Nom du voyageur pour personnaliser */
  voyageurNom?: string
}

// Affiche une alerte légale rappelant l'obligation de déclarer un voyageur
// étranger : SIBA au Portugal, fiche police en France, registres locaux
// pour les autres pays. La règle se déclenche quand la nationalité du
// voyageur diffère du pays du logement (et qu'on a les deux infos).
export default function ForeignGuestAlert({ logementPays, voyageurNationalite, dateArrivee, voyageurNom }: Props) {
  const pays = logementPays ?? 'FR'

  // Cas où on ne peut pas évaluer : on ne montre rien (pas d'alerte spam).
  if (!voyageurNationalite) return null

  // PT exige une déclaration SIBA même pour les ressortissants UE (tous).
  // FR : uniquement les ressortissants HORS UE.
  // Sécurité par défaut : si nationalité ≠ pays du logement → on alerte.
  // (l'hôte décidera ; mieux vaut une alerte de trop qu'une omission)
  if (voyageurNationalite === pays) return null

  const config = getCountry(pays)
  const decl = config.foreignGuestDeclaration

  // Calcul de la deadline si on a la date d'arrivée
  let deadlineLabel: string | null = null
  if (dateArrivee) {
    const arrivee = new Date(dateArrivee + 'T12:00:00')
    const deadline = new Date(arrivee.getTime() + decl.deadlineHours * 3600 * 1000)
    deadlineLabel = deadline.toLocaleDateString(config.locale, {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  return (
    <div style={s.box}>
      <div style={s.head}>
        <Warning size={16} weight="fill" color="#f59e0b" />
        <span style={s.title}>{config.flag} {decl.label}</span>
        <span style={s.badge}>{decl.deadlineHours}h max</span>
      </div>
      <p style={s.text}>
        {voyageurNom ? <><strong>{voyageurNom}</strong> est </> : 'Le voyageur est '}
        de nationalité <strong>{voyageurNationalite}</strong> et séjourne dans ton logement <strong>{config.name}</strong>.
        {' '}{decl.note}
      </p>
      {deadlineLabel && (
        <p style={s.deadline}>
          ⏰ À déclarer avant le <strong>{deadlineLabel}</strong> (soit {decl.deadlineHours}h après l'arrivée).
        </p>
      )}
      {decl.portalUrl && (
        <a href={decl.portalUrl} target="_blank" rel="noopener noreferrer" style={s.link}>
          Accéder au portail officiel <ArrowSquareOut size={11} />
        </a>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  box: {
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.28)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '10px',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '6px', flexWrap: 'wrap' as const,
  },
  title: { fontSize: '13px', fontWeight: 700, color: '#f59e0b' },
  badge: {
    fontSize: '10px', fontWeight: 700,
    padding: '2px 7px', borderRadius: '999px',
    background: 'rgba(245,158,11,0.18)', color: '#f59e0b',
    letterSpacing: '0.3px',
  },
  text: {
    fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55,
    margin: '0 0 6px',
  },
  deadline: {
    fontSize: '12px', color: 'var(--text)', fontWeight: 600,
    margin: '6px 0',
  },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)', textDecoration: 'none',
    marginTop: '4px',
  },
}
