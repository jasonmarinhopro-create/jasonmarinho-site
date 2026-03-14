'use client'

import { useState, useTransition } from 'react'
import { PaperPlaneRight, Check } from '@phosphor-icons/react'
import { saveSuggestion } from '@/app/actions/suggestions'

export default function FormationsSuggestForm() {
  const [topic, setTopic] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    setError('')

    startTransition(async () => {
      const res = await saveSuggestion('formation', topic)
      if (res.error) {
        setError(res.error.includes('TABLE_MISSING') || res.error.includes('pas encore configurée')
          ? '⚠️ Base non configurée — exécute supabase-migration.sql dans Supabase.'
          : res.error)
        return
      }
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div style={styles.success}>
        <Check size={18} color="#34D399" weight="bold" />
        <span>Merci ! Ta suggestion a bien été envoyée.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Ex : Comment gérer les voyageurs difficiles, fiscalité de la LCD, créer une conciergerie..."
        style={styles.textarea}
        rows={3}
        required
      />
      {error && <p style={styles.error}>{error}</p>}
      <button
        type="submit"
        disabled={isPending || !topic.trim()}
        className="btn-primary"
        style={{ fontSize: '13px', padding: '10px 18px', alignSelf: 'flex-start' }}
      >
        <PaperPlaneRight size={14} weight="bold" />
        {isPending ? 'Envoi...' : 'Suggérer ce sujet'}
      </button>
    </form>
  )
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    flex: '0 0 320px', minWidth: '240px',
  },
  textarea: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '12px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#f0f4ff',
    outline: 'none', resize: 'vertical' as const,
  },
  error: { fontSize: '13px', color: '#F87171' },
  success: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '14px', color: '#34D399', fontWeight: 500,
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '10px', padding: '14px 18px',
    flex: '0 0 320px', minWidth: '240px',
  },
}
