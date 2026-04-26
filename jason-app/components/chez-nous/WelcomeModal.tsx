'use client'

import { useState, useTransition } from 'react'
import { House, Tag, MagnifyingGlass, ChatCircle, ArrowRight, X } from '@phosphor-icons/react'
import { markChezNousOnboarded } from '@/app/dashboard/chez-nous/actions'

const SLIDES = [
  {
    icon: Tag,
    title: 'Des catégories claires',
    text: 'Réglementation, voyageurs, optimisation, entraide locale, études de cas. Chaque discussion est rangée pour que les bonnes infos remontent vite.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Une recherche utile',
    text: 'Trouve immédiatement les sujets qui parlent de ton problème. Tape un mot-clé, combine avec une catégorie ou un tri.',
  },
  {
    icon: ChatCircle,
    title: 'Comment poster',
    text: 'Choisis une catégorie, un titre précis, donne ton contexte. Ajoute des images si nécessaire. Ton message sera visible par tous les hôtes.',
  },
]

export default function WelcomeModal() {
  const [step, setStep] = useState(0)
  const [closed, setClosed] = useState(false)
  const [, startTransition] = useTransition()

  const finish = () => {
    setClosed(true)
    startTransition(async () => {
      await markChezNousOnboarded()
    })
  }

  if (closed) return null

  const slide = SLIDES[step]
  const Icon = slide.icon
  const isLast = step === SLIDES.length - 1

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <button onClick={finish} style={s.closeBtn} aria-label="Fermer">
          <X size={14} />
        </button>

        <div style={s.head}>
          <div style={s.headIcon}>
            <House size={18} color="var(--accent-text)" weight="fill" />
          </div>
          <div>
            <p style={s.lbl}>Bienvenue Chez Nous</p>
            <h2 style={s.title}>L'espace des hôtes LCD</h2>
          </div>
        </div>

        <div style={s.slideBox}>
          <div style={s.slideIcon}>
            <Icon size={26} color="var(--accent-text)" weight="duotone" />
          </div>
          <h3 style={s.slideTitle}>{slide.title}</h3>
          <p style={s.slideText}>{slide.text}</p>
        </div>

        <div style={s.dots}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{ ...s.dot, background: i === step ? 'var(--accent-text)' : 'var(--border)' }} />
          ))}
        </div>

        <div style={s.actions}>
          <button onClick={finish} style={s.btnGhost}>Passer</button>
          <button
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
            style={s.btnPrimary}
          >
            {isLast ? "C'est parti" : 'Suivant'}
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', zIndex: 1000,
  },
  modal: {
    position: 'relative',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '28px',
    width: '100%', maxWidth: '440px',
    display: 'flex', flexDirection: 'column', gap: '18px',
  },
  closeBtn: {
    position: 'absolute', top: '14px', right: '14px',
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    width: '28px', height: '28px', borderRadius: '6px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  head: { display: 'flex', alignItems: 'center', gap: '12px' },
  headIcon: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'rgba(255,213,107,0.10)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lbl: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const,
    color: 'var(--accent-text)', margin: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '20px', fontWeight: 400, color: 'var(--text)',
    margin: '2px 0 0',
  },
  slideBox: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    alignItems: 'flex-start',
  },
  slideIcon: {
    width: '48px', height: '48px', borderRadius: '12px',
    background: 'rgba(255,213,107,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  slideTitle: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)',
    margin: '6px 0 0',
  },
  slideText: {
    fontSize: '13.5px', lineHeight: 1.65, color: 'var(--text-2)',
    margin: 0,
  },
  dots: {
    display: 'flex', justifyContent: 'center', gap: '6px',
  },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    transition: 'background 0.2s',
  },
  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '4px',
  },
  btnGhost: {
    background: 'transparent', color: 'var(--text-muted)',
    border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500,
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#ffd56b', color: '#1a1a0e',
    border: 'none', borderRadius: '10px',
    padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
}
