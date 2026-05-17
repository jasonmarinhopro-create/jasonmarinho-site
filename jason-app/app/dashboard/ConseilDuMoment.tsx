'use client'

import Link from 'next/link'
import type { Conseil } from '@/lib/lcd/conseil-du-moment'
import {
  ArrowRight, House, CalendarPlus, WarningOctagon, Percent,
  CalendarCheck, Target, CalendarX, GraduationCap, Trophy, Lightbulb,
} from '@phosphor-icons/react/dist/ssr'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; weight?: 'fill' | 'regular' | 'bold' | 'duotone' }>> = {
  house: House,
  'calendar-plus': CalendarPlus,
  'warning-octagon': WarningOctagon,
  percent: Percent,
  'calendar-check': CalendarCheck,
  target: Target,
  'calendar-x': CalendarX,
  'graduation-cap': GraduationCap,
  trophy: Trophy,
}

interface Props {
  conseil: Conseil | null
}

export default function ConseilDuMoment({ conseil }: Props) {
  if (!conseil) return null

  const Icon = ICON_MAP[conseil.icon] ?? Lightbulb
  const toneStyle = TONE_STYLES[conseil.tone]

  return (
    <div style={{ ...s.wrap, ...toneStyle.wrap }}>
      <div style={s.glow} aria-hidden />
      <div style={s.head}>
        <span style={{ ...s.tag, ...toneStyle.tag }}>
          <Lightbulb size={11} weight="fill" /> Conseil du moment
        </span>
      </div>

      <div style={s.body}>
        <div style={{ ...s.iconWrap, ...toneStyle.iconWrap }}>
          <Icon size={24} weight="duotone" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={s.title}>{conseil.title}</h3>
          <p style={s.desc}>{conseil.body}</p>
        </div>
        <Link href={conseil.ctaHref} style={{ ...s.cta, ...toneStyle.cta }}>
          {conseil.ctaLabel}
          <ArrowRight size={12} weight="bold" />
        </Link>
      </div>
    </div>
  )
}

const TONE_STYLES: Record<Conseil['tone'], { wrap: React.CSSProperties; tag: React.CSSProperties; iconWrap: React.CSSProperties; cta: React.CSSProperties }> = {
  opportunity: {
    wrap: { background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255,213,107,0.06) 100%)', borderColor: 'rgba(255,213,107,0.25)' },
    tag: { color: 'var(--accent-text)', background: 'rgba(255,213,107,0.10)', borderColor: 'rgba(255,213,107,0.22)' },
    iconWrap: { background: 'linear-gradient(135deg, rgba(255,213,107,0.18), rgba(255,213,107,0.05))', color: 'var(--accent-text)' },
    cta: { background: 'var(--accent-text)', color: 'var(--bg)' },
  },
  warning: {
    wrap: { background: 'linear-gradient(135deg, var(--surface) 0%, rgba(251,146,60,0.06) 100%)', borderColor: 'rgba(251,146,60,0.32)' },
    tag: { color: '#fb923c', background: 'rgba(251,146,60,0.10)', borderColor: 'rgba(251,146,60,0.26)' },
    iconWrap: { background: 'linear-gradient(135deg, rgba(251,146,60,0.20), rgba(251,146,60,0.05))', color: '#fb923c' },
    cta: { background: '#fb923c', color: '#fff' },
  },
  neutral: {
    wrap: { background: 'linear-gradient(135deg, var(--surface) 0%, rgba(99,214,131,0.04) 100%)', borderColor: 'var(--border)' },
    tag: { color: 'var(--text-2)', background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)' },
    iconWrap: { background: 'linear-gradient(135deg, rgba(99,214,131,0.16), rgba(99,214,131,0.03))', color: '#5DC077' },
    cta: { background: '#5DC077', color: 'var(--bg)' },
  },
  celebration: {
    wrap: { background: 'linear-gradient(135deg, rgba(99,214,131,0.10) 0%, rgba(255,213,107,0.06) 100%)', borderColor: 'rgba(99,214,131,0.28)' },
    tag: { color: '#5DC077', background: 'rgba(99,214,131,0.12)', borderColor: 'rgba(99,214,131,0.24)' },
    iconWrap: { background: 'linear-gradient(135deg, rgba(99,214,131,0.22), rgba(255,213,107,0.10))', color: '#5DC077' },
    cta: { background: '#5DC077', color: 'var(--bg)' },
  },
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    padding: 'clamp(18px, 2.4vw, 24px)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    marginBottom: 'clamp(18px, 2.5vw, 26px)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '-40%',
    right: '-10%',
    width: '420px',
    height: '420px',
    background: 'radial-gradient(circle, rgba(255,213,107,0.06) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  head: {
    marginBottom: '14px',
    position: 'relative',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    borderRadius: '999px',
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    border: '1px solid',
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(14px, 2vw, 22px)',
    flexWrap: 'wrap',
    position: 'relative',
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(17px, 2.1vw, 22px)',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
    margin: 0,
  },
  desc: {
    fontSize: '13.5px',
    color: 'var(--text-2)',
    lineHeight: 1.55,
    margin: '6px 0 0',
    maxWidth: '640px',
  },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    flexShrink: 0,
    transition: 'all .2s cubic-bezier(.4,0,.2,1)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  },
}
