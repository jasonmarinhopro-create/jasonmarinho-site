'use client'

import { useEffect, useState, useTransition } from 'react'
import { Newspaper, Warning } from '@phosphor-icons/react/dist/ssr'
import { SectionCard, f } from './ProfilForm'
import { getNewsletterStatus, setNewsletterSubscription } from './actions'
import type { NewsletterStatus } from '@/lib/newsletter/account'

// Interrupteur « Recevoir Le Check-in » (11/10/2026, demande de Jason) : pour
// s'abonner après coup quand la case de l'inscription n'a pas été cochée, ou se
// désabonner sans chercher le lien en bas d'une lettre. L'état est lu chez
// Brevo après l'affichage de la page (pour ne pas la ralentir).

export default function NewsletterCard() {
  const [status, setStatus] = useState<NewsletterStatus | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [pending, start] = useTransition()

  useEffect(() => {
    let alive = true
    getNewsletterStatus().then(r => {
      if (!alive) return
      if (r.status) setStatus(r.status)
      else setError(r.error ?? 'Impossible de lire ton abonnement pour le moment.')
    }).catch(() => alive && setError('Impossible de lire ton abonnement pour le moment.'))
    return () => { alive = false }
  }, [])

  function toggle() {
    if (!status || pending) return
    const next = !status.subscribed
    const prev = status
    setError(''); setSaved('')
    setStatus({ ...status, subscribed: next })
    start(async () => {
      const r = await setNewsletterSubscription(next).catch(() => ({ error: 'Ton choix n’a pas pu être enregistré. Réessaie dans un instant.' } as { status?: NewsletterStatus; error?: string }))
      if (r.status) {
        setStatus(r.status)
        setSaved(next ? 'C’est noté : la prochaine lettre arrivera dans ta boîte.' : 'C’est noté : tu ne recevras plus la lettre.')
        setTimeout(() => setSaved(''), 4000)
      } else {
        setStatus(prev)
        setError(r.error ?? 'Ton choix n’a pas pu être enregistré.')
      }
    })
  }

  const on = !!status?.subscribed
  const loading = !status && !error

  return (
    <SectionCard
      anchorId="newsletter"
      icon={<Newspaper size={20} weight="fill" />}
      iconColor="var(--accent-text)"
      iconBg="var(--accent-bg)"
      title="Le Check-in, la lettre du mois"
      description="Ce qui a changé pour ta location, en 5 minutes de lecture."
    >
      <div style={s.row}>
        <div style={{ minWidth: 0 }}>
          <div style={s.label}>Recevoir la lettre</div>
          <div style={s.note}>
            {loading ? 'Vérification de ton abonnement…' : status ? status.note : 'Un mail par mois, le premier mardi.'}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Recevoir la lettre Le Check-in"
          onClick={toggle}
          disabled={!status || pending}
          style={{
            ...s.switch,
            background: on ? 'var(--accent-text)' : 'var(--surface-2)',
            border: `1px solid ${on ? 'var(--accent-text)' : 'var(--border-2, var(--border))'}`,
            opacity: !status ? 0.5 : 1,
            cursor: !status || pending ? 'default' : 'pointer',
          }}
        >
          <span style={{ ...s.knob, transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
      </div>

      {saved && <div style={s.saved}>{saved}</div>}
      {error && <div style={{ ...f.errorBox, marginTop: '12px' }}><Warning size={13} />{error}</div>}
      {status?.partial && !error && (
        <div style={s.hint}>Brevo ne répond pas pour le moment : l’état affiché vient de ton compte.</div>
      )}

      <p style={s.legal}>
        Envoyée avec Brevo. Un lien de désinscription est aussi en bas de chaque lettre. Tes e-mails liés à tes contrats et paiements ne changent pas.
      </p>
    </SectionCard>
  )
}

const s: Record<string, React.CSSProperties> = {
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  label: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  note: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  switch: {
    position: 'relative', flexShrink: 0, width: '46px', height: '26px', borderRadius: '999px', padding: 0,
    transition: 'background 0.15s ease',
  },
  knob: {
    position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', borderRadius: '50%',
    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform 0.15s ease',
  },
  saved: {
    marginTop: '12px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
  },
  hint: { marginTop: '10px', fontSize: '12px', color: 'var(--text-3)' },
  legal: { margin: '14px 0 0', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 },
}
