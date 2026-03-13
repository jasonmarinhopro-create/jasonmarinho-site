'use client'

import { useState, useTransition } from 'react'
import { PaperPlaneRight, Check } from '@phosphor-icons/react'

export default function FormationsSuggestForm() {
  const [topic, setTopic] = useState('')
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim() || topic.trim().length < 5) return

    startTransition(async () => {
      // Enregistrement dans la table formation_suggestions (à créer)
      // Pour l'instant, on simule le succès — à brancher sur Supabase
      await new Promise(r => setTimeout(r, 600))
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
      <button
        type="submit"
        disabled={isPending || topic.trim().length < 5}
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
  success: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '14px', color: '#34D399', fontWeight: 500,
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
    borderRadius: '10px', padding: '14px 18px',
    flex: '0 0 320px', minWidth: '240px',
  },
}
