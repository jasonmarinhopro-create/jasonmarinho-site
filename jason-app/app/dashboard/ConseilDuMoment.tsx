'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Conseil } from '@/lib/lcd/conseil-du-moment'
import {
  ArrowRight, House, CalendarPlus, WarningOctagon, Percent,
  CalendarCheck, Target, CalendarX, GraduationCap, Trophy, Lightbulb,
  X, DotsThree, Medal, CalendarBlank, ShieldCheck, EnvelopeSimple,
  ChartLineUp, CurrencyEur, UsersThree, TrendUp,
} from '@phosphor-icons/react/dist/ssr'

// React.ElementType : accepte n'importe quel composant React (les icons
// Phosphor sont des ForwardRefExoticComponent<IconProps> qui ne matchent
// pas un type strict). Pragmatique pour un map de lookup.
const ICON_MAP: Record<string, React.ElementType> = {
  house: House,
  'calendar-plus': CalendarPlus,
  'warning-octagon': WarningOctagon,
  percent: Percent,
  'calendar-check': CalendarCheck,
  target: Target,
  'calendar-x': CalendarX,
  'graduation-cap': GraduationCap,
  trophy: Trophy,
  medal: Medal,
  'calendar-blank': CalendarBlank,
  'shield-check': ShieldCheck,
  'envelope-simple': EnvelopeSimple,
  'chart-line-up': ChartLineUp,
  'currency-eur': CurrencyEur,
  'users-three': UsersThree,
  'trend-up': TrendUp,
}

const LS_DISMISSED_KEY = 'jm:conseil:dismissed:v1'
const LS_DISABLED_KEY = 'jm:conseil:disabled:v1'

interface Props {
  /** Liste des conseils applicables, en ordre de priorité.
   *  Rétrocompat : accepte aussi `conseil` (singulier). */
  conseils?: Conseil[] | null
  conseil?: Conseil | null
}

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DISMISSED_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? new Set(arr.filter((v): v is string => typeof v === 'string')) : new Set()
  } catch { return new Set() }
}

function writeDismissed(s: Set<string>) {
  try { localStorage.setItem(LS_DISMISSED_KEY, JSON.stringify(Array.from(s))) } catch {}
}

/** Index de semaine depuis epoch (UTC) — sert à faire tourner les
 *  conseils "evergreen" pour ne pas voir toujours le même. */
function weekIndex(): number {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
}

/** Place les conseils "non urgents" (neutral/opportunity sans warning)
 *  en rotation hebdomadaire pour éviter l'effet "toujours le même".
 *  Les conseils tone='warning' restent en haut (urgents = priorité). */
function rotateEvergreen(list: Conseil[]): Conseil[] {
  const urgent = list.filter(c => c.tone === 'warning')
  const evergreen = list.filter(c => c.tone !== 'warning')
  if (evergreen.length <= 1) return [...urgent, ...evergreen]
  const offset = weekIndex() % evergreen.length
  const rotated = [...evergreen.slice(offset), ...evergreen.slice(0, offset)]
  return [...urgent, ...rotated]
}

export default function ConseilDuMoment({ conseils, conseil }: Props) {
  // Normalise l'input : conseils[] prioritaire, sinon conseil singulier.
  const list = useMemo<Conseil[]>(() => {
    if (Array.isArray(conseils)) return conseils
    if (conseil) return [conseil]
    return []
  }, [conseils, conseil])

  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [disabled, setDisabled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Hydratation : lit localStorage côté client uniquement.
  useEffect(() => {
    setMounted(true)
    setDismissed(readDismissed())
    try { setDisabled(localStorage.getItem(LS_DISABLED_KEY) === '1') } catch {}
  }, [])

  // Ferme le menu au click outside.
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Conseil affiché = 1er non-dismissé après rotation evergreen.
  const current = useMemo(() => {
    if (!mounted) return list[0] ?? null
    const rotated = rotateEvergreen(list)
    return rotated.find(c => !dismissed.has(c.id)) ?? null
  }, [list, dismissed, mounted])

  // SSR ou utilisateur a désactivé ou rien à afficher → null.
  if (disabled || !current) return null

  function dismiss() {
    if (!current) return
    const next = new Set(dismissed)
    next.add(current.id)
    setDismissed(next)
    writeDismissed(next)
  }

  function disableAll() {
    setDisabled(true)
    setMenuOpen(false)
    try { localStorage.setItem(LS_DISABLED_KEY, '1') } catch {}
  }

  function resetDismissed() {
    setDismissed(new Set())
    writeDismissed(new Set())
    setMenuOpen(false)
  }

  const Icon = ICON_MAP[current.icon] ?? Lightbulb
  const toneStyle = TONE_STYLES[current.tone]

  return (
    <div style={{ ...s.wrap, ...toneStyle.wrap }} data-tour="conseil">
      <style>{`
        @media (max-width: 640px) {
          .conseil-body {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .conseil-body > .conseil-text {
            min-width: 0;
            text-align: left;
          }
          .conseil-cta {
            width: 100%;
            justify-content: center;
            padding: 12px 16px !important;
            font-size: 14px !important;
          }
        }
        .conseil-action-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-2);
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .15s ease;
          padding: 0;
        }
        .conseil-action-btn:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text);
          border-color: rgba(255,255,255,0.18);
        }
        .conseil-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          background: transparent;
          border: 0;
          padding: 9px 12px;
          font-size: 12.5px;
          color: var(--text);
          cursor: pointer;
          border-radius: 6px;
          transition: background .12s ease;
        }
        .conseil-menu-item:hover { background: rgba(255,255,255,0.06); }
        .conseil-menu-item.danger { color: var(--warning); }
      `}</style>
      <div style={s.glow} aria-hidden />

      {/* Actions (top-right) : menu "..." + croix dismiss */}
      <div style={s.actions}>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="conseil-action-btn"
            aria-label="Options des conseils"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen && (
            <div role="menu" style={s.menu}>
              <button type="button" className="conseil-menu-item" onClick={resetDismissed}>
                Réafficher les conseils masqués
              </button>
              <button type="button" className="conseil-menu-item danger" onClick={disableAll}>
                Ne plus afficher de conseils
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="conseil-action-btn"
          aria-label="Masquer ce conseil"
          title="Masquer ce conseil"
          onClick={dismiss}
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      <div style={s.head}>
        <span style={{ ...s.tag, ...toneStyle.tag }}>
          <Lightbulb size={11} weight="fill" /> Conseil du moment
        </span>
      </div>

      <div style={s.body} className="conseil-body">
        <div style={{ ...s.iconWrap, ...toneStyle.iconWrap }}>
          <Icon size={24} weight="duotone" />
        </div>
        <div className="conseil-text" style={{ flex: 1, minWidth: 0 }}>
          <h3 style={s.title}>{current.title}</h3>
          <p style={s.desc}>{current.body}</p>
        </div>
        <Link href={current.ctaHref} className="conseil-cta" style={{ ...s.cta, ...toneStyle.cta }}>
          {current.ctaLabel}
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
    wrap: { background: 'linear-gradient(135deg, var(--surface) 0%, rgba(251,191,36,0.06) 100%)', borderColor: 'rgba(251,191,36,0.32)' },
    tag: { color: 'var(--warning)', background: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.26)' },
    iconWrap: { background: 'linear-gradient(135deg, rgba(251,191,36,0.20), rgba(251,191,36,0.05))', color: 'var(--warning)' },
    cta: { background: 'var(--warning)', color: '#1f1300' },
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
  actions: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    zIndex: 2,
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: '220px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '4px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.32)',
    zIndex: 10,
  },
  head: {
    marginBottom: '14px',
    position: 'relative',
    paddingRight: '70px', // évite le chevauchement avec les boutons d'actions
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
