import type { Metadata } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ErrorReporter from '@/components/ErrorReporter'
import { INSTALL_CAPTURE_SCRIPT } from '@/lib/pwa/capture-script'
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

// [largeur, hauteur, ratio] des écrans d'iPhone (portrait), de l'iPhone 8 au 17 Pro Max
const SPLASH_SIZES: Array<[number, number, number]> = [
  [440, 956, 3], [402, 874, 3], [420, 912, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2],
]

export const metadata: Metadata = {
  title: 'Mon espace, Jason Marinho',
  description: 'Formations, gabarits et ressources pour développer ton activité de location courte durée.',
  robots: 'noindex, nofollow',
  applicationName: 'Jason Marinho',
  // iPhone : ajoutée à l'écran d'accueil, l'app s'ouvre en plein écran (sans
  // Safari), condition pour recevoir les notifications sur le téléphone
  // Images de démarrage iPhone (30/09/2026) : affichées dès le toucher de
  // l'icône, avant même le chargement de /ouverture (dernier blanc au
  // lancement). Captures de l'écran de /ouverture par taille d'écran,
  // dans public/splash/ (même écran, donc pas de saut visible).
  appleWebApp: {
    capable: true, title: 'Jason Marinho', statusBarStyle: 'default',
    startupImage: SPLASH_SIZES.map(([w, h, r]) => ({
      url: `/splash/apple-splash-${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  // Les icônes (favicon.ico, icon.png, apple-icon.png) sont auto-détectées
  // par Next.js App Router depuis app/. Pas besoin de les déclarer ici.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" className={`${fraunces.variable} ${outfit.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Anti-flash script: applies stored theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='amoled')document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
        {/* Proposition d'installation (Android, Chrome, Edge) gardée pour le bouton « Installer l'app » */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CAPTURE_SCRIPT }} />
      </head>
      <body>
        {children}
        <ErrorReporter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
