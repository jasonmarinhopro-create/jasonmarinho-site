'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatCircleDots } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/client'

interface ChezNousNotifBellProps {
  userId: string
}

export default function ChezNousNotifBell({ userId }: ChezNousNotifBellProps) {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  // Fetch une seule fois au mount (pas à chaque navigation).
  // Économise 50-100ms de RTT Supabase par navigation.
  useEffect(() => {
    setHydrated(true)
    if (!userId) return
    let cancelled = false
    const supabase = createClient()

    supabase
      .from('chez_nous_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null)
      .then(({ count: c }) => {
        if (!cancelled) setCount(c ?? 0)
      })

    return () => { cancelled = true }
  }, [userId])

  // Quand l'utilisateur visite la page notifications, le badge se vide.
  useEffect(() => {
    if (pathname === '/dashboard/chez-nous/notifications') setCount(0)
  }, [pathname])

  return (
    <Link
      href="/dashboard/chez-nous/notifications"
      style={s.btn}
      aria-label={`Notifications Chez Nous${hydrated && count > 0 ? `, ${count} non lue${count > 1 ? 's' : ''}` : ''}`}
      title="Mes notifications Chez Nous"
    >
      <ChatCircleDots size={18} weight={hydrated && count > 0 ? 'fill' : 'regular'} />
      {hydrated && count > 0 && (
        <span style={s.badge}>{count > 9 ? '9+' : count}</span>
      )}
    </Link>
  )
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    position: 'relative',
    width: '36px', height: '36px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none',
  },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    minWidth: '18px', height: '18px', borderRadius: '999px',
    background: '#ef4444', color: '#fff',
    fontSize: '10px', fontWeight: 700, lineHeight: 1,
    padding: '0 5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
