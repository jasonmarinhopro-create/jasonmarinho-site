'use client'

// Système de toast léger pour feedback de mutations dans le dashboard.
//
// Philosophie : pas de toast pour des choses évidentes (navigation, hover,
// expansion d'un détail). Réservé aux actions qui changent un état persistent
// (mark-read, send-email, save) où l'utilisateur doit savoir "ça a marché".
//
// Usage :
//   const toast = useToast()
//   toast.success('Notification archivée')
//   toast.error('Impossible de marquer comme lu')
//
// Position : top-right desktop, top-center mobile. Auto-dismiss 3s. Stack
// max 3 visibles (les plus anciens disparaissent). Click pour dismiss
// immédiatement. `prefers-reduced-motion` respecté.

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, Warning, Info, X } from '@phosphor-icons/react/dist/ssr'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
  durationMs: number
}

interface ToastContextValue {
  show: (message: string, opts?: { variant?: ToastVariant; durationMs?: number }) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const MAX_VISIBLE = 3
const DEFAULT_DURATION = 3000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, opts?: { variant?: ToastVariant; durationMs?: number }) => {
    const id = Date.now() + Math.random()
    const toast: Toast = {
      id,
      message,
      variant: opts?.variant ?? 'info',
      durationMs: opts?.durationMs ?? DEFAULT_DURATION,
    }
    setToasts(prev => {
      const next = [...prev, toast]
      // Cap : on garde les MAX_VISIBLE plus récents
      return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next
    })
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    show,
    success: (m: string) => show(m, { variant: 'success' }),
    error:   (m: string) => show(m, { variant: 'error', durationMs: 5000 }),
    warning: (m: string) => show(m, { variant: 'warning', durationMs: 4000 }),
    info:    (m: string) => show(m, { variant: 'info' }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback no-op : si un composant utilise useToast hors du provider,
    // on log mais on ne crash pas (ex: composant rendu dans un boundary).
    if (typeof window !== 'undefined') {
      console.warn('[useToast] Utilisé hors de <ToastProvider>')
    }
    return {
      show: () => {}, success: () => {}, error: () => {}, warning: () => {}, info: () => {},
    }
  }
  return ctx
}

// ─── Toaster (rendu interne) ──────────────────────────────────────────
function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div role="region" aria-label="Notifications éphémères" aria-live="polite" style={s.container}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs)
    return () => clearTimeout(timer)
  }, [toast.id, toast.durationMs, onDismiss])

  const meta = VARIANT_META[toast.variant]
  return (
    <div
      style={{ ...s.toast, borderColor: meta.color + '40', background: meta.bg }}
      className="toast-item"
      onClick={() => onDismiss(toast.id)}
      role="status"
    >
      <style>{`
        .toast-item {
          animation: toastIn .22s cubic-bezier(.16,1,.3,1);
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px) scale(.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .toast-item { animation: none; }
        }
      `}</style>
      <span aria-hidden="true" style={{ color: meta.color, display: 'inline-flex', flexShrink: 0 }}>
        {meta.icon}
      </span>
      <span style={s.message}>{toast.message}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id) }}
        style={s.closeBtn}
        aria-label="Fermer"
      >
        <X size={11} weight="bold" />
      </button>
    </div>
  )
}

const VARIANT_META: Record<ToastVariant, { color: string; bg: string; icon: React.ReactNode }> = {
  success: { color: 'var(--success-1)', bg: 'rgba(16,185,129,0.10)', icon: <CheckCircle size={16} weight="fill" /> },
  error:   { color: '#f87171',          bg: 'rgba(248,113,113,0.10)', icon: <Warning size={16} weight="fill" /> },
  warning: { color: '#FFD56B',          bg: 'rgba(255,213,107,0.10)', icon: <Warning size={16} weight="fill" /> },
  info:    { color: 'var(--text-2)',    bg: 'var(--surface)',         icon: <Info size={16} weight="fill" /> },
}

const s: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed' as const,
    top: 'calc(var(--header-h, 64px) + 12px)',
    right: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    zIndex: 9999,
    pointerEvents: 'none' as const,
    maxWidth: 'min(360px, calc(100vw - 32px))',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px 10px 14px',
    borderRadius: '12px',
    border: '1px solid',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
    cursor: 'pointer',
    pointerEvents: 'auto' as const,
    fontSize: '13px',
    color: 'var(--text)',
    fontFamily: 'inherit',
  },
  message: {
    flex: 1,
    minWidth: 0,
    lineHeight: 1.4,
    fontWeight: 500,
  },
  closeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '6px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-3)',
    flexShrink: 0,
    padding: 0,
    fontFamily: 'inherit',
  },
}
