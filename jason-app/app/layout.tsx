import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'Mon espace — Jason Marinho',
  description: 'Formations, gabarits et ressources pour développer ton activité de location courte durée.',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
