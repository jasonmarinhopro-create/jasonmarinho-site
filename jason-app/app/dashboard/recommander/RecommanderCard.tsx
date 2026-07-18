'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Heart, CheckCircle, Warning, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { recommendPro, type ProType } from './actions'

interface Props {
  proType: ProType
  proId: string
  initial: { error: string } | { name: string; ville: string | null; alreadyRecommended: boolean }
}

export default function RecommanderCard({ proType, proId, initial }: Props) {
  const [done, setDone] = useState('error' in initial ? false : initial.alreadyRecommended)
  const [error, setError] = useState('error' in initial ? initial.error : '')
  const [isPending, startTransition] = useTransition()

  const metier = proType === 'cleaner' ? 'équipe ménage' : 'photographe'

  function submit() {
    startTransition(async () => {
      const res = await recommendPro(proType, proId)
      if (res.error) setError(res.error)
      else setDone(true)
    })
  }

  if (error && !('name' in initial)) {
    return (
      <div style={s.card}>
        <Warning size={32} color="var(--warning)" />
        <h1 style={s.title}>Fiche introuvable</h1>
        <p style={s.text}>{error}</p>
        <Link href="/dashboard" style={s.backLink}><ArrowLeft size={13} weight="bold" /> Retour au dashboard</Link>
      </div>
    )
  }

  const name = 'name' in initial ? initial.name : ''
  const ville = 'name' in initial ? initial.ville : null

  return (
    <div style={s.card}>
      {done ? (
        <>
          <CheckCircle size={36} weight="fill" color="var(--success-1)" />
          <h1 style={s.title}>Merci pour ta recommandation !</h1>
          <p style={s.text}>
            Le badge « Recommandé par des hôtes » de <strong style={{ color: 'var(--text)' }}>{name}</strong> se
            mettra à jour sur sa fiche publique d&apos;ici quelques minutes. C&apos;est
            ce genre de preuve sociale qui aide les bons pros à vivre de leur travail. 💛
          </p>
          <Link href="/dashboard" style={s.backLink}><ArrowLeft size={13} weight="bold" /> Retour au dashboard</Link>
        </>
      ) : (
        <>
          <span style={s.heartWrap}><Heart size={26} weight="fill" color="#f472b6" /></span>
          <h1 style={s.title}>Recommander {name} ?</h1>
          <p style={s.text}>
            Tu confirmes avoir travaillé avec ce {metier}{ville ? ` (${ville})` : ''} et
            tu le recommandes aux autres hôtes. Ta recommandation est anonyme :
            seule la mention « Recommandé par N hôtes » apparaît sur la fiche.
          </p>
          {error && <p style={{ ...s.text, color: 'var(--danger)' }}>{error}</p>}
          <button onClick={submit} disabled={isPending} style={{ ...s.btn, opacity: isPending ? 0.6 : 1 }}>
            <Heart size={14} weight="fill" />
            {isPending ? 'Enregistrement…' : 'Oui, je recommande'}
          </button>
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: 440, width: '100%', textAlign: 'center' as const,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: 16, padding: '36px 28px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 14,
  },
  heartWrap: {
    width: 54, height: 54, borderRadius: 16,
    background: 'rgba(244,114,182,0.10)', border: '1px solid rgba(244,114,182,0.25)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 22, fontWeight: 400, color: 'var(--text)', margin: 0,
  },
  text: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '11px 22px', borderRadius: 10, marginTop: 6,
    fontSize: 14, fontWeight: 600,
    color: 'var(--bg)', background: 'var(--accent-text)',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12.5, color: 'var(--text-2)', textDecoration: 'none', marginTop: 4,
  },
}
