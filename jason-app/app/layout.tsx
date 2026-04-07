import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mon espace — Jason Marinho',
  description: 'Formations, gabarits et ressources pour développer ton activité de location courte durée.',
  robots: 'noindex, nofollow',
  icons: {
    icon: '/favicon-jason.webp',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Anti-flash script: applies stored theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
