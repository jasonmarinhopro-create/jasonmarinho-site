'use client'

// Lien « Installer l'app » vers la page guidée /installer, masqué quand la
// page est déjà ouverte dans l'app installée.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DeviceMobile } from '@phosphor-icons/react/dist/ssr'
import { isAppStandalone } from '@/lib/pwa/install-client'

export default function InstallAppLink({ label = 'Installer l\'app sur mon téléphone', style, onClick }: { label?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const [show, setShow] = useState(false)
  useEffect(() => { setShow(!isAppStandalone()) }, [])
  if (!show) return null
  return (
    <Link href="/installer" onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...style }}>
      <DeviceMobile size={15} weight="bold" /> {label}
    </Link>
  )
}
