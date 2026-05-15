import type { Metadata } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fraunces',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Mon espace, Jason Marinho',
  description: 'Formations, gabarits et ressources pour développer ton activité de location courte durée.',
  robots: 'noindex, nofollow',
  // Les icônes (favicon.ico, icon.png, apple-icon.png) sont auto-détectées
  // par Next.js App Router depuis app/. Pas besoin de les déclarer ici.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" className={`${fraunces.variable} ${outfit.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Anti-flash script: applies stored theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='amoled')document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
