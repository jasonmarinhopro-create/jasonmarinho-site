'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatCircleDots } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/client'

export default function ChezNousNotifBell() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    let cancelled = false
    const supabase = createClient()

    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { count: c } = await supabase
        .from('chez_nous_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null)
      if (!cancelled) setCount(c ?? 0)
    }

    fetchCount()
    return () => { cancelled = true }
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
